'use client';

import { useState } from 'react';
import { Search, AlertCircle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import type { VehicleData, ExtractionResult } from '@/types';
import ManualEntryForm from './ManualEntryForm';

interface Props {
  onVehicleReady: (data: VehicleData) => void;
}

export default function UrlStep({ onVehicleReady }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [extracted, setExtracted] = useState<Partial<VehicleData> | null>(null);

  async function handleAnalyze() {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data: ExtractionResult = await res.json();
      setResult(data);
      if (data.data) {
        setExtracted({ ...data.data, listingUrl: url.trim() });
        if (data.success) {
          // Auto-populate manual form with extracted data
          setShowManual(true);
        } else {
          setShowManual(true);
        }
      } else {
        setShowManual(true);
      }
    } catch {
      setResult({
        success: false,
        partial: true,
        message: 'Network error. Please enter vehicle details manually.',
      });
      setShowManual(true);
    } finally {
      setLoading(false);
    }
  }

  function handleManualSubmit(data: VehicleData) {
    onVehicleReady({ ...data, listingUrl: url.trim() || undefined });
  }

  function handleSkipToManual() {
    setShowManual(true);
    setResult(null);
  }

  return (
    <div className="space-y-5">
      {/* URL Input */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Paste a listing URL to auto-fill details
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://www.cars.com/listing/… or any dealer VDP"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading || !url.trim()}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold flex items-center gap-2 transition whitespace-nowrap"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Search size={16} />
            )}
            {loading ? 'Analyzing…' : 'Analyze'}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Works best with Cars.com, AutoTrader, and dealer pages. Some sites block automated access — manual entry is always available.
        </p>
      </div>

      {/* Skip link */}
      {!showManual && !loading && (
        <button
          onClick={handleSkipToManual}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Skip — enter details manually
        </button>
      )}

      {/* Status banner */}
      {result && (
        <div
          className={`flex items-start gap-3 rounded-xl p-4 border ${
            result.success
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {result.success ? (
            <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          ) : (
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-medium text-sm">
              {result.success ? 'Data extracted' : 'Partial extraction'}
            </p>
            <p className="text-sm mt-0.5 opacity-80">{result.message}</p>
          </div>
        </div>
      )}

      {/* Manual form */}
      {showManual && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">
              {extracted?.year || extracted?.make ? 'Verify extracted details' : 'Enter vehicle details'}
            </h3>
            {extracted && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Auto-filled where possible
              </span>
            )}
          </div>
          <ManualEntryForm initial={extracted ?? {}} onSubmit={handleManualSubmit} />
        </div>
      )}
    </div>
  );
}
