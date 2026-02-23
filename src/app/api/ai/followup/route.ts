import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFollowUp } from "@/lib/claude";

// POST /api/ai/followup  { leadId, context }
export async function POST(req: NextRequest) {
  const { leadId, context } = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const message = await generateFollowUp(lead, context ?? "checking in after initial contact");
  return NextResponse.json({ message });
}
