import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCalendarEvent } from "@/lib/calendar";

// POST /api/public/book – create a walk-in lead + 2-hour appointment atomically
export async function POST(req: NextRequest) {
  const { name, phone, email, notes, startTime } = await req.json();

  if (!name || !phone || !startTime) {
    return NextResponse.json({ error: "name, phone, and startTime are required" }, { status: 400 });
  }

  const start = new Date(startTime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  // Check for conflicts
  const conflict = await prisma.appointment.findFirst({
    where: {
      status: { not: "cancelled" },
      OR: [{ startTime: { lt: end }, endTime: { gt: start } }],
    },
  });
  if (conflict) {
    return NextResponse.json({ error: "That time slot was just taken. Please pick another." }, { status: 409 });
  }

  // Create a minimal lead for this booking
  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "";

  const lead = await prisma.lead.create({
    data: {
      firstName,
      lastName,
      phone,
      email: email || null,
      preferredContact: "text",
      source: "website",
      notes: notes || null,
      status: "new",
    },
  });

  // Attempt Google Calendar sync (non-blocking)
  let googleEventId: string | null = null;
  try {
    googleEventId = await createCalendarEvent({
      summary: `Appointment – ${name}`,
      description: notes ?? `Public booking from /card. Phone: ${phone}`,
      startTime: start,
      endTime: end,
      attendeeEmail: email ?? undefined,
    });
  } catch {
    // Calendar sync optional
  }

  const appointment = await prisma.appointment.create({
    data: {
      leadId: lead.id,
      startTime: start,
      endTime: end,
      purpose: "test_drive",
      notes: notes || null,
      googleEventId,
    },
  });

  return NextResponse.json({ lead, appointment }, { status: 201 });
}
