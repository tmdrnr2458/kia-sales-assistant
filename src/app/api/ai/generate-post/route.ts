export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePostKit } from "@/lib/claude";

// POST /api/ai/generate-post  { vehicleId, leadId? }
export async function POST(req: NextRequest) {
  const { vehicleId, leadId, carfaxNotes } = await req.json();

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

  const kit = await generatePostKit(vehicle);

  const postKit = await prisma.postKit.create({
    data: {
      vehicleId,
      leadId: leadId ?? null,
      shortDesc: kit.shortDesc,
      mediumDesc: kit.mediumDesc,
      longDesc: kit.longDesc,
      sellingPoints: JSON.stringify(kit.sellingPoints),
      checklist: JSON.stringify(kit.checklist),
      carfaxNotes: carfaxNotes ?? null,
    },
  });

  return NextResponse.json({ postKit, kit });
}
