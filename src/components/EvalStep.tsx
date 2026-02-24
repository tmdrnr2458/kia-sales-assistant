'use client';

import { useState, useCallback } from 'react';
import type {
  VehicleData,
  EvaluationInputs,
  UseCaseKey,
  DrivetrainType,
  BodyStyleType,
  CompEntry,
  CompStats,
} from '@/types';
import CompsPanel from './CompsPanel';

const USE_CASES: { key: UseCaseKey; label: string; emoji: string }[] = [
  { key: 'commute',     label: 'Daily Commute',          emoji: '🚗' },
  { key: 'family',      label: 'Family Use',             emoji: '👨‍👩‍👧' },
  { key: 'offroad',     label: 'Off-Road',               emoji: '🏔️' },
  { key: 'reliability', label: 'Long-Term Reliability',  emoji: '🔧' },
  { key: 'budget',      label: 'Budget-Friendly',        emoji: '💰' },
  { key: 'mpg',         label: 'Fuel Economy',           emoji: '⛽' },
];

const DRIVETRAINS: { value: DrivetrainType; label: string }[] = [
  { value: 'FWD',     label: 'FWD' },
  { value: 'RWD',     label: 'RWD' },
  { value: 'AWD',     label: 'AWD' },
  { value: '4WD',     label: '4WD / 4x4' },
  { value: 'unknown', label: 'Unknown' },
];

const BODY_STYLES: { value: BodyStyleType; label: string }[] = [
  { value: 'sedan',     label: 'Sedan' },
  { value: 'suv',       label: 'SUV / Crossover' },
  { value: 'truck',     label: 'Truck' },
  { value: 'van',       label: 'Van / Minivan' },
  { value: 'coupe',     label: 'Coupe' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'wagon',     label: 'Wagon' },
  { value: 'unknown',   label: 'Unknown' },
];

interface Props {
  vehicle: VehicleData;
  onScore: (inputs: EvaluationInputs, compStats?: CompStats) => void;
  onBack: () => void;
}

export default function EvalStep({ vehicle, onScore, onBack }: Props) {
  // Risk inputs
  const [hasAccident,       setHasAccident]       = useState<boolean>(vehicle.accidentHint ?? false);
  const [isSalvage,         setIsSalvage]         = useState(false);
  const [ownerCount,        setOwnerCount]        = useState<number>(vehicle.ownerHint ?? 1);
  const [isRentalFleet,     setIsRentalFleet]     = useState(false);
  const [hasServiceRecords, setHasServiceRecords] = useState(true);

  // Fit inputs
  const [useCases,  setUseCases]  = useState<UseCaseKey[]>(['reliability']);
  const [drivetrain, setDrivetrain] = useState<DrivetrainType>('unknown');
  const [bodyStyle,  setBodyStyle]  = useState<BodyStyleType>('unknown');

  // Deal inputs
  const [msrpOverride, setMsrpOverride] = useState('');

  // Comp state (managed by CompsPanel, surfaced here)
  const [compStats, setCompStats] = useState<CompStats | null>(null);

  const handleCompsChange = useCallback(
    (_comps: CompEntry[], stats: CompStats | null) => {
      setCompStats(stats);
    },
    [],
  );

  function toggleUseCase(key: UseCaseKey) {
    setUseCases((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }

  function handleSubmit() {
    onScore(
      {
        hasAccident,
        isSalvage,
        ownerCount,
        isRentalFleet,
        hasServiceRecords,
        useCases,
        drivetrain,
        bodyStyle,
        msrpOverride: msrpOverride ? parseFloat(msrpOverride) : undefined,
      },
      compStats ?? undefined,
    );
  }

  return (
    <div className="space-y-6">
      {/* Vehicle summary */}
      <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="font-semibold text-slate-800">
            {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ')}
          </span>
          {vehicle.price && (
            <span className="ml-3 text-blue-700 font-bold">${vehicle.price.toLocaleString()}</span>
          )}
          {vehicle.mileage && (
            <span className="ml-2 text-slate-500 text-sm">{vehicle.mileage.toLocaleString()} mi</span>
          )}
        </div>
        <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-700 underline">
          ← Edit
        </button>
      </div>

      {/* Market Comps */}
      <CompsPanel
        vehicle={vehicle}
        bodyStyle={bodyStyle}
        onChange={handleCompsChange}
      />

      {/* Section A: Deal */}
      <Section title="A · Deal Analysis" subtitle="Heuristic fallback — comps above override this when ≥ 3 are added">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Original MSRP / sticker price (optional)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">$</span>
            <input
              type="number"
              min={0}
              value={msrpOverride}
              onChange={(e) => setMsrpOverride(e.target.value)}
              placeholder="Leave blank to auto-estimate"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {compStats ? (
            <p className="text-xs text-green-700 font-medium mt-1">
              Comp-based pricing active ({compStats.count} comps) — MSRP field ignored for deal score.
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">
              If you know the original sticker price, enter it here for a more accurate heuristic estimate.
            </p>
          )}
        </div>
      </Section>

      {/* Section B: Risk */}
      <Section title="B · Risk Factors" subtitle="Based on vehicle history">
        <div className="space-y-3">
          <YesNoField
            label="Accident reported in history"
            hint={vehicle.accidentHint !== null && vehicle.accidentHint !== undefined
              ? `Detected from listing: ${vehicle.accidentHint ? 'Yes' : 'No'}`
              : undefined}
            value={hasAccident}
            onChange={setHasAccident}
          />
          <YesNoField
            label="Salvage or rebuilt title"
            value={isSalvage}
            onChange={setIsSalvage}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Number of previous owners
              {vehicle.ownerHint != null && (
                <span className="ml-2 text-xs text-blue-600">(detected: {vehicle.ownerHint})</span>
              )}
            </label>
            <select
              value={ownerCount}
              onChange={(e) => setOwnerCount(parseInt(e.target.value, 10))}
              className="border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} {n === 1 ? 'owner' : 'owners'}</option>
              ))}
            </select>
          </div>
          <YesNoField
            label="Prior rental or fleet use"
            value={isRentalFleet}
            onChange={setIsRentalFleet}
          />
          <YesNoField
            label="Service records available"
            value={hasServiceRecords}
            onChange={setHasServiceRecords}
            invertColor
          />
        </div>
      </Section>

      {/* Section C: Fit */}
      <Section title="C · Fit & Use Case" subtitle="What will you use it for?">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Select all that apply</label>
            <div className="flex flex-wrap gap-2">
              {USE_CASES.map(({ key, label, emoji }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleUseCase(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                    useCases.includes(key)
                      ? 'bg-blue-700 border-blue-700 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400'
                  }`}
                >
                  <span>{emoji}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Drivetrain</label>
              <select
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value as DrivetrainType)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DRIVETRAINS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Body Style</label>
              <select
                value={bodyStyle}
                onChange={(e) => setBodyStyle(e.target.value as BodyStyleType)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {BODY_STYLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Section>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-xl text-base transition"
      >
        Score This Vehicle →
      </button>
    </div>
  );
}

function Section({ title, subtitle, children }: {
  title: string; subtitle: string; children: React.ReactNode;
}) {
  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function YesNoField({ label, value, onChange, hint, invertColor = false }: {
  label: string; value: boolean; onChange: (v: boolean) => void;
  hint?: string; invertColor?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <span className="text-sm font-medium text-slate-700">{label}</span>
        {hint && <p className="text-xs text-blue-600 mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-2 shrink-0">
        <ToggleBtn active={value === true}  onClick={() => onChange(true)}  label="Yes" color={invertColor ? 'green' : 'red'} />
        <ToggleBtn active={value === false} onClick={() => onChange(false)} label="No"  color={invertColor ? 'red' : 'green'} />
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, label, color }: {
  active: boolean; onClick: () => void; label: string; color: 'green' | 'red';
}) {
  const activeClass = color === 'green'
    ? 'bg-green-600 text-white border-green-600'
    : 'bg-red-600 text-white border-red-600';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${
        active ? activeClass : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'
      }`}
    >
      {label}
    </button>
  );
}
