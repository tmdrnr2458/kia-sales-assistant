'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Link2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import type { CompEntry, CompStats, VehicleData, BodyStyleType } from '@/types';
import { computeCompStats, compRangeLabel } from '@/lib/comps';

const STORAGE_KEY = 'dealscout_comps';

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

interface Props {
  vehicle: VehicleData;
  bodyStyle: BodyStyleType;
  onChange: (comps: CompEntry[], stats: CompStats | null) => void;
}

export default function CompsPanel({ vehicle, bodyStyle, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [comps, setComps] = useState<CompEntry[]>([]);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [urlOpen, setUrlOpen] = useState<Record<string, boolean>>({});
  const [extracting, setExtracting] = useState<Record<string, boolean>>({});
  const [extractMsg, setExtractMsg] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as CompEntry[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setComps(parsed.map((c) => ({ ...c, id: c.id || genId() })));
          setOpen(true); // auto-open if comps are saved
        }
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  // Persist and notify parent whenever comps change
  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comps));
    } catch {
      // ignore
    }
    const stats = computeCompStats(
      comps,
      vehicle.mileage ?? 60000,
      bodyStyle,
      vehicle.make,
    );
    onChangeRef.current(comps, stats);
  }, [comps, loaded, bodyStyle, vehicle.mileage, vehicle.make]);

  // Recompute stats when bodyStyle or mileage changes (user updates drivetrain/body)
  useEffect(() => {
    if (!loaded) return;
    const stats = computeCompStats(
      comps,
      vehicle.mileage ?? 60000,
      bodyStyle,
      vehicle.make,
    );
    onChangeRef.current(comps, stats);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyStyle, vehicle.mileage, loaded]);

  const stats = computeCompStats(comps, vehicle.mileage ?? 60000, bodyStyle, vehicle.make);
  const validCount = comps.filter(
    (c) => typeof c.price === 'number' && c.price > 0 && typeof c.mileage === 'number',
  ).length;

  function addComp() {
    setComps((prev) => [...prev, { id: genId() }]);
  }

  function removeComp(id: string) {
    setComps((prev) => prev.filter((c) => c.id !== id));
    setUrlInputs((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setUrlOpen((prev) => { const n = { ...prev }; delete n[id]; return n; });
    setExtractMsg((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  function updateComp(id: string, updates: Partial<CompEntry>) {
    setComps((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  }

  function clearAll() {
    setComps([]);
    setUrlInputs({});
    setUrlOpen({});
    setExtractMsg({});
  }

  async function extractComp(id: string) {
    const url = urlInputs[id]?.trim();
    if (!url) return;
    setExtracting((p) => ({ ...p, [id]: true }));
    setExtractMsg((p) => ({ ...p, [id]: '' }));
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.data?.price || data.data?.mileage) {
        updateComp(id, {
          url,
          price: data.data.price,
          mileage: data.data.mileage,
          year: data.data.year,
          source: (() => {
            try { return new URL(url).hostname.replace('www.', ''); } catch { return ''; }
          })(),
        });
        setUrlOpen((p) => ({ ...p, [id]: false }));
        setExtractMsg((p) => ({ ...p, [id]: '' }));
      } else {
        setExtractMsg((p) => ({
          ...p,
          [id]: 'Could not extract. Enter price/miles manually.',
        }));
      }
    } catch {
      setExtractMsg((p) => ({
        ...p,
        [id]: 'Fetch failed. Enter price/miles manually.',
      }));
    } finally {
      setExtracting((p) => ({ ...p, [id]: false }));
    }
  }

  return (
    <div className="border border-blue-200 rounded-2xl overflow-hidden bg-blue-50/30">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-50 transition"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 text-sm">Market Comps</span>
          {validCount >= 3 ? (
            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {validCount} comps · active
            </span>
          ) : validCount > 0 ? (
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium">
              {validCount} comp{validCount > 1 ? 's' : ''} · need {3 - validCount} more
            </span>
          ) : (
            <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">
              Recommended for accurate pricing
            </span>
          )}
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-blue-200 p-4 space-y-4">
          <p className="text-xs text-slate-500">
            Add 3–10 similar listings to compute a real market value. Fixes unrealistic estimates for vehicles like the Toyota 4Runner that defy standard depreciation models.{' '}
            <span className="text-slate-400">Some sites block extraction — if so, enter price/miles manually.</span>
          </p>

          {/* Comp rows */}
          {comps.length > 0 && (
            <div className="space-y-3">
              {comps.map((comp, i) => (
                <CompRow
                  key={comp.id}
                  index={i}
                  comp={comp}
                  urlInput={urlInputs[comp.id] ?? ''}
                  urlOpen={urlOpen[comp.id] ?? false}
                  extracting={extracting[comp.id] ?? false}
                  extractMsg={extractMsg[comp.id] ?? ''}
                  onUrlChange={(v) => setUrlInputs((p) => ({ ...p, [comp.id]: v }))}
                  onUrlToggle={() => setUrlOpen((p) => ({ ...p, [comp.id]: !p[comp.id] }))}
                  onExtract={() => extractComp(comp.id)}
                  onChange={(updates) => updateComp(comp.id, updates)}
                  onRemove={() => removeComp(comp.id)}
                />
              ))}
            </div>
          )}

          {/* Add button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addComp}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 border border-blue-300 hover:border-blue-500 bg-white px-3 py-1.5 rounded-lg transition"
            >
              <Plus size={14} /> Add Comp
            </button>
            {comps.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-slate-400 hover:text-red-500 transition"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Stats panel */}
          {stats && (
            <CompStatsPanel
              stats={stats}
              askingPrice={vehicle.price}
              subjectMileage={vehicle.mileage ?? 0}
              make={vehicle.make}
              bodyStyle={bodyStyle}
            />
          )}

          {validCount > 0 && validCount < 3 && (
            <p className="text-xs text-amber-600 font-medium">
              Add {3 - validCount} more comp{3 - validCount > 1 ? 's' : ''} (with price + miles) to activate comp-based pricing.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Individual comp row ───────────────────────────────────────────────────────

interface CompRowProps {
  index: number;
  comp: CompEntry;
  urlInput: string;
  urlOpen: boolean;
  extracting: boolean;
  extractMsg: string;
  onUrlChange: (v: string) => void;
  onUrlToggle: () => void;
  onExtract: () => void;
  onChange: (updates: Partial<CompEntry>) => void;
  onRemove: () => void;
}

function CompRow({
  index, comp, urlInput, urlOpen, extracting, extractMsg,
  onUrlChange, onUrlToggle, onExtract, onChange, onRemove,
}: CompRowProps) {
  const hasData = (comp.price && comp.price > 0) || (typeof comp.mileage === 'number');

  return (
    <div className={`bg-white rounded-xl border ${hasData ? 'border-slate-200' : 'border-dashed border-slate-300'} p-3`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Index */}
        <span className="text-xs text-slate-400 font-mono w-4 shrink-0">#{index + 1}</span>

        {/* Year */}
        <input
          type="number"
          placeholder="Year"
          value={comp.year ?? ''}
          onChange={(e) => onChange({ year: e.target.value ? parseInt(e.target.value, 10) : undefined })}
          className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />

        {/* Price */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <span className="px-2 text-slate-400 text-sm bg-slate-50 border-r border-slate-200 py-1.5">$</span>
          <input
            type="number"
            placeholder="Price"
            value={comp.price ?? ''}
            onChange={(e) => onChange({ price: e.target.value ? parseFloat(e.target.value) : undefined })}
            className="w-24 px-2 py-1.5 text-sm text-slate-800 focus:outline-none"
          />
        </div>

        {/* Miles */}
        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
          <input
            type="number"
            placeholder="Miles"
            value={comp.mileage ?? ''}
            onChange={(e) => onChange({ mileage: e.target.value ? parseInt(e.target.value, 10) : undefined })}
            className="w-24 px-2 py-1.5 text-sm text-slate-800 focus:outline-none"
          />
          <span className="px-2 text-slate-400 text-xs bg-slate-50 border-l border-slate-200 py-1.5">mi</span>
        </div>

        {/* Source */}
        <input
          type="text"
          placeholder="Source"
          value={comp.source ?? ''}
          onChange={(e) => onChange({ source: e.target.value })}
          className="w-24 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
        />

        {/* URL fill toggle */}
        <button
          type="button"
          onClick={onUrlToggle}
          title="Fill from URL"
          className={`p-1.5 rounded-lg border transition ${
            urlOpen
              ? 'bg-blue-700 border-blue-700 text-white'
              : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-700'
          }`}
        >
          <Link2 size={13} />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto p-1.5 text-slate-300 hover:text-red-500 transition"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* URL extraction row */}
      {urlOpen && (
        <div className="mt-2 flex gap-2">
          <input
            type="url"
            placeholder="Paste listing URL (Cars.com, AutoTrader, dealer…)"
            value={urlInput}
            onChange={(e) => onUrlChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onExtract()}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={onExtract}
            disabled={extracting || !urlInput.trim()}
            className="flex items-center gap-1 text-sm font-medium bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg transition whitespace-nowrap"
          >
            {extracting ? <Loader2 size={13} className="animate-spin" /> : <Link2 size={13} />}
            {extracting ? 'Extracting…' : 'Fill'}
          </button>
        </div>
      )}

      {extractMsg && (
        <p className="mt-1 text-xs text-amber-600">{extractMsg}</p>
      )}

      {comp.url && !urlOpen && (
        <a
          href={comp.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 block text-xs text-blue-600 hover:underline truncate"
        >
          {comp.url}
        </a>
      )}
    </div>
  );
}

// ── Stats panel ───────────────────────────────────────────────────────────────

function CompStatsPanel({
  stats,
  askingPrice,
  subjectMileage,
  make,
  bodyStyle,
}: {
  stats: CompStats;
  askingPrice?: number;
  subjectMileage: number;
  make?: string;
  bodyStyle: BodyStyleType;
}) {
  const rangeInfo = askingPrice ? compRangeLabel(askingPrice, stats) : null;

  // Price position bar: show p25, median, p75, and asking price
  const barMin   = Math.min(stats.p25, askingPrice ?? stats.p25) * 0.95;
  const barMax   = Math.max(stats.p75, askingPrice ?? stats.p75) * 1.05;
  const barRange = barMax - barMin;

  function pct(v: number) {
    return Math.max(0, Math.min(100, ((v - barMin) / barRange) * 100));
  }

  const mileageDelta = subjectMileage - stats.avgMileage;
  const adjAmt = Math.round(Math.abs(mileageDelta) * stats.ratePerMile);

  return (
    <div className="bg-white border border-green-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-slate-800 text-sm">
          Market Analysis — {stats.count} Comps
        </h4>
        {rangeInfo && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              rangeInfo.color === 'green'
                ? 'bg-green-100 text-green-700'
                : rangeInfo.color === 'amber'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {rangeInfo.label}
          </span>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatCell label="P25 (low)" value={`$${stats.p25.toLocaleString()}`} />
        <StatCell label="Median" value={`$${stats.median.toLocaleString()}`} accent />
        <StatCell label="P75 (high)" value={`$${stats.p75.toLocaleString()}`} />
      </div>

      {/* Mileage adjustment */}
      <div className="text-xs text-slate-500 space-y-0.5">
        <p>
          Avg comp mileage: {stats.avgMileage.toLocaleString()} mi
          {make ? ` · ${make} ${bodyStyle} rate: $${stats.ratePerMile.toFixed(2)}/mi` : ` · rate: $${stats.ratePerMile.toFixed(2)}/mi`}
        </p>
        {Math.abs(mileageDelta) > 500 && (
          <p>
            Subject has {Math.abs(mileageDelta).toLocaleString()} mi{' '}
            {mileageDelta > 0 ? 'more' : 'fewer'} than avg →{' '}
            adj {mileageDelta > 0 ? '−' : '+'}${adjAmt.toLocaleString()}
          </p>
        )}
        <p className="font-semibold text-slate-700">
          Comp-adjusted value for {subjectMileage.toLocaleString()} mi:{' '}
          <span className="text-blue-700">${stats.adjustedValue.toLocaleString()}</span>
        </p>
      </div>

      {/* Position bar */}
      {askingPrice && barRange > 0 && (
        <div className="space-y-1">
          <div className="relative h-4 bg-slate-100 rounded-full overflow-visible">
            {/* Green zone (p25 → median) */}
            <div
              className="absolute top-0 h-full bg-green-200 rounded-l-full"
              style={{ left: `${pct(stats.p25)}%`, width: `${pct(stats.median) - pct(stats.p25)}%` }}
            />
            {/* Amber zone (median → p75) */}
            <div
              className="absolute top-0 h-full bg-amber-200"
              style={{ left: `${pct(stats.median)}%`, width: `${pct(stats.p75) - pct(stats.median)}%` }}
            />
            {/* Markers */}
            {[
              { v: stats.p25,   label: 'P25',    cls: 'bg-green-500' },
              { v: stats.median, label: 'Med',   cls: 'bg-green-600' },
              { v: stats.p75,   label: 'P75',    cls: 'bg-amber-500' },
            ].map(({ v, cls }) => (
              <div
                key={v}
                className={`absolute top-0 w-0.5 h-full ${cls}`}
                style={{ left: `${pct(v)}%` }}
              />
            ))}
            {/* Asking price marker */}
            <div
              className="absolute -top-1 w-2 h-6 bg-blue-700 rounded-sm shadow"
              style={{ left: `calc(${pct(askingPrice)}% - 4px)` }}
              title={`Asking: $${askingPrice.toLocaleString()}`}
            />
          </div>
          <div className="relative h-4 text-xs text-slate-400 select-none">
            {[
              { v: stats.p25,    label: `$${(stats.p25 / 1000).toFixed(0)}k` },
              { v: stats.median, label: `$${(stats.median / 1000).toFixed(0)}k` },
              { v: stats.p75,    label: `$${(stats.p75 / 1000).toFixed(0)}k` },
            ].map(({ v, label }) => (
              <span
                key={v}
                className="absolute -translate-x-1/2"
                style={{ left: `${pct(v)}%` }}
              >
                {label}
              </span>
            ))}
            <span
              className="absolute -translate-x-1/2 font-semibold text-blue-700"
              style={{ left: `${pct(askingPrice)}%` }}
            >
              Ask
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCell({
  label, value, accent,
}: {
  label: string; value: string; accent?: boolean;
}) {
  return (
    <div className={`rounded-lg p-2 ${accent ? 'bg-slate-100' : 'bg-slate-50'}`}>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`font-bold text-sm ${accent ? 'text-slate-900' : 'text-slate-700'}`}>
        {value}
      </div>
    </div>
  );
}
