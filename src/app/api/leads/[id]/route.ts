export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/claude";

// GET /api/leads/:id
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    include: {
      appointments: { orderBy: { startTime: "asc" } },
      postKits: { include: { vehicle: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(lead);
}

// PATCH /api/leads/:id – update lead fields
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const lead = await prisma.lead.update({ where: { id: params.id }, data: body });

  // Re-score if needs data changed
  const needsFields = ["budgetOTD", "budgetMonthly", "timeframe", "creditComfort", "downPayment"];
  if (needsFields.some((f) => f in body)) {
    scoreLead(lead)
      .then(async ({ score, reason }) => {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { hotScore: score, hotScoreReason: reason },
        });
      })
      .catch(console.error);
  }

  return NextResponse.json(lead);
}

// DELETE /api/leads/:id
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.lead.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
