"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Calendar, Check, X, AlertCircle } from "lucide-react";

type Slot = { start: string; end: string; label: string };
type Lead = { id: string; firstName: string; lastName: string };
type Appointment = {
  id: string; startTime: string; endTime: string; purpose: string;
  status: string; notes?: string;
  lead: { firstName: string; lastName: string; phone?: string };
};

const purposes = [
  { value: "test_drive", label: "Test Drive" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "delivery", label: "Delivery" },
  { value: "finance", label: "Finance Meeting" },
  { value: "other", label: "Other" },
];

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const prefilledLead = searchParams.get("leadId");
  const calendarConnected = searchParams.get("calendarConnected");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedLead, setSelectedLead] = useState(prefilledLead ?? "");
  const [purpose, setPurpose] = useState("test_drive");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/appointments?slots=true").then(r => r.json()),
      fetch("/api/appointments").then(r => r.json()),
      fetch("/api/leads").then(r => r.json()),
    ]).then(([slotsData, apptData, leadsData]) => {
      setSlots(slotsData.slots ?? []);
      setAppointments(apptData ?? []);
      setLeads(leadsData ?? []);
    });

    // Check calendar connection
    fetch("/api/appointments").then(r => {
      setIsCalendarConnected(r.status !== 503);
    });
  }, []);

  async function book() {
    if (!selectedSlot || !selectedLead) return;
    setBooking(true); setError(""); setSuccess("");
    const res = await fetch("/api/appointments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: selectedLead, startTime: selectedSlot.start, purpose, notes }),
    });
    if (res.ok) {
      const appt = await res.json();
      setSuccess("Appointment booked!");
      setAppointments(prev => [...prev, { ...appt, lead: leads.find(l => l.id === selectedLead) ?? { firstName: "?", lastName: "?" } }]);
      setSelectedSlot(null); setNotes("");
      // Refresh slots
      fetch("/api/appointments?slots=true").then(r => r.json()).then(d => setSlots(d.slots ?? []));
    } else {
      const err = await res.json();
      setError(err.error ?? "Failed to book");
    }
    setBooking(false);
  }

  async function cancel(id: string) {
    await fetch("/api/appointments", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "cancelled" }),
    });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: "cancelled" } : a));
  }

  const upcomingAppts = appointments.filter(a => a.status === "scheduled" && new Date(a.startTime) >= new Date());
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30 focus:border-kia-red";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
        {!isCalendarConnected && (
          <a href="/api/calendar/auth"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            <Calendar size={16} className="text-blue-500" /> Connect Google Calendar
          </a>
        )}
        {isCalendarConnected && (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full">
            <Check size={12} /> Google Calendar connected
          </span>
        )}
      </div>

      {calendarConnected && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <Check size={16} /> Google Calendar connected successfully!
        </div>
      )}

      <div className="grid grid-cols-5 gap-6">
        {/* Booking form */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Book Appointment</h2>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
            <select className={inputCls} value={selectedLead} onChange={e => setSelectedLead(e.target.value)}>
              <option value="">Select a lead...</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.firstName} {l.lastName}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Purpose</label>
            <div className="grid grid-cols-2 gap-2">
              {purposes.map(p => (
                <button key={p.value} onClick={() => setPurpose(p.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs border transition ${purpose === p.value ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Available Slots (2-hour blocks)</label>
            <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
              {slots.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">No available slots in the next 14 days</p>
              ) : slots.map((s, i) => (
                <button key={i} onClick={() => setSelectedSlot(selectedSlot?.start === s.start ? null : s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition ${selectedSlot?.start === s.start ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optional)</label>
            <textarea className={inputCls + " resize-none"} rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Interested in EV6, needs to test AWD..." />
          </div>

          {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} /> {error}</p>}
          {success && <p className="text-xs text-green-600 flex items-center gap-1"><Check size={12} /> {success}</p>}

          <button onClick={book} disabled={!selectedSlot || !selectedLead || booking}
            className="w-full py-2.5 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition disabled:opacity-50">
            {booking ? "Booking..." : "Confirm Appointment"}
          </button>
        </div>

        {/* Upcoming appointments */}
        <div className="col-span-3 space-y-3">
          <h2 className="font-semibold text-gray-900">Upcoming ({upcomingAppts.length})</h2>
          {upcomingAppts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100 text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No upcoming appointments</p>
            </div>
          ) : (
            upcomingAppts.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-4">
                <div className="text-center min-w-[60px]">
                  <p className="text-lg font-bold text-kia-red">{format(new Date(a.startTime), "d")}</p>
                  <p className="text-xs text-gray-500">{format(new Date(a.startTime), "MMM")}</p>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{a.lead.firstName} {a.lead.lastName}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {a.purpose.replace("_", " ")} • {format(new Date(a.startTime), "h:mm a")} – {format(new Date(a.endTime), "h:mm a")}
                  </p>
                  {a.notes && <p className="text-xs text-gray-400 mt-1 italic">{a.notes}</p>}
                  {a.lead.phone && <p className="text-xs text-gray-400 mt-0.5">{a.lead.phone}</p>}
                </div>
                <button onClick={() => cancel(a.id)}
                  className="text-gray-300 hover:text-red-500 transition p-1" title="Cancel appointment">
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<div className="text-gray-400 p-6 animate-pulse">Loading appointments...</div>}>
      <AppointmentsContent />
    </Suspense>
  );
}
