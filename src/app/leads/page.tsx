import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { format } from "date-fns";
import { Plus, Flame, Phone, Mail, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  qualified: "bg-cyan-100 text-cyan-700",
  test_drive: "bg-purple-100 text-purple-700",
  offer: "bg-yellow-100 text-yellow-700",
  finance: "bg-orange-100 text-orange-700",
  closed_won: "bg-green-100 text-green-700",
  closed_lost: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New", qualified: "Qualified", test_drive: "Test Drive",
  offer: "Offer", finance: "Finance", closed_won: "Closed Won", closed_lost: "Closed Lost",
};

export default async function LeadsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status;
  const leads = await prisma.lead.findMany({
    where: status ? { status } : undefined,
    orderBy: [{ hotScore: "desc" }, { createdAt: "desc" }],
    include: { appointments: { where: { status: "scheduled" }, orderBy: { startTime: "asc" }, take: 1 } },
  });

  const pipeline = ["new", "qualified", "test_drive", "offer", "finance", "closed_won", "closed_lost"];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Link href="/leads/new"
          className="flex items-center gap-2 px-4 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition">
          <Plus size={16} /> New Lead
        </Link>
      </div>

      {/* Pipeline filter */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/leads"
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${!status ? "bg-kia-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All ({leads.length})
        </Link>
        {pipeline.map((s) => (
          <Link key={s} href={`/leads?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${status === s ? "bg-kia-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Lead cards */}
      {leads.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <p className="text-gray-400 mb-3">No leads yet</p>
          <Link href="/leads/new" className="text-sm text-kia-red hover:underline">Add your first lead</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Link key={lead.id} href={`/leads/${lead.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:border-kia-red/30 hover:shadow-sm transition group">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-kia-navy text-white flex items-center justify-center text-sm font-bold shrink-0">
                {lead.firstName[0]}{lead.lastName[0]}
              </div>

              {/* Name + vehicle */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 group-hover:text-kia-red">
                    {lead.firstName} {lead.lastName}
                  </p>
                  {lead.hotScore >= 7 && (
                    <span className="flex items-center gap-0.5 text-xs text-red-600 font-medium">
                      <Flame size={12} /> {lead.hotScore}/10
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {lead.vehicleType ?? "Any vehicle"} •{" "}
                  {lead.budgetOTD ? `$${lead.budgetOTD.toLocaleString()} OTD` : lead.budgetMonthly ? `$${lead.budgetMonthly}/mo` : "Budget TBD"} •{" "}
                  {lead.timeframe ?? "Timeframe unknown"}
                </p>
              </div>

              {/* Contact */}
              <div className="hidden md:flex items-center gap-3 text-xs text-gray-400">
                {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                {lead.email && <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>}
              </div>

              {/* Next appt */}
              {lead.appointments[0] && (
                <div className="text-right text-xs text-gray-500 hidden lg:block">
                  <p className="font-medium text-kia-red">
                    {format(new Date(lead.appointments[0].startTime), "MMM d")}
                  </p>
                  <p>{format(new Date(lead.appointments[0].startTime), "h:mm a")}</p>
                </div>
              )}

              {/* Status */}
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? "bg-gray-100 text-gray-600"}`}>
                {STATUS_LABELS[lead.status] ?? lead.status}
              </span>

              <ChevronRight size={16} className="text-gray-300 group-hover:text-kia-red shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
