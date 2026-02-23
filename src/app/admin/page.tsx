"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Flame, Users, Calendar, TrendingUp, AlertCircle, DollarSign } from "lucide-react";
import { format, isToday, isPast, startOfDay, endOfDay, differenceInDays } from "date-fns";

const LINKS = [
  { href: "/",                  label: "Dashboard",          desc: "Leads, stats, today's schedule" },
  { href: "/admin/inbox",       label: "Inbox",              desc: "Leads from public /card form" },
  { href: "/leads",             label: "Leads",              desc: "All leads + pipeline" },
  { href: "/inventory",         label: "Inventory",          desc: "Pre-owned vehicle list" },
  { href: "/appointments",      label: "Appointments",       desc: "Manage booked slots" },
  { href: "/message-templates", label: "Message Templates",  desc: "SMS / email copy" },
  { href: "/business-card",     label: "Business Card",      desc: "Digital card + QR codes" },
  { href: "/post-kit",          label: "Post Kit",           desc: "Facebook content generator" },
  { href: "/card",              label: "↗ View Public Card", desc: "Customer-facing /card page" },
];

const PIPELINE_STAGES = [
  { key: "new",         label: "New",        color: "bg-blue-500" },
  { key: "qualified",   label: "Qualified",  color: "bg-yellow-500" },
  { key: "test_drive",  label: "Test Drive", color: "bg-purple-500" },
  { key: "offer",       label: "Offer",      color: "bg-orange-500" },
  { key: "finance",     label: "Finance",    color: "bg-indigo-500" },
  { key: "closed_won",  label: "Won",        color: "bg-green-500" },
  { key: "closed_lost", label: "Lost",       color: "bg-gray-400" },
];

const CLOSED = ["closed_won", "closed_lost"];
const AVG_GROSS = 2500;

type Appt = { id: string; startTime: string; purpose: string; status: string };
type Lead = {
  id: string; firstName: string; lastName: string; phone?: string;
  status: string; hotScore: number; createdAt: string;
  nextFollowUp?: string; followUpNote?: string;
  appointments: Appt[];
};

function CommandCenter({ leads }: { leads: Lead[] }) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);

  // Stats
  const newToday = leads.filter(l => new Date(l.createdAt) >= todayStart).length;
  const apptsToday = leads.reduce<Appt[]>((acc, l) => {
    const appt = l.appointments[0];
    if (appt && appt.status !== "cancelled") {
      const t = new Date(appt.startTime);
      if (t >= todayStart && t <= todayEnd) acc.push(appt);
    }
    return acc;
  }, []).length;
  const overdue = leads.filter(l =>
    l.nextFollowUp &&
    isPast(new Date(l.nextFollowUp)) &&
    !CLOSED.includes(l.status)
  );
  const activeLeads = leads.filter(l => !CLOSED.includes(l.status));
  const estGross = activeLeads.length * AVG_GROSS;

  // Pipeline counts
  const pipelineCounts = Object.fromEntries(
    PIPELINE_STAGES.map(s => [s.key, leads.filter(l => l.status === s.key).length])
  );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "New Today",      value: newToday,            icon: Users,        color: "text-blue-600",   bg: "bg-blue-50" },
          { label: "Appts Today",    value: apptsToday,          icon: Calendar,     color: "text-green-600",  bg: "bg-green-50" },
          { label: "Follow-ups Due", value: overdue.length,      icon: AlertCircle,  color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Active Leads",   value: activeLeads.length,  icon: Flame,        color: "text-red-600",    bg: "bg-red-50" },
          { label: "Est. Gross",     value: `$${(estGross / 1000).toFixed(0)}k`, icon: DollarSign, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline breakdown */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pipeline</p>
        <div className="flex gap-2 flex-wrap">
          {PIPELINE_STAGES.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              <span className="text-xs text-gray-500">{label}</span>
              <span className="text-xs font-bold text-gray-900">{pipelineCounts[key] ?? 0}</span>
            </div>
          ))}
        </div>
        {/* Bar */}
        {leads.length > 0 && (
          <div className="mt-3 flex h-2 rounded-full overflow-hidden gap-px">
            {PIPELINE_STAGES.map(({ key, color }) => {
              const pct = ((pipelineCounts[key] ?? 0) / leads.length) * 100;
              return pct > 0 ? (
                <div key={key} className={`${color} opacity-70`} style={{ width: `${pct}%` }} />
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Overdue follow-ups */}
      {overdue.length > 0 && (
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3 flex items-center gap-1">
            <AlertCircle size={12} /> Overdue Follow-Ups ({overdue.length})
          </p>
          <div className="space-y-2">
            {overdue.sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime()).map(lead => {
              const daysOverdue = differenceInDays(now, new Date(lead.nextFollowUp!));
              return (
                <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 gap-3">
                  <div className="min-w-0">
                    <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-gray-900 hover:text-[#BB162B]">
                      {lead.firstName} {lead.lastName}
                    </Link>
                    <p className="text-xs text-orange-600 mt-0.5">
                      Due {format(new Date(lead.nextFollowUp!), "MMM d")} · {daysOverdue === 0 ? "today" : `${daysOverdue}d overdue`}
                      {lead.followUpNote && ` · ${lead.followUpNote.slice(0, 40)}…`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-orange-200 text-orange-700 capitalize">
                      {lead.status.replace("_", " ")}
                    </span>
                    {lead.phone && (
                      <a href={`sms:${lead.phone}`}
                        className="text-xs px-2 py-1 rounded-md bg-[#BB162B] text-white hover:bg-red-700 transition">
                        Text
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav link grid */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tools</p>
        <div className="grid grid-cols-2 gap-4">
          {LINKS.map(({ href, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-red-100 transition"
            >
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    if (!authed) return;
    setLoadingLeads(true);
    fetch("/api/leads")
      .then(r => r.json())
      .then(data => setLeads(Array.isArray(data) ? data : []))
      .finally(() => setLoadingLeads(false));
  }, [authed]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        setAuthed(true);
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Server error. Try again.");
    }
    setLoading(false);
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#BB162B] rounded-md flex items-center justify-center font-bold text-sm text-white">K</div>
            <div>
              <p className="font-semibold text-sm leading-tight text-gray-900">Admin Access</p>
              <p className="text-xs text-gray-400 leading-tight">KIA Sales Assistant</p>
            </div>
          </div>
          <form onSubmit={login} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="Enter admin password"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={loading || !pw}
              className="w-full bg-[#BB162B] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? "Checking…" : "Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#BB162B] rounded-xl flex items-center justify-center font-bold text-white">K</div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sales Command Center</h1>
            <p className="text-xs text-gray-500">KIA Sales Assistant — {format(new Date(), "EEEE, MMMM d")}</p>
          </div>
        </div>
        {loadingLeads ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading dashboard…</div>
        ) : (
          <CommandCenter leads={leads} />
        )}
      </div>
    </div>
  );
}
