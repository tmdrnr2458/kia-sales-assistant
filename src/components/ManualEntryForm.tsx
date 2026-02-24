'use client';

import { useState } from 'react';
import type { VehicleData, BodyStyleType, DrivetrainType } from '@/types';

interface Props {
  initial?: Partial<VehicleData>;
  onSubmit: (data: VehicleData) => void;
}

export default function ManualEntryForm({ initial = {}, onSubmit }: Props) {
  const [year, setYear] = useState(String(initial.year ?? ''));
  const [make, setMake] = useState(initial.make ?? '');
  const [model, setModel] = useState(initial.model ?? '');
  const [trim, setTrim] = useState(initial.trim ?? '');
  const [price, setPrice] = useState(String(initial.price ?? ''));
  const [mileage, setMileage] = useState(String(initial.mileage ?? ''));
  const [vin, setVin] = useState(initial.vin ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const errs: Record<string, string> = {};
    const y = parseInt(year, 10);
    if (!year || isNaN(y) || y < 1985 || y > new Date().getFullYear() + 1) {
      errs.year = 'Enter a valid year (1985–present)';
    }
    if (!make.trim()) errs.make = 'Make is required';
    if (!model.trim()) errs.model = 'Model is required';
    const p = parseFloat(price);
    if (!price || isNaN(p) || p < 500) errs.price = 'Enter a valid price';
    const mi = parseInt(mileage, 10);
    if (!mileage || isNaN(mi) || mi < 0) errs.mileage = 'Enter valid mileage';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      year: parseInt(year, 10),
      make: make.trim(),
      model: model.trim(),
      trim: trim.trim() || undefined,
      price: parseFloat(price),
      mileage: parseInt(mileage, 10),
      vin: vin.trim() || undefined,
      source: 'manual',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <FormField
          label="Year *"
          value={year}
          onChange={setYear}
          placeholder="2019"
          error={errors.year}
          type="number"
        />
        <FormField
          label="Make *"
          value={make}
          onChange={setMake}
          placeholder="Toyota"
          error={errors.make}
        />
        <FormField
          label="Model *"
          value={model}
          onChange={setModel}
          placeholder="RAV4"
          error={errors.model}
          className="col-span-2 sm:col-span-1"
        />
        <FormField
          label="Trim"
          value={trim}
          onChange={setTrim}
          placeholder="XLE Premium"
        />
        <FormField
          label="Price ($) *"
          value={price}
          onChange={setPrice}
          placeholder="28500"
          error={errors.price}
          type="number"
        />
        <FormField
          label="Mileage *"
          value={mileage}
          onChange={setMileage}
          placeholder="54000"
          error={errors.mileage}
          type="number"
        />
        <FormField
          label="VIN (optional)"
          value={vin}
          onChange={setVin}
          placeholder="1HGBH41JXMN109186"
          className="col-span-2 sm:col-span-3"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-xl transition"
      >
        Continue to Evaluation →
      </button>
    </form>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
