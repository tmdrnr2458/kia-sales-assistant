'use client';

import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { VehicleData, ScoreResults } from '@/types';
import ScoreBar from './ScoreBar';
import PaymentCalc from './PaymentCalc';

const VERIFY_CHECKLIST = [
  'Clean title (no lien, confirm at DMV or title search)',
  'Frame / structural inspection — check for rust, repairs, uneven gaps',
  'Pre-purchase inspection by independent mechanic',
  'Recall check at NHTSA.gov (enter VIN)',
  'Tire condition and remaining tread depth',
  'Brake pads / rotors — listen and feel during test drive',
  'Transmission smooth through all gears',
  'AC / heat fully operational',
  'All electronics work (windows, locks, infotainment)',
  'Full maintenance history (not just CarFax — ask for dealer records)',
];

interface Props {
  vehicle: VehicleData;
  scores: ScoreResults;
  onReset: () => void;
}

export default function ReportCard({ vehicle, scores, onReset }: Props) {
  const [showEmail, setShowEmail] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  const vehicleName =
    [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ') ||
    'Vehicle';

  const verdictConfig = {
    BUY: {
      bg: 'bg-green-600',
      text: 'text-green-700',
      border: 'border-green-300',
      light: 'bg-green-50',
      icon: <CheckCircle2 size={28} />,
      tagline: 'Strong value — worth pursuing',
    },
    CONSIDER: {
      bg: 'bg-amber-500',
      text: 'text-amber-700',
      border: 'border-amber-300',
      light: 'bg-amber-50',
      icon: <AlertTriangle size={28} />,
      tagline: 'Conditional — negotiate or verify before committing',
    },
    PASS: {
      bg: 'bg-red-600',
      text: 'text-red-700',
      border: 'border-red-300',
      light: 'bg-red-50',
      icon: <XCircle size={28} />,
      tagline: 'Significant concerns — risk or price mismatch',
    },
  }[scores.verdict];

  const summaryText = buildSummaryText(vehicle, scores);

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(scores.talkTrackEmail);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-6">
      {/* Verdict badge */}
      <div className={`rounded-2xl border-2 ${verdictConfig.border} ${verdictConfig.light} p-6 text-center`}>
        <div className={`inline-flex items-center gap-3 ${verdictConfig.text} mb-2`}>
          {verdictConfig.icon}
          <span className="text-5xl font-black tracking-tight">{scores.verdict}</span>
        </div>
        <p className={`font-semibold ${verdictConfig.text} mt-1`}>{verdictConfig.tagline}</p>
        <div className="mt-3 text-slate-700 font-medium text-lg">{vehicleName}</div>
        {vehicle.price && (
          <div className="text-slate-500 text-sm mt-0.5">
            Asking ${vehicle.price.toLocaleString()}
            {scores.estimatedValue && (
              <> · Est. value ${scores.estimatedValue.toLocaleString()}</>
            )}
          </div>
        )}
        <div className={`inline-block mt-3 px-4 py-1 rounded-full text-white text-sm font-semibold ${verdictConfig.bg}`}>
          Combined Score: {scores.finalScore}/100
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-800">Score Breakdown</h3>
        <ScoreBar
          label="Deal Score"
          sublabel={scores.dealScore.label}
          score={scores.dealScore.score}
          details={scores.dealScore.details}
        />
        <ScoreBar
          label="Risk Score"
          sublabel={scores.riskScore.label}
          score={scores.riskScore.score}
          details={scores.riskScore.details}
        />
        <ScoreBar
          label="Fit Score"
          sublabel={scores.fitScore.label}
          score={scores.fitScore.score}
          details={scores.fitScore.details}
        />
      </div>

      {/* Key facts */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold text-slate-800">Key Facts</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            ['Year / Make / Model', [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ')],
            ['Trim', vehicle.trim ?? '—'],
            ['Asking Price', vehicle.price ? `$${vehicle.price.toLocaleString()}` : '—'],
            ['Est. Market Value', scores.estimatedValue ? `$${scores.estimatedValue.toLocaleString()}` : '—'],
            ['Mileage', vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : '—'],
            ['VIN', vehicle.vin ?? '—'],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="font-medium text-slate-800 text-right max-w-[60%] break-words">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* What to verify */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold text-slate-800">What to Verify Before Buying</h3>
        </div>
        <ul className="divide-y divide-slate-100">
          {VERIFY_CHECKLIST.map((item, i) => (
            <li key={i} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-slate-300 mt-0.5">☐</span>
              <span className="text-sm text-slate-700">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Negotiation talk track */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
          <h3 className="font-bold text-slate-800">Negotiation Talk Track</h3>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Quick verbal
            </p>
            <blockquote className="bg-slate-50 border-l-4 border-blue-500 pl-4 py-3 rounded-r-xl text-slate-700 text-sm italic">
              {scores.talkTrackShort}
            </blockquote>
          </div>

          <div>
            <button
              onClick={() => setShowEmail((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900"
            >
              {showEmail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showEmail ? 'Hide' : 'Show'} email version
            </button>

            {showEmail && (
              <div className="mt-3">
                <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-wrap font-sans">
                  {scores.talkTrackEmail}
                </pre>
                <button
                  onClick={copyEmail}
                  className="mt-2 flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900"
                >
                  <Copy size={14} />
                  {emailCopied ? 'Copied!' : 'Copy email'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment calculator */}
      <PaymentCalc defaultPrice={vehicle.price ?? 0} />

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={copySummary}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <Copy size={15} />
          {copied ? 'Copied!' : 'Copy Summary'}
        </button>

        {vehicle.listingUrl && (
          <a
            href={vehicle.listingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
          >
            <ExternalLink size={15} />
            Open Listing
          </a>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          Evaluate Another Vehicle
        </button>
      </div>
    </div>
  );
}

function buildSummaryText(vehicle: VehicleData, scores: ScoreResults): string {
  const name = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');
  const price = vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'N/A';
  const est = scores.estimatedValue ? `$${scores.estimatedValue.toLocaleString()}` : 'N/A';
  const mileage = vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : 'N/A';

  return `Deal Scout Report — ${name}
Verdict: ${scores.verdict} (${scores.finalScore}/100)

Asking Price: ${price}
Est. Market Value: ${est}
Mileage: ${mileage}
VIN: ${vehicle.vin ?? 'N/A'}

Deal Score: ${scores.dealScore.score}/100 (${scores.dealScore.label})
Risk Score: ${scores.riskScore.score}/100 (${scores.riskScore.label})
Fit Score:  ${scores.fitScore.score}/100 (${scores.fitScore.label})

--- Talk Track ---
${scores.talkTrackShort}

Generated by Deal Scout · dealscout.vercel.app`;
}
