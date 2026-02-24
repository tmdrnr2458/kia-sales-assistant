'use client';

import { useState } from 'react';
import { Car, BarChart3, FileText, ChevronRight } from 'lucide-react';
import type { VehicleData, EvaluationInputs, ScoreResults } from '@/types';
import { computeScores } from '@/lib/scoring';
import UrlStep from '@/components/UrlStep';
import EvalStep from '@/components/EvalStep';
import ReportCard from '@/components/ReportCard';

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Listing', icon: Car },
  { id: 2, label: 'Evaluate', icon: BarChart3 },
  { id: 3, label: 'Report', icon: FileText },
] as const;

export default function HomePage() {
  const [step, setStep] = useState<Step>(1);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [scores, setScores] = useState<ScoreResults | null>(null);

  function handleVehicleReady(data: VehicleData) {
    setVehicle(data);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleScore(inputs: EvaluationInputs) {
    if (!vehicle) return;
    const result = computeScores(vehicle, inputs);
    setScores(result);
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleReset() {
    setStep(1);
    setVehicle(null);
    setScores(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-700 text-white rounded-lg p-1.5">
              <Car size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base leading-tight block">Deal Scout</span>
              <span className="text-xs text-slate-400 leading-tight block">Used Car Evaluator</span>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition ${
                      active
                        ? 'bg-blue-700 text-white'
                        : done
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon size={12} />
                    <span className="hidden sm:inline">{s.label}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ChevronRight size={12} className="text-slate-300" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {step === 1 && (
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Evaluate a Used Car Listing
              </h1>
              <p className="text-slate-500 mt-1">
                Get a deal score, risk score, and clear verdict in under 2 minutes.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <UrlStep onVehicleReady={handleVehicleReady} />
            </div>
          </section>
        )}

        {step === 2 && vehicle && (
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Evaluate This Vehicle</h1>
              <p className="text-slate-500 mt-1">
                Answer a few questions to score the deal, risk, and fit.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <EvalStep
                vehicle={vehicle}
                onScore={handleScore}
                onBack={() => setStep(1)}
              />
            </div>
          </section>
        )}

        {step === 3 && vehicle && scores && (
          <section>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Your Report Card</h1>
              <p className="text-slate-500 mt-1">
                Review the scores, verify checklist, and use the talk track to negotiate.
              </p>
            </div>
            <ReportCard vehicle={vehicle} scores={scores} onReset={handleReset} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-6">
        <div className="max-w-2xl mx-auto px-4 text-center text-xs text-slate-400 space-y-1">
          <p>
            Deal Scout uses publicly available market data and heuristic models.
            Scores are estimates — always do a pre-purchase inspection.
          </p>
          <p>No data stored. All analysis runs in your browser.</p>
        </div>
      </footer>
    </div>
  );
}
