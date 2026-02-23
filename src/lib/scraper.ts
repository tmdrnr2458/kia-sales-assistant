/**
 * Fred Anderson Pre-Owned Inventory Fetcher
 *
 * Uses the public DDC (Dealer.com) inventory API used by kiaofraleigh.com.
 * - Public JSON API — no login, no session, no automation of private pages
 * - Rate-limited between pages (default 2s)
 * - Results cached in SQLite (default 4h TTL)
 * - Only fetches the three authorized dealership locations
 */

import axios from "axios";
import { prisma } from "./prisma";

const DELAY_MS = parseInt(process.env.SCRAPER_DELAY_MS ?? "2000");
const REFRESH_MS = parseInt(process.env.INVENTORY_REFRESH_MS ?? "14400000"); // 4h
const BASE_URL = "https://www.kiaofraleigh.com";
const INVENTORY_PAGE_URL = `${BASE_URL}/used-inventory/index.htm`;

// Only pull inventory from these three locations
const ALLOWED_ACCOUNTS = ["fredandersonkia", "nissanraleigh", "toyotaraleigh"] as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ─── DDC API request body ──────────────────────────────────────────────────────
// DDC uses offset-based pagination via `pageStart` (0-indexed), not pageNum.
function buildRequestBody(pageStart: number, pageSize = 100) {
  return {
    siteId: "fredandersonkia",
    locale: "en_US",
    device: "DESKTOP",
    pageAlias: "INVENTORY_LISTING_DEFAULT_AUTO_USED",
    pageId: "fredandersonkia_SITEBUILDER_INVENTORY_SEARCH_RESULTS_AUTO_USED_V1_1",
    windowId: "inventory-data-bus2",
    widgetName: "ws-inv-data",
    inventoryParameters: {
      accountId: [...ALLOWED_ACCOUNTS],
    },
    preferences: {
      pageSize: String(pageSize),
      "listing.config.id": "auto-used",
      sorts: "year,odometer,internetPrice",
      "required.display.attributes": [
        "accountId", "accountName", "year", "make", "model", "trim",
        "stockNumber", "vin", "internetPrice", "salePrice", "askingPrice",
        "msrp", "retailValue", "odometer", "mileage", "exteriorColor",
        "extColor", "interiorColor", "type", "condition", "certified",
        "link", "uuid", "status", "bodyStyle", "transmission", "engine",
        "engineSize", "fuelType", "driveLine", "cityMpg", "highwayMpg",
        "daysOnLot", "carfaxIconUrl", "carfaxUrl", "comments", "options",
      ].join(","),
    },
    includePricing: true,
    pageStart,
  };
}

// ─── Parse a raw DDC vehicle object ──────────────────────────────────────────
interface RawVehicle {
  year: number;
  make: string;
  model: string;
  trim?: string;
  stockNumber: string;
  vin?: string;
  type: string;
  condition?: string;
  accountId: string;
  certified?: boolean;
  images?: { uri: string; alt?: string }[];
  link?: string;
  uuid?: string;
  pricing?: {
    retailPrice?: string;
    dprice?: { value: string; typeClass: string; isFinalPrice?: boolean }[];
  };
  trackingAttributes?: { name: string; value: string; normalizedValue?: string }[];
  attributes?: { name: string; value: string; label?: string }[];
}

function parsePrice(vehicle: RawVehicle): number | null {
  try {
    const p = vehicle.pricing;
    if (!p) return null;
    // Prefer the final price from dprice array
    const finalPrice = p.dprice?.find((d) => d.isFinalPrice);
    const raw = finalPrice?.value ?? p.retailPrice;
    if (!raw) return null;
    return parseInt(raw.replace(/[^0-9]/g, ""), 10) || null;
  } catch {
    return null;
  }
}

function getTrackAttr(vehicle: RawVehicle, name: string): string | null {
  return (
    vehicle.trackingAttributes?.find((t) => t.name === name)?.value ?? null
  );
}

function getPhotos(vehicle: RawVehicle): string[] {
  if (!vehicle.images) return [];
  return vehicle.images
    .map((img) => {
      const uri = img.uri ?? "";
      // Filter out placeholder images
      if (!uri || uri.includes("no-photo") || uri.includes("placeholder")) return "";
      return uri.startsWith("http") ? uri : `${BASE_URL}${uri}`;
    })
    .filter(Boolean);
}

function buildVdpUrl(vehicle: RawVehicle): string | null {
  // The API doesn't always return `link`, build it from uuid if available
  if (vehicle.link && !vehicle.link.includes("undefined")) {
    return vehicle.link.startsWith("http")
      ? vehicle.link
      : `${BASE_URL}${vehicle.link}`;
  }
  if (vehicle.uuid) {
    const make = vehicle.make?.toLowerCase().replace(/\s+/g, "-") ?? "kia";
    const model = vehicle.model?.toLowerCase().replace(/\s+/g, "-") ?? "vehicle";
    return `${BASE_URL}/used/${make}/${vehicle.year}-${make}-${model}-${vehicle.uuid}.htm`;
  }
  return INVENTORY_PAGE_URL;
}

// ─── Fetch all pages from the API ────────────────────────────────────────────
// DDC paginates via `pageStart` (0-indexed offset). We read `totalCount` from
// the first response's `pageInfo` to know exactly how many pages to fetch.
async function fetchAllInventory(): Promise<RawVehicle[]> {
  const all: RawVehicle[] = [];
  let pageStart = 0;
  const pageSize = 100;
  let totalCount: number | null = null;
  const seenStockNumbers = new Set<string>();

  while (true) {
    if (pageStart > 0) await sleep(DELAY_MS);

    const page = Math.floor(pageStart / pageSize) + 1;
    console.log(`[scraper] Fetching page ${page} (pageStart=${pageStart})...`);

    const res = await axios.post(
      `${BASE_URL}/api/widget/ws-inv-data/getInventory`,
      buildRequestBody(pageStart, pageSize),
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: `${INVENTORY_PAGE_URL}?accountId=fredandersonkia&accountId=nissanraleigh&accountId=toyotaraleigh`,
          Origin: BASE_URL,
        },
        timeout: 20000,
      }
    );

    const inventory: RawVehicle[] = res.data?.inventory ?? [];

    // Capture totalCount from pageInfo on first response
    if (totalCount === null) {
      totalCount = res.data?.pageInfo?.totalCount ?? null;
      if (totalCount !== null) {
        console.log(`[scraper] Total vehicles reported by API: ${totalCount}`);
      }
    }

    if (inventory.length === 0) break;

    // Filter to only the 3 allowed accounts
    const filtered = inventory.filter((v) =>
      (ALLOWED_ACCOUNTS as readonly string[]).includes(v.accountId)
    );

    const newVehicles = filtered.filter((v) => !seenStockNumbers.has(v.stockNumber));
    newVehicles.forEach((v) => seenStockNumbers.add(v.stockNumber));
    all.push(...newVehicles);

    console.log(
      `[scraper] Page ${page}: ${inventory.length} raw, ${filtered.length} allowed, ${newVehicles.length} new (total so far: ${all.length})`
    );

    pageStart += pageSize;

    // Stop when we've advanced past the total or got a short page
    if (totalCount !== null && pageStart >= totalCount) break;
    if (inventory.length < pageSize) break;
    if (pageStart >= 3000) break; // Hard safety cap (~30 pages)
  }

  return all;
}

// ─── Upsert vehicles into DB ──────────────────────────────────────────────────
async function saveToDb(vehicles: RawVehicle[]): Promise<void> {
  const now = new Date();

  for (const v of vehicles) {
    const price = parsePrice(v);
    const mileage = parseInt(getTrackAttr(v, "odometer") ?? "0", 10) || 0;
    const extColor = getTrackAttr(v, "exteriorColor");
    const intColor = getTrackAttr(v, "interiorColor");
    const photos = getPhotos(v);
    const features: string[] = [];

    // Build feature list from tracking attributes
    const engine = getTrackAttr(v, "engine");
    const engineSize = getTrackAttr(v, "engineSize");
    const transmission = getTrackAttr(v, "transmission");
    const driveLine = getTrackAttr(v, "driveLine");
    const fuelType = getTrackAttr(v, "normalFuelType") ?? getTrackAttr(v, "fuelType");
    const cityMpg = getTrackAttr(v, "cityFuelEconomy");
    const hwyMpg = getTrackAttr(v, "highwayFuelEconomy");

    if (engine || engineSize) features.push(`${engineSize ?? ""} ${engine ?? ""}`.trim());
    if (transmission) features.push(transmission);
    if (driveLine) features.push(driveLine);
    if (fuelType) features.push(fuelType);
    if (cityMpg && hwyMpg) features.push(`${cityMpg}/${hwyMpg} MPG`);
    if (v.certified) features.push("Certified Pre-Owned");

    const accountLabels: Record<string, string> = {
      fredandersonkia: "Fred Anderson KIA",
      nissanraleigh: "Fred Anderson Nissan of Raleigh",
      toyotaraleigh: "Fred Anderson Toyota of Raleigh",
    };

    const description = [
      v.certified ? "Certified Pre-Owned" : "Pre-Owned",
      `${v.year} ${v.make} ${v.model} ${v.trim ?? ""}`.trim(),
      accountLabels[v.accountId] ? `From ${accountLabels[v.accountId]}` : null,
    ]
      .filter(Boolean)
      .join(" • ");

    await prisma.vehicle.upsert({
      where: { stockNumber: v.stockNumber },
      update: {
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim ?? null,
        price,
        mileage,
        exteriorColor: extColor,
        interiorColor: intColor ?? null,
        url: buildVdpUrl(v),
        photos: JSON.stringify(photos),
        features: JSON.stringify(features),
        vin: v.vin ?? null,
        type: "pre-owned",
        isAvailable: v.condition?.toLowerCase() !== "sold",
        description,
        lastScraped: now,
        // Store accountId in description for filtering later
      },
      create: {
        stockNumber: v.stockNumber,
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim ?? null,
        price,
        mileage,
        exteriorColor: extColor,
        interiorColor: intColor ?? null,
        url: buildVdpUrl(v),
        photos: JSON.stringify(photos),
        features: JSON.stringify(features),
        vin: v.vin ?? null,
        type: "pre-owned",
        description,
        lastScraped: now,
      },
    });
  }
}

// ─── Public: Get inventory (cache or fresh fetch) ─────────────────────────────
export async function getInventory(forceRefresh = false): Promise<{
  vehicles: Awaited<ReturnType<typeof prisma.vehicle.findMany>>;
  source: "cache" | "scraped";
  lastUpdated: Date;
  count: number;
}> {
  const mostRecent = await prisma.vehicle.findFirst({
    where: { type: "pre-owned" },
    orderBy: { lastScraped: "desc" },
  });

  const cacheAge = mostRecent
    ? Date.now() - new Date(mostRecent.lastScraped).getTime()
    : Infinity;

  if (!forceRefresh && cacheAge < REFRESH_MS && mostRecent) {
    const vehicles = await prisma.vehicle.findMany({
      where: { isAvailable: true },
      orderBy: [{ make: "asc" }, { year: "desc" }],
    });
    return { vehicles, source: "cache", lastUpdated: new Date(mostRecent.lastScraped), count: vehicles.length };
  }

  // Fresh fetch
  try {
    const raw = await fetchAllInventory();
    console.log(`[scraper] Fetched ${raw.length} pre-owned vehicles. Saving to DB...`);
    await saveToDb(raw);

    const vehicles = await prisma.vehicle.findMany({
      where: { isAvailable: true },
      orderBy: [{ make: "asc" }, { year: "desc" }],
    });
    return { vehicles, source: "scraped", lastUpdated: new Date(), count: vehicles.length };
  } catch (err) {
    console.error("[scraper] Fetch failed, returning cached data:", err);
    const vehicles = await prisma.vehicle.findMany({
      where: { isAvailable: true },
      orderBy: [{ make: "asc" }, { year: "desc" }],
    });
    return {
      vehicles,
      source: "cache",
      lastUpdated: mostRecent ? new Date(mostRecent.lastScraped) : new Date(),
      count: vehicles.length,
    };
  }
}
