import { NextRequest, NextResponse } from "next/server";
import { saveToken } from "@/lib/calendar";

// GET /api/calendar/callback?code=xxx – OAuth callback
export async function GET(req: NextRequest) {
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  await saveToken(code);
  // Redirect to appointments page after successful auth
  return NextResponse.redirect(new URL("/appointments?calendarConnected=true", req.url));
}
