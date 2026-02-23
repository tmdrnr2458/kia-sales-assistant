"use client";
import { useEffect, useState } from "react";
import { RefreshCw, ExternalLink, Share2, Search, Car, MapPin } from "lucide-react";
import Link from "next/link";

type Vehicle = {
  id: string; stockNumber: string; type: string; year: number; make: string;
  model: string; trim?: string; price?: number; mileage: number;
  exteriorColor?: string; interiorColor?: string; url?: string;
  photos?: string; description?: string; features?: string;
  lastScraped: string;
};

// Map account keywords in description to dealer label + color
const DEALER_LABELS: { match: string; label: string; color: string }[] = [
  { match: "Fred Anderson KIA",              label: "KIA",     color: "bg-red-100 text-red-700" },
  { match: "Fred Anderson Nissan",           label: "Nissan",  color: "bg-blue-100 text-blue-700" },
  { match: "Fred Anderson Toyota",           label: "Toyota",  color: "bg-green-100 text-green-700" },
];

function getDealerBadge(description?: string) {
  if (!description) return null;
  const match = DEALER_LABELS.find((d) => description.includes(d.match));
  return match ?? null;
}

const MAKES = ["All", "KIA", "Nissan", "Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Hyundai", "Other"];

export default function InventoryPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [source, setSource] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [search, setSearch] = useState("");
  const [filterMake, setFilterMake] = useState("All");
  const [filterDealer, setFilterDealer] = useState("All");
  const [sortBy, setSortBy] = useState("year");

  async function load(refresh = false) {
    if (refresh) setRefreshing(true); else setLoading(true);
    const res = await fetch(`/api/inventory${refresh ? "?refresh=true" : ""}`);
    const data = await res.json();
    setVehicles(data.vehicles ?? []);
    setSource(data.source);
    setLastUpdated(data.lastUpdated);
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = vehicles
    .filter((v) => {
      if (filterMake !== "All") {
        if (filterMake === "Other") {
          const known = ["KIA","Nissan","Toyota","Honda","Ford","Chevrolet","BMW","Hyundai"];
          if (known.includes(v.make)) return false;
        } else if (v.make !== filterMake) return false;
      }
      if (filterDealer !== "All") {
        const badge = getDealerBadge(v.description ?? "");
        if (!badge || badge.label !== filterDealer) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return `${v.year} ${v.make} ${v.model} ${v.trim ?? ""} ${v.stockNumber} ${v.exteriorColor ?? ""}`.toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return (a.price ?? 999999) - (b.price ?? 999999);
      if (sortBy === "price_desc") return (b.price ?? 0) - (a.price ?? 0);
      if (sortBy === "mileage") return a.mileage - b.mileage;
      return b.year - a.year; // default: year desc
    });

  if (loading) return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pre-Owned Inventory</h1>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
            <div className="w-full h-40 bg-gray-200" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pre-Owned Inventory</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {source === "cache" ? "Cached" : "Live from kiaofraleigh.com"} •{" "}
            <span className="font-medium text-gray-600">{filtered.length}</span> of {vehicles.length} vehicles •{" "}
            Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "–"}
          </p>
        </div>
        <button onClick={() => load(true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-kia-navy text-white rounded-lg text-sm font-medium hover:bg-kia-navy-light transition disabled:opacity-60">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh Inventory"}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-4 items-center flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search year, make, model, stock#, color..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30" />
        </div>

        {/* Make filter */}
        <select value={filterMake} onChange={e => setFilterMake(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30">
          {MAKES.map(m => <option key={m}>{m}</option>)}
        </select>

        {/* Dealer filter */}
        <select value={filterDealer} onChange={e => setFilterDealer(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30">
          <option value="All">All Dealers</option>
          <option value="KIA">Fred Anderson KIA</option>
          <option value="Nissan">Fred Anderson Nissan</option>
          <option value="Toyota">Fred Anderson Toyota</option>
        </select>

        {/* Sort */}
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kia-red/30">
          <option value="year">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="mileage">Lowest Mileage</option>
        </select>
      </div>

      {/* Vehicle grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Car size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400 mb-1">No vehicles match your filters.</p>
          <button onClick={() => { setSearch(""); setFilterMake("All"); setFilterDealer("All"); }}
            className="text-sm text-kia-red hover:underline">Clear filters</button>
          {vehicles.length === 0 && (
            <p className="text-sm text-gray-400 mt-3">
              <button onClick={() => load(true)} className="text-kia-red hover:underline">Click Refresh</button> to load inventory from kiaofraleigh.com
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => {
            const photos = v.photos ? JSON.parse(v.photos) : [];
            const features = v.features ? JSON.parse(v.features) : [];
            const badge = getDealerBadge(v.description ?? "");

            return (
              <div key={v.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition group">
                {/* Photo */}
                <div className="relative w-full h-44 bg-gray-100">
                  {photos[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photos[0]} alt={`${v.year} ${v.make} ${v.model}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Car size={40} />
                      <p className="text-xs mt-1">No photo available</p>
                    </div>
                  )}
                  {/* Dealer badge */}
                  {badge && (
                    <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  )}
                  {/* CPO badge */}
                  {v.features?.includes("Certified") && (
                    <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-kia-red text-white">
                      CPO
                    </span>
                  )}
                </div>

                <div className="p-4">
                  {/* Title */}
                  <p className="font-semibold text-gray-900 text-sm leading-tight">
                    {v.year} {v.make} {v.model} {v.trim ?? ""}
                  </p>

                  {/* Price + mileage */}
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-lg font-bold text-kia-red">
                      {v.price ? `$${v.price.toLocaleString()}` : "Call for price"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {v.mileage > 0 ? `${v.mileage.toLocaleString()} mi` : "N/A"}
                    </p>
                  </div>

                  {/* Color + stock */}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {v.exteriorColor ?? "Color TBD"} • Stock# {v.stockNumber}
                  </p>

                  {/* Key features */}
                  {features.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-2">
                      {features.slice(0, 3).map((f: string) => (
                        <span key={f} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{f}</span>
                      ))}
                    </div>
                  )}

                  {/* Dealer location */}
                  {v.description && (
                    <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <MapPin size={10} />
                      {v.description.split(" • ").find(s => s.includes("Fred Anderson")) ?? ""}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    {v.url && (
                      <a href={v.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                        <ExternalLink size={12} /> View
                      </a>
                    )}
                    <Link href={`/post-kit/${v.id}`}
                      className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-kia-red text-white hover:bg-kia-red-dark transition">
                      <Share2 size={12} /> Post Kit
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
