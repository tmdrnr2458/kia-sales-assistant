'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PaymentInputs } from '@/types';

const NC_DEFAULTS: PaymentInputs = {
  price: 0,
  downPayment: 2000,
  tradeValue: 0,
  tradePayoff: 0,
  taxRate: 3,
  docFee: 799,
  nonDocFee: 160,
  interestRate: 7.9,
  termMonths: 72,
};

const STORAGE_KEY = 'dealscout_calc_prefs';

function computePayment(inputs: PaymentInputs): {
  financed: number;
  monthly: number;
  totalInterest: number;
  totalCost: number;
} {
  const taxable = inputs.price + inputs.docFee;
  const tax = taxable * (inputs.taxRate / 100);
  const totalCash = inputs.price + tax + inputs.docFee + inputs.nonDocFee;
  const net = totalCash - inputs.downPayment - (inputs.tradeValue - inputs.tradePayoff);
  const financed = Math.max(0, net);

  if (financed === 0 || inputs.interestRate === 0) {
    return {
      financed,
      monthly: financed / (inputs.termMonths || 1),
      totalInterest: 0,
      totalCost: totalCash,
    };
  }

  const r = inputs.interestRate / 100 / 12;
  const n = inputs.termMonths;
  const monthly = (financed * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  const totalInterest = monthly * n - financed;

  return {
    financed: Math.round(financed),
    monthly: Math.round(monthly * 100) / 100,
    totalInterest: Math.round(totalInterest),
    totalCost: Math.round(totalCash),
  };
}

interface Props {
  defaultPrice?: number;
}

export default function PaymentCalc({ defaultPrice = 0 }: Props) {
  const [inputs, setInputs] = useState<PaymentInputs>({ ...NC_DEFAULTS, price: defaultPrice });
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Load saved prefs on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const prefs = JSON.parse(saved) as Partial<PaymentInputs>;
        setInputs((prev) => ({
          ...prev,
          taxRate: prefs.taxRate ?? prev.taxRate,
          docFee: prefs.docFee ?? prev.docFee,
          nonDocFee: prefs.nonDocFee ?? prev.nonDocFee,
          interestRate: prefs.interestRate ?? prev.interestRate,
          termMonths: prefs.termMonths ?? prev.termMonths,
          downPayment: prefs.downPayment ?? prev.downPayment,
          price: defaultPrice > 0 ? defaultPrice : (prefs.price ?? prev.price),
        }));
      } else {
        setInputs((prev) => ({ ...prev, price: defaultPrice > 0 ? defaultPrice : prev.price }));
      }
    } catch {
      // ignore
    }
    setPrefsLoaded(true);
  }, [defaultPrice]);

  const savePrefs = useCallback(() => {
    try {
      const toSave: Partial<PaymentInputs> = {
        taxRate: inputs.taxRate,
        docFee: inputs.docFee,
        nonDocFee: inputs.nonDocFee,
        interestRate: inputs.interestRate,
        termMonths: inputs.termMonths,
        downPayment: inputs.downPayment,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch {
      // ignore
    }
  }, [inputs]);

  const set = (field: keyof PaymentInputs, value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const { financed, monthly, totalInterest, totalCost } = computePayment(inputs);

  if (!prefsLoaded) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-bold text-lg text-slate-800 mb-4">Payment Calculator</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <Field
          label="Vehicle Price ($)"
          value={inputs.price}
          onChange={(v) => set('price', v)}
        />
        <Field
          label="Down Payment ($)"
          value={inputs.downPayment}
          onChange={(v) => set('downPayment', v)}
        />
        <Field
          label="Trade-In Value ($)"
          value={inputs.tradeValue}
          onChange={(v) => set('tradeValue', v)}
        />
        <Field
          label="Trade-In Payoff ($)"
          value={inputs.tradePayoff}
          onChange={(v) => set('tradePayoff', v)}
        />
        <Field
          label="Tax Rate (%)"
          value={inputs.taxRate}
          step={0.1}
          onChange={(v) => set('taxRate', v)}
        />
        <Field
          label="Doc Fee ($)"
          value={inputs.docFee}
          onChange={(v) => set('docFee', v)}
        />
        <Field
          label="Non-Doc Gov Fee ($)"
          value={inputs.nonDocFee}
          onChange={(v) => set('nonDocFee', v)}
        />
        <Field
          label="Interest Rate (%)"
          value={inputs.interestRate}
          step={0.1}
          onChange={(v) => set('interestRate', v)}
        />
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-600 mb-1">
            Term
          </label>
          <select
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800"
            value={inputs.termMonths}
            onChange={(e) => set('termMonths', parseInt(e.target.value, 10))}
          >
            {[24, 36, 48, 60, 72, 84].map((t) => (
              <option key={t} value={t}>
                {t} months ({t / 12} yrs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100">
        <ResultRow label="Amount Financed" value={`$${financed.toLocaleString()}`} big />
        <ResultRow label="Est. Monthly Payment" value={`$${monthly.toFixed(2)}/mo`} big accent />
        <ResultRow label="Total Interest" value={`$${totalInterest.toLocaleString()}`} />
        <ResultRow label="Total Out-of-Pocket" value={`$${totalCost.toLocaleString()}`} />
      </div>

      <p className="text-xs text-slate-400 mt-3">
        NC defaults: 3% tax, $799 doc fee, $160 non-doc. These are estimates — actual amounts vary by lender and dealer.
      </p>

      <button
        onClick={savePrefs}
        className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Save rates & fees as my defaults
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  big,
  accent,
}: {
  label: string;
  value: string;
  big?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`font-semibold ${big ? 'text-base' : 'text-sm'} ${
          accent ? 'text-blue-700 text-xl' : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
