/**
 * Google Calendar integration
 * Uses OAuth 2.0 – token stored in DB (OAuthToken table)
 * Setup: follow the instructions in README to get client ID/secret
 */

import { google } from "googleapis";
import { prisma } from "./prisma";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/calendar/callback"
);

export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar"],
    prompt: "consent",
  });
}

// ─── Load token from DB and set on client ────────────────────────────────────
async function authenticate(): Promise<boolean> {
  const token = await prisma.oAuthToken.findFirst({ where: { id: "singleton" } });
  if (!token) return false;

  oauth2Client.setCredentials({
    access_token: token.accessToken,
    refresh_token: token.refreshToken ?? undefined,
    expiry_date: token.expiryDate ? Number(token.expiryDate) : undefined,
  });

  // Auto-refresh if expired
  if (token.expiryDate && Date.now() > Number(token.expiryDate) - 60000) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      await prisma.oAuthToken.update({
        where: { id: "singleton" },
        data: {
          accessToken: credentials.access_token!,
          expiryDate: BigInt(credentials.expiry_date ?? 0),
        },
      });
      oauth2Client.setCredentials(credentials);
    } catch (err) {
      console.error("[calendar] Token refresh failed:", err);
      return false;
    }
  }
  return true;
}

// ─── Save token after OAuth callback ─────────────────────────────────────────
export async function saveToken(code: string): Promise<void> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  await prisma.oAuthToken.upsert({
    where: { id: "singleton" },
    update: {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? undefined,
      expiryDate: BigInt(tokens.expiry_date ?? 0),
    },
    create: {
      id: "singleton",
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token ?? null,
      expiryDate: BigInt(tokens.expiry_date ?? 0),
    },
  });
}

// ─── Create a Calendar Event ─────────────────────────────────────────────────
export async function createCalendarEvent(params: {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendeeEmail?: string;
}): Promise<string | null> {
  const authed = await authenticate();
  if (!authed) {
    console.warn("[calendar] Not authenticated – skipping Google Calendar sync");
    return null;
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: params.startTime.toISOString(), timeZone: "America/New_York" },
      end: { dateTime: params.endTime.toISOString(), timeZone: "America/New_York" },
      attendees: params.attendeeEmail ? [{ email: params.attendeeEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 30 },
          { method: "email", minutes: 60 },
        ],
      },
    },
  });

  return event.data.id ?? null;
}

// ─── Delete a Calendar Event ──────────────────────────────────────────────────
export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const authed = await authenticate();
  if (!authed) return;
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  await calendar.events.delete({ calendarId: "primary", eventId }).catch(console.error);
}

// ─── Check if Google Calendar is connected ────────────────────────────────────
export async function isCalendarConnected(): Promise<boolean> {
  const token = await prisma.oAuthToken.findFirst({ where: { id: "singleton" } });
  return !!token?.accessToken;
}
