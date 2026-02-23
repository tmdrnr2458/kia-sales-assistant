export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scoreLead } from "@/lib/claude";

// GET /api/leads – list all leads
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const leads = await prisma.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
    include: { appointments: { orderBy: { startTime: "asc" }, take: 1 } },
  });

  return NextResponse.json(leads);
}

// POST /api/leads – create a new lead and auto-score
export async function POST(req: NextRequest) {
  const body = await req.json();

  const lead = await prisma.lead.create({ data: body });

  // Auto-score with Claude (non-blocking – fire and forget then update)
  scoreLead(lead)
    .then(async ({ score, reason }) => {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { hotScore: score, hotScoreReason: reason },
      });
    })
    .catch(console.error);

  return NextResponse.json(lead, { status: 201 });
}
