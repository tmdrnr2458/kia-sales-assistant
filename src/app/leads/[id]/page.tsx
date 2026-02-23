"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  Flame, Phone, Mail, Car, Calendar, Share2, RefreshCw,
  ChevronLeft, Edit3, MessageSquare, CheckCircle, Zap,
} from "lucide-react";

type Lead = {
  id: string; firstName: string; lastName: string; phone?: string; email?: string;
  preferredContact: string; vehicleType?: string; budgetOTD?: number; budgetMonthly?: number;
  downPayment?: number; creditComfort?: string; term?: number; hasTradeIn: boolean;
  tradeYear?: number; tradeMake?: string; tradeModel?: string; tradeMileage?: number;
  mustHaveFeatures?: string; timeframe?: string; notes?: string;
  status: string; hotScore: number; hotScoreReason?: string; source?: string;
  nextFollowUp?: string; followUpNote?: string; createdAt: string;
  appointments: { id: string; startTime: string; purpose: string; status: string }[];
};

type MatchResult = {
  stockNumber: string; score: number; reason: string; isAlternative: boolean;
  vehicle?: { id: string; year: number; make: string; model: string; trim?: string; price?: number; mileage: number; url?: string; exteriorColor?: string; photos?: string };
};

const pipelineStages = ["new", "qualified", "test_drive", "offer", "finance", "closed_won", "closed_lost"];
const stageLabels: Record<string, string> = {
  new: "New", qualified: "Qualified", test_drive: "Test Drive",
  offer: "Offer", finance: "Finance", closed_won: "Won", closed_lost: "Lost",
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matching, setMatching] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [generatingAction, setGeneratingAction] = useState(false);
  const [closingScript, setClosingScript] = useState("");
  const [generatingScript, setGeneratingScript] = useState(false);

  useEffect(() => { fetch(`/api/leads/${id}`).then(r => r.json()).then(setLead); }, [id]);

  async function findMatches() {
    setMatching(true);
    const res = await fetch("/api/inventory/match", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id }),
    });
    const data = await res.json();
    setMatches(data.matches ?? []);
    setMatching(false);
  }

  async function genFollowUp() {
    setGeneratingFollowUp(true);
    const res = await fetch("/api/ai/followup", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, context: "following up to book or confirm a test drive appointment" }),
    });
    const data = await res.json();
    setFollowUp(data.message);
    setGeneratingFollowUp(false);
  }

  async function updateStatus(status: string) {
    setSavingStatus(true);
    await fetch(`/api/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLead(l => l ? { ...l, status } : l);
    setSavingStatus(false);
  }

  async function genNextAction() {
    setGeneratingAction(true);
    const res = await fetch("/api/ai/next-action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id }),
    });
    const data = await res.json();
    setNextAction(data.action ?? "");
    setGeneratingAction(false);
  }

  async function genClosingScript() {
    setGeneratingScript(true);
    const res = await fetch("/api/ai/closing-script", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id }),
    });
    const data = await res.json();
    setClosingScript(data.script ?? "");
    setGeneratingScript(false);
  }

  async function saveFollowUp() {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextFollowUp: followUpDate ? new Date(followUpDate).toISOString() : null, followUpNote: followUp }),
    });
    setLead(l => l ? { ...l, followUpNote: followUp, nextFollowUp: followUpDate } : l);
  }

  if (!lead) return <div className="animate-pulse text-gray-400 p-6">Loading lead...</div>;

  const scoreColor = lead.hotScore >= 8 ? "text-red-600 bg-red-50" : lead.hotScore >= 6 ? "text-orange-600 bg-orange-50" : "text-gray-600 bg-gray-100";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/leads")} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div className="w-12 h-12 rounded-full bg-kia-navy text-white flex items-center justify-center text-lg font-bold">
            {lead.firstName[0]}{lead.lastName[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
            <p className="text-sm text-gray-500">Added {format(new Date(lead.createdAt), "MMM d, yyyy")} • {lead.source}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${scoreColor}`}>
            <Flame size={14} /> {lead.hotScore}/10
          </span>
          {lead.hotScoreReason && (
            <span className="text-xs text-gray-400 max-w-xs hidden md:block">{lead.hotScoreReason}</span>
          )}
        </div>
      </div>

      {/* Pipeline tracker */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Deal Pipeline</p>
        <div className="flex gap-1 flex-wrap">
          {pipelineStages.map((s) => (
            <button key={s} onClick={() => updateStatus(s)} disabled={savingStatus}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${lead.status === s
                ? "bg-kia-red text-white border-kia-red shadow"
                : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}>
              {stageLabels[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Lead Profile Card */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Edit3 size={15} className="text-gray-400" /> Lead Profile
            </h2>
            <div className="space-y-2 text-sm">
              {lead.phone && <div className="flex items-center gap-2 text-gray-700"><Phone size={13} className="text-gray-400" /> {lead.phone}</div>}
              {lead.email && <div className="flex items-center gap-2 text-gray-700"><Mail size={13} className="text-gray-400" /> {lead.email}</div>}
              <hr className="my-3 border-gray-100" />
              {[
                ["Vehicle Type", lead.vehicleType],
                ["OTD Budget", lead.budgetOTD ? `$${lead.budgetOTD.toLocaleString()}` : null],
                ["Monthly", lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : null],
                ["Down Payment", lead.downPayment ? `$${lead.downPayment.toLocaleString()}` : null],
                ["Credit", lead.creditComfort],
                ["Term", lead.term ? `${lead.term} months` : null],
                ["Timeframe", lead.timeframe],
                ["Features", lead.mustHaveFeatures],
              ].map(([k, v]) => v ? (
                <div key={k as string} className="flex justify-between gap-2">
                  <span className="text-gray-400 text-xs">{k}</span>
                  <span className="text-gray-700 text-xs text-right">{v}</span>
                </div>
              ) : null)}
              {lead.hasTradeIn && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Trade-in</p>
                  <p className="text-xs text-gray-700">{lead.tradeYear} {lead.tradeMake} {lead.tradeModel}
                    {lead.tradeMileage ? ` • ${lead.tradeMileage.toLocaleString()} mi` : ""}</p>
                </div>
              )}
              {lead.notes && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-xs text-gray-600 italic">{lead.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Calendar size={14} /> Appointments</h2>
              <Link href={`/appointments?leadId=${id}`} className="text-xs text-kia-red hover:underline">+ Add</Link>
            </div>
            {lead.appointments.length === 0 ? (
              <p className="text-xs text-gray-400">No appointments</p>
            ) : lead.appointments.map((a) => (
              <div key={a.id} className="text-xs text-gray-700 py-1.5 border-b border-gray-50 last:border-0">
                <p className="font-medium">{format(new Date(a.startTime), "EEE MMM d • h:mm a")}</p>
                <p className="text-gray-400 capitalize">{a.purpose.replace("_", " ")} – {a.status}</p>
              </div>
            ))}
          </div>

          {/* AI Actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
              <Zap size={14} className="text-yellow-500" /> AI Actions
            </h2>
            {/* Recommended Next Action */}
            <button onClick={genNextAction} disabled={generatingAction}
              className="w-full px-3 py-2 rounded-lg bg-kia-navy text-white text-xs font-medium hover:bg-kia-navy-light transition mb-2 disabled:opacity-60">
              {generatingAction ? "Thinking…" : "Get Recommended Action"}
            </button>
            {nextAction && (
              <div className="mb-3 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                {nextAction}
              </div>
            )}
            {/* Closing Script */}
            <button onClick={genClosingScript} disabled={generatingScript}
              className="w-full px-3 py-2 rounded-lg bg-kia-red text-white text-xs font-medium hover:bg-kia-red-dark transition disabled:opacity-60">
              {generatingScript ? "Writing…" : "Generate Closing Script"}
            </button>
            {closingScript && (
              <div className="mt-2 space-y-2">
                <textarea className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none"
                  rows={4} value={closingScript} onChange={e => setClosingScript(e.target.value)} />
                {lead.phone && (
                  <a href={`sms:${lead.phone}?body=${encodeURIComponent(closingScript)}`}
                    className="w-full px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition flex items-center justify-center gap-1">
                    💬 Text {lead.firstName} this script
                  </a>
                )}
                <button onClick={() => navigator.clipboard.writeText(closingScript)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition">
                  Copy to Clipboard
                </button>
              </div>
            )}
          </div>

          {/* Follow-up */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
              <MessageSquare size={14} /> Follow-Up
            </h2>
            <button onClick={genFollowUp} disabled={generatingFollowUp}
              className="w-full px-3 py-2 rounded-lg bg-kia-navy text-white text-xs font-medium hover:bg-kia-navy-light transition mb-2 disabled:opacity-60">
              {generatingFollowUp ? "Generating..." : "Generate Appointment Follow-up"}
            </button>
            {followUp && (
              <div className="mt-2 space-y-2">
                <textarea className="w-full text-xs border border-gray-200 rounded-lg p-2 resize-none"
                  rows={4} value={followUp} onChange={e => setFollowUp(e.target.value)} />
                {lead.phone && (
                  <a href={`sms:${lead.phone}?body=${encodeURIComponent(followUp)}`}
                    className="w-full px-3 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:bg-green-600 transition flex items-center justify-center gap-1">
                    💬 Text {lead.firstName} this message
                  </a>
                )}
                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
                <button onClick={saveFollowUp}
                  className="w-full px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition flex items-center justify-center gap-1">
                  <CheckCircle size={12} /> Save Follow-Up
                </button>
                <button onClick={() => navigator.clipboard.writeText(followUp)}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-xs hover:bg-gray-50 transition">
                  Copy to Clipboard
                </button>
              </div>
            )}
            {lead.nextFollowUp && (
              <p className="text-xs text-orange-600 mt-2">
                Scheduled: {format(new Date(lead.nextFollowUp), "EEE MMM d")}
              </p>
            )}
          </div>
        </div>

        {/* Inventory Matches */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Car size={16} /> Inventory Matches</h2>
              <button onClick={findMatches} disabled={matching}
                className="flex items-center gap-2 px-4 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition disabled:opacity-60">
                <RefreshCw size={14} className={matching ? "animate-spin" : ""} />
                {matching ? "Finding matches..." : "Find Matches"}
              </button>
            </div>

            {matches.length === 0 && !matching && (
              <div className="text-center py-10 text-gray-400">
                <Car size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Click "Find Matches" to search inventory based on this lead's profile.</p>
              </div>
            )}

            <div className="space-y-3">
              {matches.map((m) => {
                const v = m.vehicle;
                const photos = v?.photos ? JSON.parse(v.photos) : [];
                return (
                  <div key={m.stockNumber}
                    className={`rounded-xl border p-4 ${m.isAlternative ? "border-dashed border-gray-200 bg-gray-50" : "border-gray-200 bg-white"}`}>
                    <div className="flex gap-4">
                      {photos[0] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photos[0]} alt="" className="w-24 h-16 object-cover rounded-lg bg-gray-100 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {v ? `${v.year} ${v.make} ${v.model} ${v.trim ?? ""}` : `Stock# ${m.stockNumber}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              {v?.price ? `$${v.price.toLocaleString()}` : "Call for price"} •{" "}
                              {v?.mileage ? `${v.mileage.toLocaleString()} mi` : "New"} •{" "}
                              Stock# {m.stockNumber}
                              {m.isAlternative && <span className="ml-2 text-yellow-600 font-medium">Alternative</span>}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="w-10 h-10 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xs font-bold text-green-700">
                              {m.score}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 italic">{m.reason}</p>
                        <div className="flex gap-2 mt-2">
                          {v?.url && (
                            <a href={v.url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-kia-red hover:underline flex items-center gap-1">
                              View on site
                            </a>
                          )}
                          {v && (
                            <Link href={`/post-kit/${v.id}`}
                              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                              <Share2 size={11} /> Post Kit
                            </Link>
                          )}
                          {v && (
                            <Link href={`/appointments?leadId=${id}`}
                              className="text-xs flex items-center gap-1 px-2 py-1 rounded-md bg-kia-navy text-white hover:bg-kia-navy-light transition">
                              <Calendar size={11} /> Schedule Test Drive
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
