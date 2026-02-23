export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchInventory } from "@/lib/claude";
import { getInventory } from "@/lib/scraper";

// POST /api/inventory/match  { leadId }
export async function POST(req: NextRequest) {
  const { leadId } = await req.json();

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { vehicles } = await getInventory();

  if (vehicles.length === 0) {
    return NextResponse.json({ matches: [], message: "No inventory cached yet. Try refreshing inventory first." });
  }

  const vehicleData = vehicles.map((v) => ({
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim,
    price: v.price,
    msrp: v.msrp,
    mileage: v.mileage,
    stockNumber: v.stockNumber,
    url: v.url,
    exteriorColor: v.exteriorColor,
    features: v.features,
    description: v.description,
    type: v.type,
  }));

  const matchResults = await matchInventory(lead, vehicleData);

  // Enrich matches with full vehicle data from DB
  const enriched = matchResults.map((m) => {
    const vehicle = vehicles.find((v) => v.stockNumber === m.stockNumber);
    return { ...m, vehicle };
  });

  return NextResponse.json({ matches: enriched });
}
