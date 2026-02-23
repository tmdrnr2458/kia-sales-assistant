"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format, isToday, isTomorrow } from "date-fns";
import {
  Phone, Mail, MessageSquare, Copy, CheckCircle,
  ChevronDown, ChevronUp, Calendar, Flame, User,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Appt = { id: string; startTime: string; status: string; purpose: string };
type Lead = {
  id: string; firstName: string; lastName: string;
  phone?: string; email?: string; preferredContact: string;
  vehicleType?: string; budgetOTD?: number; budgetMonthly?: number;
  downPayment?: number; timeframe?: string; mustHaveFeatures?: string;
  hasTradeIn: boolean; tradeYear?: number; tradeMake?: string;
  tradeModel?: string; tradeMileage?: number; notes?: string;
  status: string; hotScore: number; source?: string; createdAt: string;
  appointments: Appt[];
};

// ─── Status mapping (simplified 5-state → DB values) ─────────────────────────
const STATUS_OPTIONS = [
  { label: "New",        value: "new" },
  { label: "Contacted",  value: "qualified" },
  { label: "Appt Set",   value: "test_drive" },
  { label: "Sold",       value: "closed_won" },
  { label: "Lost",       value: "closed_lost" },
];
const STATUS_COLORS: Record<string, string> = {
  new:          "bg-blue-100 text-blue-700",
  qualified:    "bg-yellow-100 text-yellow-700",
  test_drive:   "bg-purple-100 text-purple-700",
  closed_won:   "bg-green-100 text-green-700",
  closed_lost:  "bg-gray-100 text-gray-500",
};
function statusLabel(v: string) {
  return STATUS_OPTIONS.find((o) => o.value === v)?.label ?? v;
}

// ─── Lead summary text for clipboard / SMS ────────────────────────────────────
function buildSummary(l: Lead) {
  const lines = [
    `Lead: ${l.firstName} ${l.lastName}`,
    l.phone  ? `Phone: ${l.phone}` : null,
    l.email  ? `Email: ${l.email}` : null,
    l.vehicleType ? `Looking for: ${l.vehicleType}` : null,
    l.budgetMonthly ? `Budget: $${l.budgetMonthly}/mo` : l.budgetOTD ? `Budget OTD: $${l.budgetOTD.toLocaleString()}` : null,
    l.downPayment   ? `Down: $${l.downPayment.toLocaleString()}` : null,
    l.timeframe     ? `Timeline: ${l.timeframe}` : null,
    l.mustHaveFeatures ? `Must-haves: ${l.mustHaveFeatures}` : null,
    l.hasTradeIn && l.tradeMake ? `Trade-in: ${l.tradeYear ?? ""} ${l.tradeMake} ${l.tradeModel ?? ""}${l.tradeMileage ? ` (${l.tradeMileage.toLocaleString()} mi)` : ""}` : null,
    l.notes ? `Notes: ${l.notes}` : null,
  ];
  const nextAppt = l.appointments?.find((a) => a.status !== "cancelled");
  if (nextAppt) {
    lines.push(`Appt: ${format(new Date(nextAppt.startTime), "EEE MMM d • h:mm a")}`);
  }
  return lines.filter(Boolean).join("\n");
}

// ─── Single lead row ──────────────────────────────────────────────────────────
function LeadRow({ lead: initial }: { lead: Lead }) {
  const [lead, setLead]       = useState(initial);
  const [expanded, setExp]    = useState(false);
  const [copied, setCopied]   = useState(false);
  const [saving, setSaving]   = useState(false);

  async function setStatus(value: string) {
    setSaving(true);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setLead((l) => ({ ...l, status: value }));
    setSaving(false);
  }

  function copySummary() {
    navigator.clipboard.writeText(buildSummary(lead));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const nextAppt = lead.appointments?.find((a) => a.status !== "cancelled");
  const scoreColor = lead.hotScore >= 8 ? "text-red-600" : lead.hotScore >= 6 ? "text-orange-500" : "text-gray-400";

  function apptLabel(dt: string) {
    const d = new Date(dt);
    if (isToday(d))    return `Today ${format(d, "h:mm a")}`;
    if (isTomorrow(d)) return `Tomorrow ${format(d, "h:mm a")}`;
    return format(d, "EEE MMM d • h:mm a");
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#05141F] text-white flex items-center justify-center text-sm font-bold shrink-0">
            {lead.firstName[0]}{lead.lastName?.[0] ?? ""}
          </div>

          {/* Core info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/leads/${lead.id}`} className="font-semibold text-gray-900 hover:text-red-600 transition">
                {lead.firstName} {lead.lastName}
              </Link>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-500"}`}>
                {statusLabel(lead.status)}
              </span>
              {lead.hotScore > 0 && (
                <span className={`flex items-center gap-0.5 text-xs font-semibold ${scoreColor}`}>
                  <Flame size={11} /> {lead.hotScore}/10
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              {lead.phone && <span>{lead.phone}</span>}
              {lead.email && <span className="truncate max-w-[160px]">{lead.email}</span>}
              <span className="text-gray-300">•</span>
              <span>{format(new Date(lead.createdAt), "MMM d, yyyy")}</span>
              {lead.source && <span className="text-gray-300">via {lead.source}</span>}
            </div>

            {/* Key needs inline */}
            <div className="flex gap-2 mt-2 flex-wrap text-xs text-gray-500">
              {lead.vehicleType && <span className="bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">{lead.vehicleType}</span>}
              {lead.budgetMonthly && <span className="bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">${lead.budgetMonthly}/mo</span>}
              {lead.budgetOTD    && <span className="bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">${lead.budgetOTD.toLocaleString()} OTD</span>}
              {lead.timeframe    && <span className="bg-gray-50 border border-gray-200 rounded-md px-2 py-0.5">{lead.timeframe}</span>}
              {nextAppt && (
                <span className="bg-purple-50 border border-purple-200 text-purple-700 rounded-md px-2 py-0.5 flex items-center gap-1">
                  <Calendar size={10} /> {apptLabel(nextAppt.startTime)}
                </span>
              )}
            </div>
          </div>

          {/* Status picker */}
          <select
            value={lead.status}
            onChange={(e) => setStatus(e.target.value)}
            disabled={saving}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-200 shrink-0 disabled:opacity-60"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {lead.phone && (
            <a href={`tel:${lead.phone}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <Phone size={12} /> Call
            </a>
          )}
          {lead.phone && (
            <a href={`sms:${lead.phone}?body=${encodeURIComponent(`Hi ${lead.firstName}, this is Jae from Fred Anderson KIA. `)}`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <MessageSquare size={12} /> Text
            </a>
          )}
          {lead.email && (
            <a href={`mailto:${lead.email}?subject=Following up from Fred Anderson KIA`}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <Mail size={12} /> Email
            </a>
          )}
          <button onClick={copySummary}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
            {copied ? <><CheckCircle size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy Summary</>}
          </button>
          <Link href={`/leads/${lead.id}`}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#05141F] text-white hover:opacity-90 transition ml-auto">
            <User size={12} /> Full Profile
          </Link>
          <button onClick={() => setExp((v) => !v)}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            {[
              ["Budget (monthly)", lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : null],
              ["Budget (OTD)",     lead.budgetOTD     ? `$${lead.budgetOTD.toLocaleString()}` : null],
              ["Down Payment",     lead.downPayment   ? `$${lead.downPayment.toLocaleString()}` : null],
              ["Timeline",         lead.timeframe],
              ["Vehicle Type",     lead.vehicleType],
              ["Preferred Contact", lead.preferredContact],
            ].map(([k, v]) => v ? (
              <div key={k as string} className="flex justify-between border-b border-gray-100 pb-1">
                <span className="text-gray-400">{k}</span>
                <span className="text-gray-700 font-medium">{v}</span>
              </div>
            ) : null)}
          </div>

          {lead.mustHaveFeatures && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 mb-1.5">Must-have features</p>
              <div className="flex flex-wrap gap-1.5">
                {lead.mustHaveFeatures.split(",").map((f) => (
                  <span key={f} className="text-xs bg-white border border-gray-200 rounded-md px-2 py-0.5 text-gray-600">{f.trim()}</span>
                ))}
              </div>
            </div>
          )}

          {lead.hasTradeIn && lead.tradeMake && (
            <div className="mt-3 text-xs">
              <p className="text-gray-400 mb-0.5">Trade-in</p>
              <p className="text-gray-700 font-medium">
                {lead.tradeYear} {lead.tradeMake} {lead.tradeModel}
                {lead.tradeMileage ? ` • ${lead.tradeMileage.toLocaleString()} mi` : ""}
              </p>
            </div>
          )}

          {lead.notes && (
            <div className="mt-3 text-xs">
              <p className="text-gray-400 mb-0.5">Notes</p>
              <p className="text-gray-700 italic bg-white border border-gray-100 rounded-lg p-2">{lead.notes}</p>
            </div>
          )}

          {lead.appointments?.length > 0 && (
            <div className="mt-3 text-xs">
              <p className="text-gray-400 mb-1.5">Appointments</p>
              <div className="space-y-1">
                {lead.appointments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-lg px-3 py-2">
                    <span className="text-gray-700 font-medium">{format(new Date(a.startTime), "EEE MMM d • h:mm a")}</span>
                    <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium
                      ${a.status === "scheduled" ? "bg-blue-50 text-blue-600" :
                        a.status === "completed"  ? "bg-green-50 text-green-600" :
                        "bg-gray-50 text-gray-400"}`}>
                      {a.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Inbox page ───────────────────────────────────────────────────────────────
export default function InboxPage() {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    fetch("/api/leads")
      .then((r) => r.json())
      .then((data) => { setLeads(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = leads
    .filter((l) => filter === "all" || l.status === filter)
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return `${l.firstName} ${l.lastName} ${l.phone ?? ""} ${l.email ?? ""}`.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const counts: Record<string, number> = {};
  for (const l of leads) counts[l.status] = (counts[l.status] ?? 0) + 1;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Inbox</h1>
          <p className="text-sm text-gray-500">{leads.length} total leads · {leads.filter(l => l.status === "new").length} new</p>
        </div>
        <a href="/leads/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#BB162B] text-white rounded-lg text-sm font-medium hover:bg-red-700 transition">
          + New Lead
        </a>
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-3 items-center flex-wrap">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name, phone, email…"
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 flex-1 min-w-[180px]"
        />
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === "all" ? "bg-[#05141F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            All ({leads.length})
          </button>
          {STATUS_OPTIONS.map((o) => (
            <button key={o.value} onClick={() => setFilter(o.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === o.value ? "bg-[#05141F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
              {o.label} {counts[o.value] ? `(${counts[o.value]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Lead list */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400">No leads match this filter.</p>
        </div>
      )}

      {!loading && (
        <div className="space-y-3">
          {filtered.map((l) => <LeadRow key={l.id} lead={l} />)}
        </div>
      )}
    </div>
  );
}
