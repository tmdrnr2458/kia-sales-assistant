import { NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/calendar";

// GET /api/calendar/auth – redirect to Google OAuth
export async function GET() {
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
