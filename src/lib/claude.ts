import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LeadProfile {
  firstName: string;
  vehicleType?: string | null;
  budgetOTD?: number | null;
  budgetMonthly?: number | null;
  downPayment?: number | null;
  creditComfort?: string | null;
  term?: number | null;
  hasTradeIn: boolean;
  tradeYear?: number | null;
  tradeMake?: string | null;
  tradeModel?: string | null;
  tradeMileage?: number | null;
  mustHaveFeatures?: string | null;
  timeframe?: string | null;
  notes?: string | null;
}

export interface VehicleData {
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  price?: number | null;
  msrp?: number | null;
  mileage: number;
  stockNumber: string;
  url?: string | null;
  exteriorColor?: string | null;
  features?: string | null; // JSON array string
  description?: string | null;
  type: string; // new | pre-owned
}

export interface MatchResult {
  stockNumber: string;
  score: number;         // 0-100
  reason: string;        // "Why it matches" explanation
  isAlternative: boolean;
}

// ─── Match Lead to Inventory ──────────────────────────────────────────────────
export async function matchInventory(
  lead: LeadProfile,
  vehicles: VehicleData[]
): Promise<MatchResult[]> {
  const vehicleSummaries = vehicles.slice(0, 60).map((v) => ({
    stockNumber: v.stockNumber,
    year: v.year,
    model: `${v.year} ${v.make} ${v.model} ${v.trim ?? ""}`.trim(),
    price: v.price ?? v.msrp,
    mileage: v.mileage,
    type: v.type,
    color: v.exteriorColor,
    features: v.features ? JSON.parse(v.features).slice(0, 10).join(", ") : "",
  }));

  const prompt = `You are a KIA sales assistant. Match this customer profile to the best vehicles.

CUSTOMER PROFILE:
- Name: ${lead.firstName}
- Vehicle type wanted: ${lead.vehicleType ?? "Any"}
- OTD budget: ${lead.budgetOTD ? `$${lead.budgetOTD.toLocaleString()}` : "Not specified"}
- Monthly budget: ${lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : "Not specified"}
- Down payment: ${lead.downPayment ? `$${lead.downPayment.toLocaleString()}` : "Not specified"}
- Credit: ${lead.creditComfort ?? "Unknown"}
- Term: ${lead.term ? `${lead.term} months` : "Flexible"}
- Trade-in: ${lead.hasTradeIn ? `${lead.tradeYear} ${lead.tradeMake} ${lead.tradeModel} (${lead.tradeMileage?.toLocaleString()} mi)` : "None"}
- Must-have features: ${lead.mustHaveFeatures ?? "None specified"}
- Timeframe: ${lead.timeframe ?? "Unknown"}
- Notes: ${lead.notes ?? "None"}

INVENTORY (${vehicleSummaries.length} vehicles):
${JSON.stringify(vehicleSummaries, null, 2)}

TASK: Return a JSON array of the top 10 matches. For each match return:
{
  "stockNumber": "...",
  "score": 0-100,
  "reason": "1-2 sentence explanation why this car fits the customer",
  "isAlternative": false (true only if it's not an exact type match but still worth considering)
}

Sort by score descending. Only return the JSON array, no other text.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];
  return JSON.parse(jsonMatch[0]) as MatchResult[];
}

// ─── Score a Lead (Hot Lead Scoring) ─────────────────────────────────────────
export async function scoreLead(lead: LeadProfile): Promise<{ score: number; reason: string }> {
  const prompt = `You are a KIA dealership sales coach. Score this lead's urgency/quality from 0–10.

LEAD:
- Timeframe: ${lead.timeframe ?? "Unknown"}
- Budget OTD: ${lead.budgetOTD ? `$${lead.budgetOTD}` : "Not given"}
- Monthly: ${lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : "Not given"}
- Down payment: ${lead.downPayment ? `$${lead.downPayment}` : "Not given"}
- Credit: ${lead.creditComfort ?? "Unknown"}
- Trade-in: ${lead.hasTradeIn ? "Yes" : "No"}
- Vehicle type: ${lead.vehicleType ?? "Any"}
- Notes: ${lead.notes ?? "None"}

Return JSON only: {"score": 7, "reason": "Short 1-sentence reason"}`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;
  const obj = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? '{"score":5,"reason":"No data"}');
  return obj as { score: number; reason: string };
}

// ─── Generate Facebook Marketplace Post Kit ───────────────────────────────────
export async function generatePostKit(vehicle: VehicleData): Promise<{
  shortDesc: string;
  mediumDesc: string;
  longDesc: string;
  sellingPoints: string[];
  checklist: string[];
}> {
  const features = vehicle.features ? JSON.parse(vehicle.features).join(", ") : "N/A";

  const prompt = `You are a KIA salesperson creating a Facebook Marketplace listing. Be honest, enthusiastic, and persuasive.

VEHICLE:
- ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ""}
- Type: ${vehicle.type === "new" ? "Brand New" : "Pre-Owned"}
- Price: ${vehicle.price ? `$${vehicle.price.toLocaleString()}` : "Call for price"}
- Mileage: ${vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString()} miles` : "New / 0 miles"}
- Color: ${vehicle.exteriorColor ?? "See listing"}
- Stock#: ${vehicle.stockNumber}
- Key features: ${features}
- Dealer: KIA of Raleigh

Return ONLY this JSON:
{
  "shortDesc": "1 punchy sentence hook under 100 chars",
  "mediumDesc": "2-3 paragraph Facebook post, ~300 chars, include price, mileage, CTA",
  "longDesc": "Detailed listing ~600 chars with features, finance teaser, disclaimer, CTA",
  "sellingPoints": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "bullet 5"],
  "checklist": ["Add photos", "Verify price is current", "Add Carfax highlights", "Check stock availability", "Include finance disclaimer", "Add contact info"]
}`;

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (msg.content[0] as { type: string; text: string }).text;
  const obj = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");
  return obj;
}

// ─── Generate Recommended Next Action (for salesperson) ──────────────────────
export async function generateNextAction(lead: LeadProfile & {
  status: string;
  hotScore: number;
  appointments: { startTime: Date | string; purpose: string; status: string }[];
}): Promise<string> {
  const upcomingAppt = lead.appointments.find(a => a.status === "scheduled");
  const prompt = `You are a KIA dealership sales coach advising a salesperson on their next move.

LEAD:
- Name: ${lead.firstName}
- Pipeline stage: ${lead.status}
- Hot score: ${lead.hotScore}/10
- Timeframe: ${lead.timeframe ?? "Unknown"}
- Vehicle: ${lead.vehicleType ?? "Any"}
- Budget: ${lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : lead.budgetOTD ? `$${lead.budgetOTD} OTD` : "Not given"}
- Credit: ${lead.creditComfort ?? "Unknown"}
- Upcoming appointment: ${upcomingAppt ? `${upcomingAppt.purpose} on ${new Date(upcomingAppt.startTime).toLocaleDateString()}` : "None"}
- Notes: ${lead.notes ?? "None"}

Return ONE sentence of recommended next action for the salesperson. Be specific and action-oriented.
Example: "Call today to confirm Saturday's test drive and mention the EV tax credit on the EV6."
Return only the sentence, no labels or quotes.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  return (msg.content[0] as { type: string; text: string }).text.trim();
}

// ─── Generate Closing Script (verbal script for salesperson) ──────────────────
export async function generateClosingScript(lead: LeadProfile & {
  status: string;
}): Promise<string> {
  const prompt = `You are a KIA sales coach. Write a short, personalized verbal closing script (2–3 sentences) for a salesperson to say to this customer to close a test drive appointment. Keep it warm, confident, and natural — no pressure tactics.

CUSTOMER:
- Name: ${lead.firstName}
- Vehicle interest: ${lead.vehicleType ?? "KIA vehicles"}
- Budget: ${lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : lead.budgetOTD ? `$${lead.budgetOTD} OTD` : "Not specified"}
- Timeframe: ${lead.timeframe ?? "Unknown"}
- Must-haves: ${lead.mustHaveFeatures ?? "None"}
- Pipeline stage: ${lead.status}
- Notes: ${lead.notes ?? "None"}

Return only the script the salesperson will say, no labels or stage directions.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: prompt }],
  });

  return (msg.content[0] as { type: string; text: string }).text.trim();
}

// ─── Generate Follow-Up Message ───────────────────────────────────────────────
export async function generateFollowUp(
  lead: LeadProfile,
  context: string
): Promise<string> {
  const prompt = `Write a friendly, professional follow-up text/SMS for a KIA salesperson.

Customer: ${lead.firstName}
Context: ${context}
Vehicle interest: ${lead.vehicleType ?? "KIA vehicles"}

Keep it under 160 chars (SMS-friendly), natural and warm. No emojis. Return only the message text.`;

  const msg = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 200,
    messages: [{ role: "user", content: prompt }],
  });

  return (msg.content[0] as { type: string; text: string }).text.trim();
}
