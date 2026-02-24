import { NextResponse } from "next/server";

// Stub: online booking is not available in this deployment.
// The /card page handles this error gracefully and shows a "Text Jae" CTA.
export async function POST() {
  return NextResponse.json(
    { error: "Online booking is temporarily unavailable. Please text or call Jae directly to schedule." },
    { status: 503 }
  );
}
