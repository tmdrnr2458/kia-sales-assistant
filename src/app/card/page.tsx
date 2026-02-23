"use client";
import { useEffect, useState } from "react";
import {
  Phone, MessageSquare, Mail, MapPin,
  Car, Calculator, CalendarDays,
  CheckCircle, Loader2, ChevronDown, ChevronRight,
} from "lucide-react";

// ─── Config ─────────────────────────────────────────────────────────────────
const NAME  = process.env.NEXT_PUBLIC_SALES_NAME  ?? "Seungkook Jae";
const TITLE = process.env.NEXT_PUBLIC_SALES_TITLE ?? "Sales Consultant / Product Specialist";
const PHONE = process.env.NEXT_PUBLIC_SALES_PHONE ?? "9842421715";
const EMAIL = process.env.NEXT_PUBLIC_SALES_EMAIL ?? "sjae@anderson-auto.net";
const ADDR  = process.env.NEXT_PUBLIC_STORE_ADDRESS  ?? "9209 Glenwood Ave, Raleigh, NC 27617";
const MAPS  = process.env.NEXT_PUBLIC_STORE_MAPS_URL ?? "https://www.google.com/maps/place/Fred+Anderson+Kia+of+Raleigh/data=!4m2!3m1!1s0x0:0xb2f8dcb4619019df";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtPhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : raw;
}
function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── Types ───────────────────────────────────────────────────────────────────
type Slot = { start: string; end: string; label: string };

// ─── Shared input style ───────────────────────────────────────────────────────
const inp = "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 bg-white";

// ════════════════════════════════════════════════════════════════════════════
// MONTHLY INVESTMENT CALCULATOR
// ════════════════════════════════════════════════════════════════════════════
function CalculatorSection({ onSchedule }: { onSchedule: () => void }) {
  const [price, setPrice] = useState("30000");
  const [down,  setDown]  = useState("3000");
  const [trade, setTrade] = useState("0");
  const [apr,   setApr]   = useState("7.9");
  const [term,  setTerm]  = useState("72");
  const [tax,      setTax]      = useState("3");
  const [fees,     setFees]     = useState("799");
  const [nonDoc,   setNonDoc]   = useState("160");

  const p  = Number(price) || 0;
  const d  = Number(down)  || 0;
  const tr = Number(trade) || 0;
  const r  = (Number(apr) || 0) / 100 / 12;
  const n  = Number(term) || 72;
  const taxAmt   = (p - tr) * ((Number(tax) || 0) / 100);
  const financed = Math.max(0, p - d - tr + taxAmt + (Number(fees) || 0) + (Number(nonDoc) || 0));
  const monthly  = r === 0
    ? financed / n
    : (financed * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);

  return (
    <section id="calculator" className="scroll-mt-4 max-w-lg mx-auto px-5 pb-12 space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Monthly Investment Calculator</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Vehicle Price ($)</label>
            <input className={inp} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Down Payment ($)</label>
            <input className={inp} type="number" value={down} onChange={(e) => setDown(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Trade-In Value ($)</label>
            <input className={inp} type="number" value={trade} onChange={(e) => setTrade(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">APR (%)</label>
            <input className={inp} type="number" step="0.1" value={apr} onChange={(e) => setApr(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Loan Term</label>
            <select className={inp} value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="60">60 months</option>
              <option value="72">72 months</option>
              <option value="84">84 months</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">NC Highway Use Tax (%)</label>
            <input className={inp} type="number" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Doc / Tag / Other Fees ($)</label>
            <input className={inp} type="number" value={fees} onChange={(e) => setFees(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Non Doc Fee ($)</label>
            <input className={inp} type="number" value={nonDoc} onChange={(e) => setNonDoc(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Result card */}
      <div className="bg-[#BB162B] rounded-2xl p-5 text-white">
        <p className="text-sm font-medium opacity-80 mb-0.5">Estimated Monthly Payment</p>
        <p className="text-5xl font-extrabold tracking-tight">
          ${isFinite(monthly) && monthly > 0 ? Math.ceil(monthly).toLocaleString() : "–"}
        </p>
        <p className="text-sm opacity-70 mt-1">/ month × {term} months</p>
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="opacity-60 text-xs">Amount Financed</p>
            <p className="font-bold">${financed.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
          <div>
            <p className="opacity-60 text-xs">Est. Tax ({tax}%)</p>
            <p className="font-bold">${taxAmt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      {/* Funnel CTA */}
      <button
        onClick={onSchedule}
        className="flex items-center justify-center gap-2 w-full bg-[#BB162B] text-white rounded-2xl py-4 font-bold hover:opacity-90 transition"
      >
        <CalendarDays size={16} /> Schedule a Test Drive
      </button>

      <p className="text-xs text-gray-400 text-center px-2">
        Estimate only. Actual APR, taxes, and fees vary. Contact Jae for exact figures.
      </p>

      <a href={`sms:${PHONE}?body=${encodeURIComponent("Hi Jae! I used your payment calculator and want to talk numbers.")}`}
        className="flex items-center justify-center gap-2 w-full bg-[#05141F] text-white rounded-2xl py-4 font-bold hover:opacity-90 transition">
        <MessageSquare size={16} /> Text Jae to talk numbers
      </a>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// BOOK APPOINTMENT
// ════════════════════════════════════════════════════════════════════════════
function BookSection() {
  const [slots,   setSlots]   = useState<Slot[]>([]);
  const [slotsOk, setSlotsOk] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", slotStart: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState("");

  useEffect(() => {
    fetch("/api/appointments?slots=true")
      .then((r) => r.json())
      .then((d) => { setSlots((d.slots ?? []).slice(0, 30)); setSlotsOk(true); })
      .catch(() => setSlotsOk(true));
  }, []);

  async function book() {
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/public/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, phone: form.phone,
          email: form.email || null, notes: form.notes || null,
          startTime: form.slotStart,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed.");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
    setSubmitting(false);
  }

  const chosenSlot = slots.find((s) => s.start === form.slotStart);

  if (done) {
    const apptSms = [
      `Hi Jae! I just booked an appointment on your card.`,
      `Name: ${form.name} | Phone: ${form.phone}`,
      chosenSlot ? `Slot: ${chosenSlot.label}` : null,
      form.notes ? `Notes: ${form.notes}` : null,
    ].filter(Boolean).join("\n");

    return (
      <section id="appointment" className="scroll-mt-4 max-w-lg mx-auto px-5 pb-12 space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Schedule Test Drive</h2>

        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <CheckCircle size={40} className="mx-auto mb-2 text-green-500" />
          <p className="font-bold text-green-800 text-lg">Appointment Requested!</p>
          {chosenSlot && (
            <p className="text-green-700 font-semibold mt-1">{chosenSlot.label}</p>
          )}
          <p className="text-sm text-green-700 mt-1">We&apos;ll confirm by text or email shortly.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Next steps</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p>✓ Your slot has been requested</p>
            <p>✓ Jae will confirm by text or email</p>
            <p>→ Bring your ID and any trade-in info</p>
          </div>
          <a href={`sms:${PHONE}?body=${encodeURIComponent(apptSms)}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#05141F] text-white font-semibold text-sm hover:opacity-90 transition">
            <MessageSquare size={15} /> Text Jae to confirm
          </a>
          <p className="text-xs text-gray-400 text-center">Opens a pre-filled text with your appointment info</p>
        </div>
      </section>
    );
  }

  const canSubmit = form.name && form.phone && form.slotStart;

  return (
    <section id="appointment" className="scroll-mt-4 max-w-lg mx-auto px-5 pb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Test Drive</h2>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Your Name *</label>
          <input className={inp} placeholder="First and last name"
            value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Phone *</label>
          <input className={inp} type="tel" placeholder="(919) 000-0000"
            value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Email (optional)</label>
          <input className={inp} type="email" placeholder="you@example.com"
            value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Choose a Time Slot *</label>
          {!slotsOk ? (
            <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400 py-2">
              No online slots available right now.{" "}
              <a href={`sms:${PHONE}`} className="text-red-600 font-medium">Text Jae</a> to schedule directly.
            </p>
          ) : (
            <select className={inp} value={form.slotStart}
              onChange={(e) => setForm((p) => ({ ...p, slotStart: e.target.value }))}>
              <option value="">— Pick a time —</option>
              {slots.map((s) => (
                <option key={s.start} value={s.start}>{s.label}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Questions / Notes (optional)</label>
          <textarea className={inp + " resize-none"} rows={2}
            placeholder="e.g. I want to test drive the Telluride EX…"
            value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button onClick={book} disabled={!canSubmit || submitting}
          className="w-full bg-red-600 text-white rounded-xl py-4 font-bold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2">
          {submitting ? <><Loader2 size={16} className="animate-spin" /> Booking…</> : "Request Appointment"}
        </button>
        <p className="text-xs text-gray-400 text-center">We&apos;ll confirm by text or email.</p>
      </div>
    </section>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
type ActionId = "appointment" | "calculator" | "inventory";

const ACTIONS: { id: ActionId; label: string; sub: string; icon: React.ElementType; color: string }[] = [
  { id: "appointment", label: "Schedule Test Drive",            sub: "Pick a time that works for you",    icon: CalendarDays, color: "bg-[#BB162B] text-white" },
  { id: "calculator",  label: "Monthly Investment Calculator",  sub: "Estimate your monthly payment",     icon: Calculator,   color: "bg-[#05141F] text-white" },
  { id: "inventory",   label: "Browse Inventory",              sub: "View new & pre-owned vehicles",     icon: Car,          color: "bg-[#BB162B] text-white" },
];

export default function CardPage() {
  const [open, setOpen] = useState<ActionId | null>(null);

  function toggle(id: ActionId) {
    setOpen((prev) => {
      const next = prev === id ? null : id;
      if (next) setTimeout(() => scrollTo(next), 50);
      return next;
    });
  }

  function openSection(id: ActionId) {
    setOpen(id);
    setTimeout(() => scrollTo(id), 50);
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-[#05141F] text-white">
        <div className="max-w-lg mx-auto px-5 pt-8 pb-6">
          <p className="text-xs text-white/50 uppercase tracking-widest mb-3">
            Fred Anderson KIA of Raleigh
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{NAME}</h1>
          <p className="text-[#BB162B] font-semibold mt-1 text-sm">{TITLE}</p>

          <div className="mt-4 space-y-2 text-sm">
            <a href={`tel:${PHONE}`} className="flex items-center gap-2.5 text-white/80 hover:text-white transition">
              <Phone size={14} className="text-white/40 shrink-0" />{fmtPhone(PHONE)}
            </a>
            <a href={`mailto:${EMAIL}`} className="flex items-center gap-2.5 text-white/80 hover:text-white transition">
              <Mail size={14} className="text-white/40 shrink-0" />{EMAIL}
            </a>
            <a href={MAPS} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-white/80 hover:text-white transition">
              <MapPin size={14} className="text-white/40 shrink-0" />{ADDR}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-2.5 mt-6">
            <a href={`tel:${PHONE}`}
              className="flex items-center justify-center gap-2 bg-[#BB162B] text-white rounded-2xl py-4 font-semibold text-sm active:opacity-80 transition">
              <Phone size={16} /> Call Now
            </a>
            <a href={`sms:${PHONE}`}
              className="flex items-center justify-center gap-2 bg-white/10 text-white rounded-2xl py-4 font-semibold text-sm active:opacity-80 hover:bg-white/20 transition">
              <MessageSquare size={16} /> Text Me
            </a>
            <a href={`mailto:${EMAIL}`}
              className="flex items-center justify-center gap-2 bg-white/10 text-white rounded-2xl py-4 font-semibold text-sm active:opacity-80 hover:bg-white/20 transition">
              <Mail size={16} /> Email Me
            </a>
            <a href={MAPS} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/10 text-white rounded-2xl py-4 font-semibold text-sm active:opacity-80 hover:bg-white/20 transition">
              <MapPin size={16} /> Get Directions
            </a>
          </div>
        </div>

        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3232.8!2d-78.6946!3d35.8865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89acf5a8c2e6d8b9%3A0xb2f8dcb4619019df!2sFred%20Anderson%20Kia%20of%20Raleigh!5e0!3m2!1sen!2sus!4v1"
          width="100%" height="180" style={{ border: 0 }}
          allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
          title="Fred Anderson KIA of Raleigh location"
        />
      </div>

      {/* ── Action Cards ── */}
      <div className="max-w-lg mx-auto px-5 py-6 space-y-3">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold text-center mb-4">
          How can I help you today?
        </p>
        {ACTIONS.map(({ id, label, sub, icon: Icon, color }) => {
          const isOpen = open === id;
          const cls = `w-full flex items-center gap-4 px-5 py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-transform ${color}`;
          const indicator = isOpen
            ? <ChevronDown size={18} className="ml-auto opacity-60 shrink-0" />
            : <ChevronRight size={18} className="ml-auto opacity-50 shrink-0" />;
          const inner = (
            <>
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Icon size={20} />
              </div>
              <div className="text-left">
                <p className="font-bold text-base leading-tight">{label}</p>
                <p className="text-xs opacity-70 mt-0.5">{sub}</p>
              </div>
              {indicator}
            </>
          );
          return id === "inventory"
            ? <a key={id} href="/card/inventory" className={cls}>{inner}</a>
            : (
              <button key={id} onClick={() => toggle(id)} className={cls}>
                {inner}
              </button>
            );
        })}
      </div>

      {/* ── Accordion Sections ── */}
      {open === "appointment" && <BookSection />}
      {open === "calculator"  && <CalculatorSection onSchedule={() => openSection("appointment")} />}

      {/* ── Footer ── */}
      <footer className="max-w-lg mx-auto px-5 pb-10 text-center text-xs text-gray-400 space-y-1">
        <p className="font-medium text-gray-500">{NAME}</p>
        <p>{ADDR}</p>
        <p>
          <a href={`tel:${PHONE}`} className="hover:text-gray-600">{fmtPhone(PHONE)}</a>
          {" · "}
          <a href={`mailto:${EMAIL}`} className="hover:text-gray-600">{EMAIL}</a>
        </p>
      </footer>

    </div>
  );
}
