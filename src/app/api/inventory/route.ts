import { NextRequest, NextResponse } from "next/server";
import { getInventory } from "@/lib/scraper";

// GET /api/inventory?refresh=true
export async function GET(req: NextRequest) {
  const forceRefresh = new URL(req.url).searchParams.get("refresh") === "true";
  const result = await getInventory(forceRefresh);
  return NextResponse.json({
    vehicles: result.vehicles,
    source: result.source,
    lastUpdated: result.lastUpdated,
    count: result.vehicles.length,
  });
}
