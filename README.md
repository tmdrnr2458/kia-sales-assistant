# KIA Sales Assistant

A smart, local web app to help KIA Product Specialists sell faster. Built with Next.js, Tailwind CSS, SQLite (Prisma), and Claude AI.

---

## Features
| Feature | Description |
|---|---|
| **Lead Intake** | 4-step guided form to capture budget, credit, vehicle needs, trade-in |
| **Hot Lead Scoring** | Claude AI scores each lead 0–10 for urgency/quality |
| **Inventory Matching** | Scrapes kiaofraleigh.com, matches leads to top vehicles with AI explanations |
| **Post Kit Generator** | AI-written Facebook Marketplace listings (short/medium/long), checklist, selling points |
| **Appointment Scheduler** | 2-hour slots, Mon–Sat (off Tuesday), syncs to Google Calendar |
| **Business Card** | Digital card with QR codes for inventory, scheduler, and vCard |
| **Message Templates** | 12 pre-built SMS/email templates with variable substitution |
| **Deal Pipeline** | Track leads from New → Qualified → Test Drive → Offer → Finance → Closed |
| **Follow-Up Reminders** | AI-generated follow-up messages with save-to-date feature |

---

## Quick Start

### 1. Prerequisites
- [Node.js 18+](https://nodejs.org/)
- A Claude API key from [console.anthropic.com](https://console.anthropic.com)

### 2. Install
```bash
cd kia-sales-assistant
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Edit `.env` and fill in:
```env
ANTHROPIC_API_KEY=sk-ant-xxxxxx          # Required for AI features
SALESPERSON_NAME="Your Full Name"         # Appears on business card
SALESPERSON_PHONE="(919) 000-0000"        # Your work phone
NEXT_PUBLIC_SALESPERSON_NAME="Your Full Name"
NEXT_PUBLIC_SALESPERSON_PHONE="(919) 000-0000"
NEXT_PUBLIC_SALESPERSON_EMAIL="you@kiaofraleigh.com"
```

### 4. Set up database
```bash
npm run db:push    # Creates SQLite database
npm run db:seed    # Loads example leads & vehicles
```

### 5. Run the app
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're live!

---

## Google Calendar Setup (Optional but Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project → Enable **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Web application)
4. Add `http://localhost:3000/api/calendar/callback` as an authorized redirect URI
5. Copy Client ID and Client Secret to your `.env`:
   ```env
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
   GOOGLE_REDIRECT_URI=http://localhost:3000/api/calendar/callback
   ```
6. In the app, go to **Appointments** → click **Connect Google Calendar**
7. Sign in with Google — your appointments will now sync automatically!

---

## Inventory Scraping

The app scrapes `kiaofraleigh.com/new-inventory/` and `/pre-owned-inventory/` automatically:
- **First load**: Fetches live data
- **Cached**: Refreshes every 4 hours (configurable in `.env`)
- Click **Refresh from Site** in the Inventory page to force a refresh
- Respects `robots.txt`, rate-limits to 1 request every 2 seconds, never logs in

> **Note**: If the site structure changes, the scraper uses JSON-LD structured data as a fallback. The seeded example vehicles are used until a live scrape succeeds.

---

## How to Use

### Daily Workflow
1. **Dashboard** → See hot leads, today's appointments, quick stats
2. **New Lead** → Capture a walk-in or phone lead in 2 minutes
3. **Lead Detail** → Click "Find Matches" to search inventory with AI
4. **Post Kit** → Generate a Facebook Marketplace post for a vehicle in 1 click
5. **Appointments** → Book a test drive slot, syncs to Google Calendar
6. **Templates** → Copy a follow-up message, fill in the name, send

### Lead Pipeline
```
New → Qualified → Test Drive → Offer → Finance → Closed Won / Closed Lost
```
Click any pipeline stage on the Lead Detail page to update status.

### Hot Lead Score
- **8–10**: Hot — contact immediately
- **6–7**: Warm — follow up within 24h
- **4–5**: Medium — nurture
- **0–3**: Low / just looking

---

## Compliance Notes
- Does NOT automate login to any CRM or external system
- Does NOT scrape authenticated pages
- Does NOT auto-post to Facebook (Post Kit requires manual posting)
- Does NOT use Carfax API (manual paste input provided)
- Inventory scraping is rate-limited and respects `robots.txt`

---

## Tech Stack
- **Frontend**: Next.js 14 App Router + Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: SQLite via Prisma
- **AI**: Anthropic Claude (haiku for scoring/follow-ups, sonnet for post generation)
- **Calendar**: Google Calendar API (OAuth 2.0)
- **Scraping**: Axios + Cheerio (rate-limited, cached)
- **QR Codes**: `qrcode` npm package

---

## Project Structure
```
src/
  app/
    page.tsx              # Dashboard
    leads/                # Lead list, new lead form, lead detail
    inventory/            # Inventory browser
    appointments/         # Scheduler + Google Calendar
    post-kit/[vehicleId]/ # Facebook post kit generator
    business-card/        # Business card + QR codes
    templates/            # Message templates library
    api/                  # All API routes
  lib/
    prisma.ts             # Database client
    claude.ts             # AI: matching, scoring, post generation, follow-ups
    scraper.ts            # Inventory scraper (kiaofraleigh.com)
    calendar.ts           # Google Calendar OAuth
    scheduler.ts          # Appointment slot logic
prisma/
  schema.prisma           # Data models
  seed.ts                 # Example data
```
