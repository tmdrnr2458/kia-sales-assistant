export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/claude";

// POST /api/ai/score-lead  { leadId }
export async function POST(req: NextRequest) {
  const { leadId } = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const { score, reason } = await scoreLead(lead);
  await prisma.lead.update({ where: { id: leadId }, data: { hotScore: score, hotScoreReason: reason } });

  return NextResponse.json({ score, reason });
}
