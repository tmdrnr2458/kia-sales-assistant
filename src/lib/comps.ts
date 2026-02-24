import type { CompEntry, CompStats, BodyStyleType } from '@/types';

// ── Percentile helper ─────────────────────────────────────────────────────────

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const idx = (pct / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

// ── Mileage depreciation rate ─────────────────────────────────────────────────
//
// This is the dollar-per-mile adjustment applied when the subject vehicle's
// mileage differs from the average comp mileage.  Lower rates reflect vehicles
// that hold value better per additional mile.

export function getMileageRatePerMile(
  bodyStyle: BodyStyleType,
  make?: string,
): number {
  const m = (make ?? '').toLowerCase();

  // Toyota and Lexus body-on-frame SUVs / trucks (4Runner, Land Cruiser, Sequoia,
  // Tacoma, Tundra, GX) hold value unusually well — depreciation per mile is low.
  if (m.includes('toyota') || m.includes('lexus')) {
    if (bodyStyle === 'suv' || bodyStyle === 'truck') return 0.07;
  }

  // Jeep Wrangler also bucks normal depreciation curves.
  if (m.includes('jeep')) {
    if (bodyStyle === 'suv') return 0.07;
  }

  switch (bodyStyle) {
    case 'truck': return 0.08;
    case 'suv':   return 0.10;
    case 'van':   return 0.09;
    case 'coupe': return 0.11;
    case 'sedan':
    case 'hatchback':
    case 'wagon': return 0.13;
    default:      return 0.10;
  }
}

// ── Comp stats computation ────────────────────────────────────────────────────

export function computeCompStats(
  comps: CompEntry[],
  subjectMileage: number,
  bodyStyle: BodyStyleType,
  make?: string,
): CompStats | null {
  // Only use comps that have both price and mileage
  const valid = comps.filter(
    (c): c is CompEntry & { price: number; mileage: number } =>
      typeof c.price === 'number' && c.price > 500 &&
      typeof c.mileage === 'number' && c.mileage >= 0,
  );

  if (valid.length < 3) return null;

  const sortedPrices = [...valid.map((c) => c.price)].sort((a, b) => a - b);
  const avgMileage = valid.reduce((sum, c) => sum + c.mileage, 0) / valid.length;

  const median = percentile(sortedPrices, 50);
  const p25    = percentile(sortedPrices, 25);
  const p75    = percentile(sortedPrices, 75);

  const rate = getMileageRatePerMile(bodyStyle, make);

  // Positive delta = subject has MORE miles than comps → lower adjusted value
  const mileageDelta = subjectMileage - avgMileage;
  const adjustedValue = Math.max(1000, Math.round(median - mileageDelta * rate));

  return {
    count: valid.length,
    median: Math.round(median),
    p25: Math.round(p25),
    p75: Math.round(p75),
    avgMileage: Math.round(avgMileage),
    adjustedValue,
    ratePerMile: rate,
  };
}

// ── Price-relative-to-comp-range label ───────────────────────────────────────

export function compRangeLabel(
  askingPrice: number,
  stats: CompStats,
): { label: string; color: 'green' | 'amber' | 'red' } {
  if (askingPrice < stats.p25) {
    return { label: 'Below Market — Great Deal', color: 'green' };
  }
  if (askingPrice <= stats.median) {
    return { label: 'Good Deal', color: 'green' };
  }
  if (askingPrice <= stats.p75) {
    return { label: 'Fair Price', color: 'amber' };
  }
  const pctOver = ((askingPrice - stats.p75) / stats.p75) * 100;
  if (pctOver > 15) {
    return { label: 'Overpriced', color: 'red' };
  }
  return { label: 'Priced High', color: 'amber' };
}
