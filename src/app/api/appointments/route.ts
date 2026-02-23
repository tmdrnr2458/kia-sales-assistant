export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent, deleteCalendarEvent } from "@/lib/calendar";
import { getAvailableSlots } from "@/lib/scheduler";

// GET /api/appointments?slots=true  OR  ?leadId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const showSlots = searchParams.get("slots") === "true";
  const leadId = searchParams.get("leadId");

  if (showSlots) {
    const existing = await prisma.appointment.findMany({
      where: { status: { not: "cancelled" } },
      select: { startTime: true, endTime: true },
    });
    const slots = getAvailableSlots(existing);
    return NextResponse.json({ slots });
  }

  const where = leadId ? { leadId } : undefined;
  const appointments = await prisma.appointment.findMany({
    where,
    include: { lead: { select: { firstName: true, lastName: true, phone: true } } },
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json(appointments);
}

// POST /api/appointments – create appointment + sync to Google Calendar
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId, startTime, purpose, notes, leadEmail } = body;

  const start = new Date(startTime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2 hours

  // Check for conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: { not: "cancelled" },
      OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "Time slot already booked" }, { status: 409 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  // Attempt Google Calendar sync
  let googleEventId: string | null = null;
  try {
    googleEventId = await createCalendarEvent({
      summary: `${purpose?.replace("_", " ").toUpperCase()} – ${lead.firstName} ${lead.lastName}`,
      description: notes ?? `Lead ID: ${leadId}`,
      startTime: start,
      endTime: end,
      attendeeEmail: leadEmail ?? lead.email ?? undefined,
    });
  } catch (err) {
    console.warn("[appointments] Google Calendar sync failed:", err);
  }

  const appointment = await prisma.appointment.create({
    data: {
      leadId,
      startTime: start,
      endTime: end,
      purpose: purpose ?? "test_drive",
      notes: notes ?? null,
      googleEventId,
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}

// DELETE /api/appointments/:id handled separately; here we do bulk cancel via PATCH
export async function PATCH(req: NextRequest) {
  const { id, status } = await req.json();
  const appt = await prisma.appointment.findUnique({ where: { id } });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "cancelled" && appt.googleEventId) {
    await deleteCalendarEvent(appt.googleEventId).catch(console.error);
  }

  const updated = await prisma.appointment.update({ where: { id }, data: { status } });
  return NextResponse.json(updated);
}
