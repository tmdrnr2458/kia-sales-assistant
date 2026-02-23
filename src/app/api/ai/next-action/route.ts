import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateNextAction } from "@/lib/claude";

// POST /api/ai/next-action  { leadId }
export async function POST(req: NextRequest) {
  const { leadId } = await req.json();
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { appointments: { orderBy: { startTime: "asc" } } },
  });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const action = await generateNextAction(lead);
  return NextResponse.json({ action });
}
