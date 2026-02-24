import type {
  VehicleData,
  EvaluationInputs,
  ScoreBreakdown,
  ScoreResults,
  UseCaseKey,
  BodyStyleType,
  DrivetrainType,
} from '@/types';
import {
  lookupMsrp,
  estimateCurrentValue,
  getMidMsrp,
  getReliabilityScore,
} from './vehicleData';

// ── Deal Score ──────────────────────────────────────────────────────────────

function computeDealScore(
  vehicle: VehicleData,
  inputs: EvaluationInputs,
): { breakdown: ScoreBreakdown; estimatedValue?: number; msrpUsed?: number } {
  const details: string[] = [];

  const askingPrice = vehicle.price;
  if (!askingPrice) {
    return {
      breakdown: { score: 50, label: 'Unknown', details: ['No price provided'] },
    };
  }

  const year = vehicle.year ?? new Date().getFullYear() - 5;
  const mileage = vehicle.mileage ?? 75000;
  const make = vehicle.make ?? '';
  const model = vehicle.model ?? '';

  // Try to find MSRP
  let msrp: number | undefined;
  const msrpEntry = make && model ? lookupMsrp(make, model) : null;
  if (inputs.msrpOverride && inputs.msrpOverride > 0) {
    msrp = inputs.msrpOverride;
    details.push(`MSRP: $${msrp.toLocaleString()} (user-provided)`);
  } else if (msrpEntry) {
    msrp = getMidMsrp(msrpEntry);
    details.push(
      `Est. original MSRP: $${msrp.toLocaleString()} (${msrpEntry.base.toLocaleString()}–${msrpEntry.high.toLocaleString()})`,
    );
  } else {
    // Fallback: rough generic estimate based on asking price + age
    msrp = Math.round(askingPrice * 1.3);
    details.push(`No MSRP data found — using rough estimate of $${msrp.toLocaleString()}`);
  }

  const estimatedValue = estimateCurrentValue(msrp, year, mileage);
  const age = new Date().getFullYear() - year;
  details.push(
    `Vehicle age: ${age} yr, mileage: ${mileage.toLocaleString()} mi → est. market value $${estimatedValue.toLocaleString()}`,
  );

  // discount% positive = good deal, negative = overpaying
  const discountPct = ((estimatedValue - askingPrice) / estimatedValue) * 100;
  const diffStr =
    discountPct >= 0
      ? `$${Math.abs(askingPrice - estimatedValue).toLocaleString()} below`
      : `$${Math.abs(askingPrice - estimatedValue).toLocaleString()} above`;
  details.push(`Asking $${askingPrice.toLocaleString()} — ${diffStr} market est.`);

  // Score curve
  let score: number;
  if (discountPct >= 20) score = 100;
  else if (discountPct >= 10) score = 90;
  else if (discountPct >= 5) score = 82;
  else if (discountPct >= 0) score = 72;
  else if (discountPct >= -8) score = 60;
  else if (discountPct >= -15) score = 48;
  else if (discountPct >= -25) score = 32;
  else if (discountPct >= -35) score = 18;
  else score = 8;

  const label =
    score >= 80 ? 'Great Deal' : score >= 65 ? 'Fair Price' : score >= 45 ? 'Priced High' : 'Overpriced';

  return { breakdown: { score, label, details }, estimatedValue, msrpUsed: msrp };
}

// ── Risk Score ───────────────────────────────────────────────────────────────

function computeRiskScore(
  vehicle: VehicleData,
  inputs: EvaluationInputs,
): ScoreBreakdown {
  let score = 100;
  const details: string[] = [];

  if (inputs.isSalvage) {
    score -= 45;
    details.push('Salvage/rebuilt title: −45 pts');
  }

  if (inputs.hasAccident) {
    score -= inputs.isSalvage ? 5 : 28;
    details.push(
      `Accident reported: −${inputs.isSalvage ? 5 : 28} pts`,
    );
  } else if (inputs.hasAccident === false) {
    details.push('No accidents reported');
  }

  const extraOwners = Math.max(0, inputs.ownerCount - 1);
  if (extraOwners > 0) {
    const deduction = Math.min(20, extraOwners * 8);
    score -= deduction;
    details.push(`${inputs.ownerCount} owners: −${deduction} pts`);
  } else {
    details.push('1 owner');
  }

  if (inputs.isRentalFleet) {
    score -= 15;
    details.push('Rental/fleet use: −15 pts');
  }

  if (!inputs.hasServiceRecords) {
    score -= 12;
    details.push('No service records: −12 pts');
  } else {
    details.push('Service records available');
  }

  const mileage = vehicle.mileage;
  if (mileage && mileage > 120000) {
    score -= 10;
    details.push(`High mileage (${mileage.toLocaleString()} mi): −10 pts`);
  } else if (mileage && mileage > 80000) {
    score -= 5;
    details.push(`Moderate mileage (${mileage.toLocaleString()} mi): −5 pts`);
  }

  score = Math.max(0, score);

  const label =
    score >= 80 ? 'Low Risk' : score >= 60 ? 'Moderate Risk' : score >= 40 ? 'Higher Risk' : 'High Risk';

  return { score, label, details };
}

// ── Fit Score ────────────────────────────────────────────────────────────────

const USE_CASE_LABELS: Record<UseCaseKey, string> = {
  commute: 'Daily Commute',
  family: 'Family Use',
  offroad: 'Off-Road',
  reliability: 'Long-Term Reliability',
  budget: 'Budget-Friendly',
  mpg: 'Fuel Economy',
};

function scoreFitUseCase(
  useCase: UseCaseKey,
  vehicle: VehicleData,
  inputs: EvaluationInputs,
): number {
  const body = inputs.bodyStyle;
  const drive = inputs.drivetrain;
  const mileage = vehicle.mileage ?? 60000;
  const year = vehicle.year ?? 2018;
  const price = vehicle.price ?? 25000;
  const age = new Date().getFullYear() - year;
  const make = vehicle.make ?? '';

  switch (useCase) {
    case 'commute': {
      let s = 70;
      if (['sedan', 'hatchback', 'wagon'].includes(body)) s += 15;
      if (['FWD', 'AWD'].includes(drive)) s += 5;
      if (mileage < 60000) s += 10;
      if (body === 'truck') s -= 15;
      return Math.min(100, s);
    }
    case 'family': {
      let s = 60;
      if (['suv', 'van'].includes(body)) s += 25;
      if (body === 'truck') s += 5;
      if (['AWD', '4WD'].includes(drive)) s += 10;
      if (mileage < 80000) s += 5;
      if (['sedan', 'coupe'].includes(body)) s -= 10;
      return Math.min(100, s);
    }
    case 'offroad': {
      let s = 20;
      if (['4WD', 'AWD'].includes(drive)) s += 40;
      if (drive === '4WD') s += 10;
      if (['suv', 'truck'].includes(body)) s += 20;
      // Brands known for off-road
      const goodOffroad = ['jeep', 'toyota', 'ford', 'ram', 'chevrolet', 'gmc', 'subaru'];
      const ml = make.toLowerCase();
      if (goodOffroad.some((b) => ml.includes(b))) s += 10;
      return Math.min(100, s);
    }
    case 'reliability': {
      const reliabilityBase = getReliabilityScore(make);
      let s = reliabilityBase;
      if (mileage < 50000) s = Math.min(100, s + 5);
      else if (mileage > 120000) s = Math.max(0, s - 15);
      if (age < 5) s = Math.min(100, s + 5);
      else if (age > 10) s = Math.max(0, s - 10);
      return s;
    }
    case 'budget': {
      if (price <= 10000) return 100;
      if (price <= 15000) return 90;
      if (price <= 20000) return 78;
      if (price <= 28000) return 65;
      if (price <= 38000) return 50;
      if (price <= 50000) return 35;
      return 20;
    }
    case 'mpg': {
      let s = 60;
      if (['sedan', 'hatchback'].includes(body)) s += 25;
      if (body === 'wagon') s += 15;
      if (body === 'suv') s += 5;
      if (body === 'van') s -= 5;
      if (body === 'truck') s -= 15;
      if (drive === 'AWD') s -= 5;
      if (drive === '4WD') s -= 10;
      // Hybrid/EV brands
      const hybridMakes = ['toyota', 'honda', 'hyundai', 'kia', 'ford'];
      if (hybridMakes.some((b) => make.toLowerCase().includes(b))) s += 5;
      return Math.min(100, Math.max(0, s));
    }
    default:
      return 60;
  }
}

function computeFitScore(
  vehicle: VehicleData,
  inputs: EvaluationInputs,
): ScoreBreakdown {
  const details: string[] = [];

  if (!inputs.useCases.length) {
    return { score: 60, label: 'Not Evaluated', details: ['No use cases selected'] };
  }

  const scores = inputs.useCases.map((uc) => {
    const s = scoreFitUseCase(uc, vehicle, inputs);
    details.push(`${USE_CASE_LABELS[uc]}: ${s}`);
    return s;
  });

  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const label =
    avg >= 80 ? 'Great Fit' : avg >= 60 ? 'Good Fit' : avg >= 40 ? 'Partial Fit' : 'Poor Fit';

  return { score: avg, label, details };
}

// ── Talk Track Generator ─────────────────────────────────────────────────────

function buildTalkTrack(
  vehicle: VehicleData,
  scores: { dealScore: number; riskScore: number; fitScore: number },
  verdict: 'BUY' | 'CONSIDER' | 'PASS',
  estimatedValue?: number,
): { short: string; email: string } {
  const price = vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'the asking price';
  const est = estimatedValue
    ? `$${estimatedValue.toLocaleString()}`
    : 'market value';
  const year = vehicle.year ?? '';
  const make = vehicle.make ?? '';
  const model = vehicle.model ?? '';
  const name = [year, make, model].filter(Boolean).join(' ') || 'this vehicle';

  const short =
    verdict === 'BUY'
      ? `"I've been tracking the market and ${name} at ${price} is a solid buy — comps are running around ${est}. I'd like to move forward before it goes."`
      : verdict === 'CONSIDER'
      ? `"${name} is priced at ${price} — my analysis puts market value closer to ${est}. Could we explore ${price === est ? 'the price' : 'a discount or value-adds'} to make this work?"`
      : `"${name} at ${price} is above what I'm seeing in the market (est. ${est}). Without significant adjustments, I'll need to pass — but I'm open to options."`;

  const email =
    verdict === 'BUY'
      ? `Subject: Ready to Move Forward on ${name}

Hi,

After reviewing the listing for ${name} at ${price}, my research shows this is priced competitively — market comps in this area run around ${est}.

I'm ready to proceed and would like to schedule time this week. Please let me know your availability.

Thank you`
      : verdict === 'CONSIDER'
      ? `Subject: Question on ${name} Pricing

Hi,

I'm very interested in ${name} listed at ${price}. Based on comparable sales I'm seeing market value closer to ${est}.

Could we discuss whether there is flexibility on price, or if you could include additional value such as a service contract, accessories, or a pre-purchase inspection? That would help me move forward confidently.

Thank you`
      : `Subject: Pass on ${name} — Price Concerns

Hi,

Thank you for the listing on ${name} at ${price}. After researching comparable sales, I'm finding similar vehicles around ${est}.

At the current price, the value isn't aligned with my budget. If circumstances change and the price adjusts, I'd welcome a follow-up.

Thank you`;

  return { short, email };
}

// ── Master Compute ───────────────────────────────────────────────────────────

export function computeScores(
  vehicle: VehicleData,
  inputs: EvaluationInputs,
): ScoreResults {
  const { breakdown: dealBreakdown, estimatedValue, msrpUsed } = computeDealScore(vehicle, inputs);
  const riskBreakdown = computeRiskScore(vehicle, inputs);
  const fitBreakdown = computeFitScore(vehicle, inputs);

  // Weighted final: 40% deal, 40% risk, 20% fit
  const finalScore = Math.round(
    dealBreakdown.score * 0.4 +
    riskBreakdown.score * 0.4 +
    fitBreakdown.score * 0.2,
  );

  const verdict: 'BUY' | 'CONSIDER' | 'PASS' =
    finalScore >= 68 ? 'BUY' : finalScore >= 42 ? 'CONSIDER' : 'PASS';

  const { short: talkTrackShort, email: talkTrackEmail } = buildTalkTrack(
    vehicle,
    {
      dealScore: dealBreakdown.score,
      riskScore: riskBreakdown.score,
      fitScore: fitBreakdown.score,
    },
    verdict,
    estimatedValue,
  );

  return {
    dealScore: dealBreakdown,
    riskScore: riskBreakdown,
    fitScore: fitBreakdown,
    finalScore,
    verdict,
    estimatedValue,
    msrpUsed,
    talkTrackShort,
    talkTrackEmail,
  };
}
