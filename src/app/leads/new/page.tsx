"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const steps = ["Contact", "Budget & Finance", "Vehicle Needs", "Trade-In & Notes"];

const vehicleTypes = ["SUV", "Sedan", "EV", "Truck", "Crossover", "Minivan", "Any"];
const creditOptions = ["Excellent (750+)", "Good (700-749)", "Fair (650-699)", "Poor (<650)", "Unknown / First-time buyer"];
const timeframes = ["ASAP – this week", "Within 1 month", "1-3 months", "3+ months", "Just looking"];
const contactPrefs = ["Phone call", "Text/SMS", "Email"];
const purposeMap: Record<string, string> = {
  "Phone call": "phone", "Text/SMS": "text", "Email": "email",
};

export default function NewLeadPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", email: "", preferredContact: "phone",
    vehicleType: "", budgetOTD: "", budgetMonthly: "", downPayment: "",
    creditComfort: "", term: "", timeframe: "",
    hasTradeIn: false, tradeYear: "", tradeMake: "", tradeModel: "", tradeMileage: "",
    mustHaveFeatures: "", notes: "", source: "walk-in",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    setSaving(true);
    const payload = {
      ...form,
      budgetOTD: form.budgetOTD ? parseFloat(form.budgetOTD) : null,
      budgetMonthly: form.budgetMonthly ? parseFloat(form.budgetMonthly) : null,
      downPayment: form.downPayment ? parseFloat(form.downPayment) : null,
      term: form.term ? parseInt(form.term) : null,
      tradeYear: form.tradeYear ? parseInt(form.tradeYear) : null,
      tradeMileage: form.tradeMileage ? parseInt(form.tradeMileage) : null,
    };
    const res = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const lead = await res.json();
    router.push(`/leads/${lead.id}`);
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30 focus:border-kia-red";
  const labelCls = "block text-xs font-medium text-gray-600 mb-1";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Lead</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
              ${i < step ? "bg-green-500 text-white" : i === step ? "bg-kia-red text-white" : "bg-gray-200 text-gray-500"}`}>
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === step ? "text-gray-900 font-medium" : "text-gray-400"}`}>{s}</span>
            {i < steps.length - 1 && <div className={`flex-1 h-0.5 w-8 ${i < step ? "bg-green-400" : "bg-gray-200"}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {/* Step 0: Contact */}
        {step === 0 && (
          <>
            <h2 className="font-semibold text-gray-800 text-lg">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>First Name *</label>
                <input className={inputCls} value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="Jane" /></div>
              <div><label className={labelCls}>Last Name *</label>
                <input className={inputCls} value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Doe" /></div>
            </div>
            <div><label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(919) 555-0100" type="tel" /></div>
            <div><label className={labelCls}>Email</label>
              <input className={inputCls} value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@email.com" type="email" /></div>
            <div><label className={labelCls}>Preferred Contact</label>
              <div className="flex gap-2">
                {contactPrefs.map((c) => (
                  <button key={c} onClick={() => set("preferredContact", purposeMap[c])}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.preferredContact === purposeMap[c] ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Lead Source</label>
              <select className={inputCls} value={form.source} onChange={e => set("source", e.target.value)}>
                {["walk-in","phone","website","referral","social"].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Step 1: Budget & Finance */}
        {step === 1 && (
          <>
            <h2 className="font-semibold text-gray-800 text-lg">Budget & Financing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>OTD Budget ($)</label>
                <input className={inputCls} value={form.budgetOTD} onChange={e => set("budgetOTD", e.target.value)} placeholder="35000" type="number" /></div>
              <div><label className={labelCls}>Monthly Budget ($)</label>
                <input className={inputCls} value={form.budgetMonthly} onChange={e => set("budgetMonthly", e.target.value)} placeholder="450" type="number" /></div>
            </div>
            <div><label className={labelCls}>Down Payment ($)</label>
              <input className={inputCls} value={form.downPayment} onChange={e => set("downPayment", e.target.value)} placeholder="3000" type="number" /></div>
            <div><label className={labelCls}>Credit Comfort</label>
              <div className="flex gap-2 flex-wrap">
                {creditOptions.map((c) => (
                  <button key={c} onClick={() => set("creditComfort", c)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${form.creditComfort === c ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Preferred Loan Term</label>
              <div className="flex gap-2">
                {["36","48","60","72","84"].map((t) => (
                  <button key={t} onClick={() => set("term", t)}
                    className={`px-3 py-2 rounded-lg text-sm border transition ${form.term === t ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {t}mo
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 2: Vehicle Needs */}
        {step === 2 && (
          <>
            <h2 className="font-semibold text-gray-800 text-lg">Vehicle Needs</h2>
            <div><label className={labelCls}>Vehicle Type</label>
              <div className="flex gap-2 flex-wrap">
                {vehicleTypes.map((t) => (
                  <button key={t} onClick={() => set("vehicleType", t)}
                    className={`px-3 py-2 rounded-lg text-sm border transition ${form.vehicleType === t ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Timeframe to Buy</label>
              <div className="flex gap-2 flex-wrap">
                {timeframes.map((t) => (
                  <button key={t} onClick={() => set("timeframe", t)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${form.timeframe === t ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Must-Have Features (comma separated)</label>
              <input className={inputCls} value={form.mustHaveFeatures} onChange={e => set("mustHaveFeatures", e.target.value)}
                placeholder="Sunroof, AWD, Heated seats, Android Auto" /></div>
            <div><label className={labelCls}>Additional Notes</label>
              <textarea className={inputCls + " resize-none"} rows={3} value={form.notes} onChange={e => set("notes", e.target.value)}
                placeholder="Anything else worth knowing about this customer..." /></div>
          </>
        )}

        {/* Step 3: Trade-In */}
        {step === 3 && (
          <>
            <h2 className="font-semibold text-gray-800 text-lg">Trade-In</h2>
            <div className="flex items-center gap-3">
              <button onClick={() => set("hasTradeIn", !form.hasTradeIn)}
                className={`px-4 py-2 rounded-lg text-sm border font-medium transition ${form.hasTradeIn ? "bg-kia-red text-white border-kia-red" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {form.hasTradeIn ? "Yes – has trade-in" : "No trade-in"}
              </button>
            </div>
            {form.hasTradeIn && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-3">
                  <div><label className={labelCls}>Year</label>
                    <input className={inputCls} value={form.tradeYear} onChange={e => set("tradeYear", e.target.value)} placeholder="2020" type="number" /></div>
                  <div><label className={labelCls}>Make</label>
                    <input className={inputCls} value={form.tradeMake} onChange={e => set("tradeMake", e.target.value)} placeholder="Toyota" /></div>
                  <div><label className={labelCls}>Model</label>
                    <input className={inputCls} value={form.tradeModel} onChange={e => set("tradeModel", e.target.value)} placeholder="Camry" /></div>
                </div>
                <div><label className={labelCls}>Mileage</label>
                  <input className={inputCls} value={form.tradeMileage} onChange={e => set("tradeMileage", e.target.value)} placeholder="45000" type="number" /></div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button onClick={() => step > 0 ? setStep(s => s - 1) : router.push("/leads")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition">
          <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
        </button>

        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)}
            disabled={step === 0 && !form.firstName}
            className="flex items-center gap-2 px-5 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition disabled:opacity-50">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button onClick={submit} disabled={saving || !form.firstName}
            className="flex items-center gap-2 px-5 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition disabled:opacity-50">
            {saving ? "Saving..." : <><Check size={16} /> Save Lead</>}
          </button>
        )}
      </div>
    </div>
  );
}
