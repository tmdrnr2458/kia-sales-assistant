import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format, isToday, startOfDay, endOfDay } from "date-fns";
import { Users, Car, Calendar, TrendingUp, Plus, ArrowRight, Flame } from "lucide-react";

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 8 ? "bg-red-100 text-red-700 border border-red-200" :
    score >= 6 ? "bg-orange-100 text-orange-700 border border-orange-200" :
    score >= 4 ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                 "bg-gray-100 text-gray-500 border border-gray-200";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {score >= 7 && <Flame size={10} />} {score}/10
    </span>
  );
}

export default async function DashboardPage() {
  const now = new Date();

  const [totalLeads, hotLeads, todayAppts, vehicles, recentLeads] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.findMany({
      where: { hotScore: { gte: 7 }, status: { notIn: ["closed_won", "closed_lost"] } },
      orderBy: { hotScore: "desc" },
      take: 5,
      select: { id: true, firstName: true, lastName: true, hotScore: true, hotScoreReason: true, vehicleType: true, status: true },
    }),
    prisma.appointment.findMany({
      where: { startTime: { gte: startOfDay(now), lte: endOfDay(now) }, status: { not: "cancelled" } },
      include: { lead: { select: { firstName: true, lastName: true } } },
      orderBy: { startTime: "asc" },
    }),
    prisma.vehicle.count({ where: { isAvailable: true } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, firstName: true, lastName: true, hotScore: true, status: true, vehicleType: true, createdAt: true },
    }),
  ]);

  const pipelineMap: Record<string, string> = {
    new: "New", qualified: "Qualified", test_drive: "Test Drive",
    offer: "Offer", finance: "Finance", closed_won: "Won", closed_lost: "Lost",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500">{format(now, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <Link
          href="/leads/new"
          className="flex items-center gap-2 px-4 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition"
        >
          <Plus size={16} /> New Lead
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Leads", value: totalLeads, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Hot Leads", value: hotLeads.length, icon: Flame, color: "text-red-600", bg: "bg-red-50" },
          { label: "Today's Appts", value: todayAppts.length, icon: Calendar, color: "text-green-600", bg: "bg-green-50" },
          { label: "Inventory", value: vehicles, icon: Car, color: "text-purple-600", bg: "bg-purple-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's schedule */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today's Schedule</h2>
            <Link href="/appointments" className="text-xs text-kia-red hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {todayAppts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No appointments today</p>
          ) : (
            <div className="space-y-3">
              {todayAppts.map((appt) => (
                <div key={appt.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                  <div className="text-center min-w-[48px]">
                    <p className="text-xs font-bold text-kia-red">{format(new Date(appt.startTime), "h:mm")}</p>
                    <p className="text-xs text-gray-400">{format(new Date(appt.startTime), "a")}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {appt.lead.firstName} {appt.lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {appt.purpose.replace("_", " ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hot leads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Flame size={16} className="text-red-500" /> Hot Leads
            </h2>
            <Link href="/leads" className="text-xs text-kia-red hover:underline flex items-center gap-1">
              All leads <ArrowRight size={12} />
            </Link>
          </div>
          {hotLeads.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No hot leads yet</p>
          ) : (
            <div className="space-y-3">
              {hotLeads.map((lead) => (
                <Link key={lead.id} href={`/leads/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-red-50 transition group">
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-kia-red">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{lead.vehicleType ?? "Any vehicle"}</p>
                  </div>
                  <ScoreBadge score={lead.hotScore} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Recent Leads</h2>
            <Link href="/leads/new" className="text-xs text-kia-red hover:underline flex items-center gap-1">
              Add new <Plus size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentLeads.map((lead) => (
              <Link key={lead.id} href={`/leads/${lead.id}`}
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition group">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-kia-navy text-white flex items-center justify-center text-xs font-bold">
                    {lead.firstName[0]}{lead.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 group-hover:text-kia-red">
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isToday(new Date(lead.createdAt)) ? "Today" : format(new Date(lead.createdAt), "MMM d")}
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {pipelineMap[lead.status] ?? lead.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-kia-navy rounded-xl p-5 text-white">
        <h2 className="font-semibold mb-3">Quick Actions</h2>
        <div className="flex gap-3 flex-wrap">
          {[
            { href: "/leads/new",    label: "Add Lead",       icon: "+" },
            { href: "/inventory",    label: "Browse Inventory", icon: "🚗" },
            { href: "/appointments", label: "Schedule",        icon: "📅" },
            { href: "/message-templates", label: "Templates",   icon: "💬" },
            { href: "/business-card",    label: "Business Card", icon: "🪪" },
            { href: "/card",             label: "Public Card",   icon: "📱" },
          ].map(({ href, label, icon }) => (
            <Link key={href} href={href}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition">
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
