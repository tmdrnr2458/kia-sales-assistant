import { NextResponse } from "next/server";

// Stub: online slot booking is not available in this deployment.
// The /card page handles empty slots gracefully, showing a "Text Jae" fallback.
export async function GET() {
  return NextResponse.json({ slots: [] });
}

export async function POST() {
  return NextResponse.json(
    { error: "Online booking is temporarily unavailable. Please text or call Jae directly to schedule." },
    { status: 503 }
  );
}

export async function PATCH() {
  return NextResponse.json({ error: "Not available" }, { status: 503 });
}
