"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Copy, Wand2, CheckCircle, ExternalLink, Share2 } from "lucide-react";

type Vehicle = {
  id: string; year: number; make: string; model: string; trim?: string;
  price?: number; mileage: number; stockNumber: string; url?: string;
  exteriorColor?: string; photos?: string; type: string;
};

type Kit = {
  shortDesc: string; mediumDesc: string; longDesc: string;
  sellingPoints: string[]; checklist: string[];
};

export default function PostKitPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [loading, setLoading] = useState(false);
  const [carfax, setCarfax] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"short" | "medium" | "long">("medium");
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch(`/api/inventory`).then(r => r.json()).then(data => {
      const v = data.vehicles?.find((x: Vehicle) => x.id === vehicleId);
      if (v) setVehicle(v);
    });
  }, [vehicleId]);

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/ai/generate-post", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vehicleId, carfaxNotes: carfax }),
    });
    const data = await res.json();
    setKit(data.kit);
    setLoading(false);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const CopyBtn = ({ text, id }: { text: string; id: string }) => (
    <button onClick={() => copy(text, id)}
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition">
      {copied === id ? <><CheckCircle size={12} className="text-green-500" /> Copied!</> : <><Copy size={12} /> Copy</>}
    </button>
  );

  const photos = vehicle?.photos ? JSON.parse(vehicle.photos) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Share2 size={22} className="text-kia-red" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facebook Post Kit</h1>
          {vehicle && <p className="text-sm text-gray-500">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ?? ""} • Stock# {vehicle.stockNumber}</p>}
        </div>
      </div>

      {/* Vehicle preview */}
      {vehicle && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4">
          {photos[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photos[0]} alt="" className="w-36 h-24 object-cover rounded-lg bg-gray-100 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-gray-900">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim ?? ""}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {vehicle.type === "new" ? "Brand New" : "Pre-Owned"} •{" "}
              {vehicle.price ? `$${vehicle.price.toLocaleString()}` : "Call for price"} •{" "}
              {vehicle.mileage > 0 ? `${vehicle.mileage.toLocaleString()} mi` : "0 mi"} •{" "}
              {vehicle.exteriorColor ?? ""}
            </p>
            {vehicle.url && (
              <a href={vehicle.url} target="_blank" rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-xs text-kia-red hover:underline">
                <ExternalLink size={11} /> View on KIA of Raleigh
              </a>
            )}
          </div>
        </div>
      )}

      {/* Carfax input (pre-owned only) */}
      {vehicle?.type === "pre-owned" && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-2">Carfax Highlights (optional)</h2>
          <p className="text-xs text-gray-400 mb-2">Paste your Carfax summary here and it will be included in the post kit. If left blank, a placeholder will appear.</p>
          <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-kia-red/30"
            rows={3} value={carfax} onChange={e => setCarfax(e.target.value)}
            placeholder="e.g. 1 previous owner, no accidents, 22 service records..." />
        </div>
      )}

      {/* Generate button */}
      <button onClick={generate} disabled={loading || !vehicle}
        className="flex items-center gap-2 px-5 py-3 bg-kia-red text-white rounded-xl text-sm font-semibold hover:bg-kia-red-dark transition disabled:opacity-60 shadow">
        <Wand2 size={16} className={loading ? "animate-pulse" : ""} />
        {loading ? "Generating with AI..." : "Generate Post Kit"}
      </button>

      {/* Post Kit results */}
      {kit && (
        <div className="space-y-4">
          {/* Tab selector */}
          <div className="flex gap-2">
            {(["short", "medium", "long"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${activeTab === t ? "bg-kia-navy text-white border-kia-navy" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                {t === "short" ? "Hook (~100c)" : t === "medium" ? "Main Post (~300c)" : "Full Listing (~600c)"}
              </button>
            ))}
          </div>

          {/* Post text */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 capitalize">{activeTab} Version</h3>
              <CopyBtn text={kit[`${activeTab}Desc`]} id={activeTab} />
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {kit[`${activeTab}Desc`]}
              {vehicle?.type === "pre-owned" && activeTab === "long" && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-gray-500 text-xs">
                  <strong>Carfax Highlights:</strong>{" "}
                  {carfax || "[ Paste your Carfax highlights here before posting ]"}
                </div>
              )}
            </div>
          </div>

          {/* Selling points */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Key Selling Points</h3>
              <CopyBtn text={kit.sellingPoints.map(p => `• ${p}`).join("\n")} id="points" />
            </div>
            <ul className="space-y-1.5">
              {kit.sellingPoints.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-kia-red font-bold mt-0.5">•</span> {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Pre-posting checklist */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Pre-Posting Checklist</h3>
            <div className="space-y-2">
              {kit.checklist.map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={checkedItems.has(i)}
                    onChange={() => setCheckedItems(prev => {
                      const s = new Set(prev);
                      s.has(i) ? s.delete(i) : s.add(i); return s;
                    })}
                    className="w-4 h-4 rounded border-gray-300 text-kia-red focus:ring-kia-red" />
                  <span className={`text-sm ${checkedItems.has(i) ? "line-through text-gray-400" : "text-gray-700"}`}>{item}</span>
                </label>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              {checkedItems.size}/{kit.checklist.length} items complete
            </p>
          </div>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Vehicle Photos ({photos.length})</h3>
              <div className="grid grid-cols-4 gap-2">
                {photos.slice(0, 8).map((src: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={src} alt="" className="w-full h-20 object-cover rounded-lg bg-gray-100" />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Right-click to save photos for your listing</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
