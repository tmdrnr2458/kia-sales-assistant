"use client";
import { useEffect, useState } from "react";
import { Copy, CheckCircle, Plus, Trash2 } from "lucide-react";

type Template = { id: string; name: string; category: string; body: string; variables?: string };

const CATEGORIES = ["greeting", "follow_up", "appointment", "offer", "nurture", "closing"];
const CATEGORY_LABELS: Record<string, string> = {
  greeting: "Greeting", follow_up: "Follow-Up", appointment: "Appointment",
  offer: "Offer", nurture: "Nurture", closing: "Closing",
};
const CATEGORY_COLORS: Record<string, string> = {
  greeting: "bg-blue-100 text-blue-700", follow_up: "bg-orange-100 text-orange-700",
  appointment: "bg-green-100 text-green-700", offer: "bg-yellow-100 text-yellow-700",
  nurture: "bg-purple-100 text-purple-700", closing: "bg-red-100 text-red-700",
};

const SEED_TEMPLATES: Omit<Template, "id">[] = [
  { name: "Initial Greeting – Walk-In", category: "greeting", body: "Hi {{first_name}}! It was great meeting you today at KIA of Raleigh. I'm {{my_name}}, your product specialist. Let me know if you have any questions about the vehicles you looked at today!", variables: '["first_name","my_name"]' },
  { name: "Initial Greeting – Online Lead", category: "greeting", body: "Hi {{first_name}}! Thanks for reaching out to KIA of Raleigh. I'm {{my_name}} and I'd love to help you find the perfect KIA. Are you available for a quick call or visit this week?", variables: '["first_name","my_name"]' },
  { name: "Day-After Follow-Up", category: "follow_up", body: "Hi {{first_name}}, this is {{my_name}} from KIA of Raleigh. Just checking in after your visit yesterday. Any questions about the {{vehicle}}? I'd love to help you move forward!", variables: '["first_name","my_name","vehicle"]' },
  { name: "3-Day Follow-Up", category: "follow_up", body: "Hi {{first_name}}! It's {{my_name}} from KIA of Raleigh. Still thinking about the {{vehicle}}? I have a couple of options I think you'd love. Worth 10 minutes to chat?", variables: '["first_name","my_name","vehicle"]' },
  { name: "Appointment Reminder", category: "appointment", body: "Hi {{first_name}}! Just a reminder that you have an appointment at KIA of Raleigh tomorrow, {{date}} at {{time}}. See you then! – {{my_name}}", variables: '["first_name","date","time","my_name"]' },
  { name: "Appointment Confirmation", category: "appointment", body: "Hi {{first_name}}, your appointment is confirmed for {{date}} at {{time}} at KIA of Raleigh. We look forward to seeing you! – {{my_name}}", variables: '["first_name","date","time","my_name"]' },
  { name: "Special Offer / Incentive", category: "offer", body: "Hi {{first_name}}! KIA has a limited-time offer on the {{vehicle}} this month – {{offer_details}}. This could save you significantly. Want to come in and take a look? – {{my_name}}", variables: '["first_name","vehicle","offer_details","my_name"]' },
  { name: "Long-Term Nurture", category: "nurture", body: "Hi {{first_name}}! It's {{my_name}} from KIA of Raleigh. Just wanted to check in – are you still in the market for a new vehicle? We have some exciting new arrivals that might interest you.", variables: '["first_name","my_name"]' },
  { name: "Trade-In Inquiry", category: "nurture", body: "Hi {{first_name}}, {{my_name}} here from KIA of Raleigh. We're currently offering great trade-in values for {{trade_vehicle}}. Would you like a free estimate? Could offset your new KIA nicely!", variables: '["first_name","my_name","trade_vehicle"]' },
  { name: "Deal Closed – Thank You", category: "closing", body: "Hi {{first_name}}! Congratulations on your new {{vehicle}}! It was a pleasure working with you. Please don't hesitate to reach out if you need anything. Enjoy the ride! – {{my_name}}", variables: '["first_name","vehicle","my_name"]' },
  { name: "Lost Deal – Stay in Touch", category: "closing", body: "Hi {{first_name}}, thanks for considering KIA of Raleigh. Whenever you're ready to make a move, I'm here to help. Feel free to reach out anytime! – {{my_name}}", variables: '["first_name","my_name"]' },
  { name: "Review Request", category: "closing", body: "Hi {{first_name}}! Hope you're loving your new KIA! If you have a moment, a Google review would mean the world to us. Here's the link: {{review_link}} Thanks! – {{my_name}}", variables: '["first_name","review_link","my_name"]' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filter, setFilter] = useState("all");
  const [copied, setCopied] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newT, setNewT] = useState({ name: "", category: "follow_up", body: "" });
  const [customVars, setCustomVars] = useState<Record<string, string>>({});

  useEffect(() => {
    const key = "kia_templates_seeded_v1";
    if (!localStorage.getItem(key)) {
      const seeded = SEED_TEMPLATES.map((t, i) => ({ ...t, id: `seed_${i}` }));
      localStorage.setItem("kia_templates", JSON.stringify(seeded));
      localStorage.setItem(key, "1");
    }
    const stored = localStorage.getItem("kia_templates");
    setTemplates(stored ? JSON.parse(stored) : []);
  }, []);

  function save(updated: Template[]) {
    setTemplates(updated);
    localStorage.setItem("kia_templates", JSON.stringify(updated));
  }

  function addTemplate() {
    const t: Template = { ...newT, id: `custom_${Date.now()}` };
    save([...templates, t]);
    setNewT({ name: "", category: "follow_up", body: "" });
    setShowNew(false);
  }

  function remove(id: string) {
    save(templates.filter((t) => t.id !== id));
  }

  function copyTemplate(t: Template) {
    let text = t.body;
    const vars: string[] = t.variables ? JSON.parse(t.variables) : [];
    vars.forEach((v) => { text = text.replaceAll(`{{${v}}}`, customVars[v] ?? `[${v}]`); });
    navigator.clipboard.writeText(text);
    setCopied(t.id); setTimeout(() => setCopied(""), 2000);
  }

  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);
  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30 focus:border-kia-red";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Message Templates</h1>
          <p className="text-sm text-gray-500">{templates.length} templates • Click Copy to fill variables and copy</p>
        </div>
        <button onClick={() => setShowNew(!showNew)}
          className="flex items-center gap-2 px-4 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition">
          <Plus size={16} /> Add Template
        </button>
      </div>

      {/* Variable filler */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fill in variables before copying</p>
        <div className="grid grid-cols-4 gap-3">
          {["first_name","my_name","vehicle","date","time","trade_vehicle","offer_details","review_link"].map((v) => (
            <div key={v}>
              <label className="block text-xs text-gray-400 mb-1">{`{{${v}}}`}</label>
              <input className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-kia-red/30"
                value={customVars[v] ?? ""} onChange={(e) => setCustomVars((prev) => ({ ...prev, [v]: e.target.value }))}
                placeholder={v.replace("_", " ")} />
            </div>
          ))}
        </div>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl border border-kia-red/20 shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-800">New Template</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Name</label>
              <input className={inputCls} value={newT.name} onChange={(e) => setNewT((p) => ({ ...p, name: e.target.value }))} placeholder="Template name" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Category</label>
              <select className={inputCls} value={newT.category} onChange={(e) => setNewT((p) => ({ ...p, category: e.target.value }))}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Message</label>
            <textarea className={inputCls + " resize-none"} rows={4} value={newT.body} onChange={(e) => setNewT((p) => ({ ...p, body: e.target.value }))} /></div>
          <div className="flex gap-2">
            <button onClick={addTemplate} disabled={!newT.name || !newT.body}
              className="px-4 py-2 bg-kia-red text-white rounded-lg text-sm font-medium hover:bg-kia-red-dark transition disabled:opacity-50">Save</button>
            <button onClick={() => setShowNew(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === "all" ? "bg-kia-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${filter === c ? "bg-kia-navy text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((t) => {
          const vars: string[] = t.variables ? JSON.parse(t.variables) : [];
          return (
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${CATEGORY_COLORS[t.category] ?? "bg-gray-100 text-gray-500"}`}>
                    {CATEGORY_LABELS[t.category] ?? t.category}
                  </span>
                </div>
                <button onClick={() => remove(t.id)} className="text-gray-200 hover:text-red-400 transition p-1">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {t.body.split(/({{[^}]+}})/).map((part, i) =>
                  part.startsWith("{{") ? (
                    <span key={i} className="text-kia-red font-medium">{customVars[part.slice(2, -2)] ?? part}</span>
                  ) : part
                )}
              </p>
              {vars.length > 0 && (
                <p className="text-xs text-gray-400">Variables: {vars.map((v) => `{{${v}}}`).join(", ")}</p>
              )}
              <button onClick={() => copyTemplate(t)}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-gray-50 transition mt-auto">
                {copied === t.id ? <><CheckCircle size={14} className="text-green-500" /> Copied!</> : <><Copy size={14} /> Copy Message</>}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
