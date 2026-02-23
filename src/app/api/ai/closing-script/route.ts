import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateClosingScript } from "@/lib/claude";

// POST /api/ai/closing-script  { leadId }
export async function POST(req: NextRequest) {
  const { leadId } = await req.json();
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const script = await generateClosingScript(lead);
  return NextResponse.json({ script });
}
