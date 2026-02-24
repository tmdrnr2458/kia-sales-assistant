import { NextRequest, NextResponse } from 'next/server';
import type { VehicleData } from '@/types';

const FETCH_TIMEOUT_MS = 8000;

function extractFromHtml(html: string): Partial<VehicleData> {
  const result: Partial<VehicleData> = {};

  // Title: try og:title, then <title>
  const ogTitle =
    html.match(/property=["']og:title["'][^>]*content=["']([^"']{1,200})["']/i)?.[1] ??
    html.match(/content=["']([^"']{1,200})["'][^>]*property=["']og:title["']/i)?.[1] ??
    html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1];
  if (ogTitle) result.title = ogTitle.trim();

  // Description
  const ogDesc =
    html.match(/property=["']og:description["'][^>]*content=["']([^"']{1,400})["']/i)?.[1] ??
    html.match(/content=["']([^"']{1,400})["'][^>]*property=["']og:description["']/i)?.[1];
  if (ogDesc) result.description = ogDesc.trim();

  // Price patterns — prefer the largest standalone dollar amount
  const priceMatches = Array.from(
    html.matchAll(/\$\s*([\d,]{4,8})(?:\.\d{2})?(?!\s*\/\s*mo)/g),
  );
  if (priceMatches.length > 0) {
    const prices = priceMatches
      .map((m) => parseInt(m[1].replace(/,/g, ''), 10))
      .filter((p) => p >= 1000 && p <= 500000);
    if (prices.length > 0) {
      // Use median to avoid outliers
      prices.sort((a, b) => a - b);
      result.price = prices[Math.floor(prices.length / 2)];
    }
  }

  // Mileage
  const mileageMatch =
    html.match(/([\d,]{4,7})\s*(?:miles?|mi\.?)\b/i) ??
    html.match(/mileage[^0-9]{0,20}([\d,]{4,7})/i);
  if (mileageMatch) {
    const miles = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
    if (miles > 100 && miles < 500000) result.mileage = miles;
  }

  // Year (1985-2030 range)
  const titleText = result.title ?? '';
  const yearMatch =
    titleText.match(/\b(19[89]\d|20[012]\d)\b/) ??
    html.match(/\b(19[89]\d|20[012]\d)\b/);
  if (yearMatch) result.year = parseInt(yearMatch[1], 10);

  // VIN (17-char alphanum, no I/O/Q)
  const vinMatch = html.match(/\b([A-HJ-NPR-Z0-9]{17})\b/);
  if (vinMatch) result.vin = vinMatch[1];

  // Make — scan title first, then body
  const MAKES = [
    'Toyota', 'Honda', 'Kia', 'Ford', 'Chevrolet', 'Chevy', 'GMC', 'Dodge',
    'Ram', 'Jeep', 'Nissan', 'Hyundai', 'Subaru', 'Mazda', 'Volkswagen', 'VW',
    'BMW', 'Mercedes', 'Mercedes-Benz', 'Lexus', 'Acura', 'Infiniti', 'Cadillac',
    'Buick', 'Lincoln', 'Volvo', 'Audi', 'Porsche', 'Land Rover', 'Jaguar',
    'Mitsubishi', 'Chrysler', 'Genesis',
  ];
  const makePattern = new RegExp(`\\b(${MAKES.join('|')})\\b`, 'i');
  const makeMatch = (titleText + ' ' + (result.description ?? '')).match(makePattern);
  if (makeMatch) {
    const raw = makeMatch[1];
    result.make = raw === 'Chevy' ? 'Chevrolet' : raw === 'VW' ? 'Volkswagen' : raw;
  }

  // Hints: accident, owners
  if (/accident\s+reported|reported\s+accident/i.test(html)) {
    result.accidentHint = true;
  } else if (/no\s+accidents?\s+reported|clean\s+carfax|0\s+accident/i.test(html)) {
    result.accidentHint = false;
  }

  const ownerOneMatch = /\b1[-\s]?owner\b|one[-\s]?owner/i.test(html);
  if (ownerOneMatch) result.ownerHint = 1;
  const ownerTwoMatch = html.match(/\b([23])\s*(?:previous\s+)?owners?\b/i);
  if (ownerTwoMatch) result.ownerHint = parseInt(ownerTwoMatch[1], 10);

  return result;
}

export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const rawUrl = body.url?.trim();
  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Validate URL
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return NextResponse.json({ error: 'Only http/https URLs are allowed' }, { status: 400 });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });

    clearTimeout(timer);

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          partial: true,
          error: `Site returned ${response.status}`,
          message: 'Could not read the listing. Please enter vehicle details below.',
        },
        { status: 200 },
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html')) {
      return NextResponse.json(
        {
          success: false,
          partial: true,
          error: 'Unexpected content type',
          message: 'Please enter vehicle details manually.',
        },
        { status: 200 },
      );
    }

    // Limit HTML read to 500 KB to avoid memory issues
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body');
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 512 * 1024;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        totalBytes += value.length;
        if (totalBytes >= MAX_BYTES) break;
      }
    }
    reader.cancel();
    const html = new TextDecoder('utf-8', { fatal: false }).decode(
      Buffer.concat(chunks),
    );

    const data = extractFromHtml(html);

    // Determine if we got useful data
    const hasUseful = !!(data.price || data.year || data.make);

    return NextResponse.json({
      success: hasUseful,
      partial: !hasUseful,
      message: hasUseful
        ? 'Listing data extracted — please verify below.'
        : 'Limited data found. Please complete the form manually.',
      data,
    });
  } catch (err) {
    clearTimeout(timer);
    const message =
      err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out. The listing site may be blocking automated access.'
        : 'Could not fetch the listing. Please enter vehicle details manually.';

    return NextResponse.json(
      { success: false, partial: true, error: 'Fetch failed', message },
      { status: 200 },
    );
  }
}
