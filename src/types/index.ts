export interface VehicleData {
  title?: string;
  price?: number;
  mileage?: number;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  vin?: string;
  description?: string;
  listingUrl?: string;
  source?: 'extracted' | 'manual';
  accidentHint?: boolean | null;
  ownerHint?: number | null;
}

export type UseCaseKey = 'commute' | 'family' | 'offroad' | 'reliability' | 'budget' | 'mpg';

export type DrivetrainType = 'FWD' | 'RWD' | 'AWD' | '4WD' | 'unknown';
export type BodyStyleType =
  | 'sedan'
  | 'suv'
  | 'truck'
  | 'van'
  | 'coupe'
  | 'hatchback'
  | 'wagon'
  | 'unknown';

export interface EvaluationInputs {
  msrpOverride?: number;
  hasAccident: boolean;
  isSalvage: boolean;
  ownerCount: number;
  isRentalFleet: boolean;
  hasServiceRecords: boolean;
  useCases: UseCaseKey[];
  drivetrain: DrivetrainType;
  bodyStyle: BodyStyleType;
}

// ── Market Comps ─────────────────────────────────────────────────────────────

export interface CompEntry {
  id: string;
  url?: string;
  source?: string;
  price?: number;
  mileage?: number;
  year?: number;
}

export interface CompStats {
  count: number;
  median: number;
  p25: number;
  p75: number;
  avgMileage: number;
  adjustedValue: number;
  ratePerMile: number;
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export interface ScoreBreakdown {
  score: number;
  label: string;
  details: string[];
}

export interface ScoreResults {
  dealScore: ScoreBreakdown;
  riskScore: ScoreBreakdown;
  fitScore: ScoreBreakdown;
  finalScore: number;
  verdict: 'BUY' | 'CONSIDER' | 'PASS';
  estimatedValue?: number;
  msrpUsed?: number;
  compStats?: CompStats;
  talkTrackShort: string;
  talkTrackEmail: string;
}

// ── Payment Calculator ────────────────────────────────────────────────────────

export interface PaymentInputs {
  price: number;
  downPayment: number;
  tradeValue: number;
  tradePayoff: number;
  taxRate: number;
  docFee: number;
  nonDocFee: number;
  interestRate: number;
  termMonths: number;
}

export interface ExtractionResult {
  success: boolean;
  partial?: boolean;
  error?: string;
  message?: string;
  data?: Partial<VehicleData>;
}
