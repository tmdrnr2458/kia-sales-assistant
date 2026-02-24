import type {
  VehicleData,
  EvaluationInputs,
  ScoreBreakdown,
  ScoreResults,
  UseCaseKey,
  BodyStyleType,
  DrivetrainType,
  CompStats,
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
  compStats?: CompStats,
): { breakdown: ScoreBreakdown; estimatedValue?: number; msrpUsed?: number } {
  const details: string[] = [];
  const askingPrice = vehicle.price;

  if (!askingPrice) {
    return {
      breakdown: { score: 50, label: 'Unknown', details: ['No price provided'] },
    };
  }

  // ── Comp-based valuation (primary when ≥ 3 comps) ──────────────────────────
  if (compStats && compStats.count >= 3) {
    const estimatedValue = compStats.adjustedValue;

    details.push(
      `${compStats.count} comps · median $${compStats.median.toLocaleString()} · range $${compStats.p25.toLocaleString()}–$${compStats.p75.toLocaleString()}`,
    );
    const mileageDelta = (vehicle.mileage ?? 0) - compStats.avgMileage;
    const adj = Math.abs(Math.round(mileageDelta * compStats.ratePerMile));
    if (Math.abs(mileageDelta) > 500) {
      details.push(
        `Avg comp mileage ${compStats.avgMileage.toLocaleString()} mi · subject ${(vehicle.mileage ?? 0).toLocaleString()} mi → adj ${mileageDelta > 0 ? '−' : '+'}$${adj.toLocaleString()} @ $${compStats.ratePerMile.toFixed(2)}/mi`,
      );
    }
    details.push(`Comp-adjusted market value: $${estimatedValue.toLocaleString()}`);

    const discountPct = ((estimatedValue - askingPrice) / estimatedValue) * 100;
    const diffStr =
      discountPct >= 0
        ? `$${Math.abs(askingPrice - estimatedValue).toLocaleString()} below comps`
        : `$${Math.abs(askingPrice - estimatedValue).toLocaleString()} above comps`;
    details.push(`Asking $${askingPrice.toLocaleString()} — ${diffStr}`);

    const score = discountScore(discountPct);
    const label = scoreLabel(score);
    return { breakdown: { score, label, details }, estimatedValue };
  }

  // ── Heuristic depreciation model (fallback) ─────────────────────────────────
  const year    = vehicle.year ?? new Date().getFullYear() - 5;
  const mileage = vehicle.mileage ?? 75000;
  const make    = vehicle.make ?? '';
  const model   = vehicle.model ?? '';

  let msrp: number | undefined;
  const msrpEntry = make && model ? lookupMsrp(make, model) : null;
  if (inputs.msrpOverride && inputs.msrpOverride > 0) {
    msrp = inputs.msrpOverride;
    details.push(`MSRP: $${msrp.toLocaleString()} (user-provided)`);
  } else if (msrpEntry) {
    msrp = getMidMsrp(msrpEntry);
    details.push(
      `Est. original MSRP: $${msrp.toLocaleString()} ($${msrpEntry.base.toLocaleString()}–$${msrpEntry.high.toLocaleString()})`,
    );
  } else {
    msrp = Math.round(askingPrice * 1.3);
    details.push(`No MSRP data — rough estimate $${msrp.toLocaleString()}`);
  }

  const estimatedValue = estimateCurrentValue(msrp, year, mileage);
  const age = new Date().getFullYear() - year;
  details.push(
    `${age} yr old · ${mileage.toLocaleString()} mi → heuristic est. $${estimatedValue.toLocaleString()}`,
  );
  details.push('Tip: add 3+ market comps above for a more accurate deal score.');

  const discountPct = ((estimatedValue - askingPrice) / estimatedValue) * 100;
  const diffStr =
    discountPct >= 0
      ? `$${Math.abs(askingPrice - estimatedValue).toLocaleString()} below est.`
      : `$${Math.abs(askingPrice - estimatedValue).toLocaleString()} above est.`;
  details.push(`Asking $${askingPrice.toLocaleString()} — ${diffStr}`);

  const score = discountScore(discountPct);
  const label = scoreLabel(score);
  return { breakdown: { score, label, details }, estimatedValue, msrpUsed: msrp };
}

function discountScore(discountPct: number): number {
  if (discountPct >= 20) return 100;
  if (discountPct >= 10) return 90;
  if (discountPct >= 5)  return 82;
  if (discountPct >= 0)  return 72;
  if (discountPct >= -8) return 60;
  if (discountPct >= -15) return 48;
  if (discountPct >= -25) return 32;
  if (discountPct >= -35) return 18;
  return 8;
}

function scoreLabel(score: number): string {
  if (score >= 80) return 'Great Deal';
  if (score >= 65) return 'Fair Price';
  if (score >= 45) return 'Priced High';
  return 'Overpriced';
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
    details.push(`Accident reported: −${inputs.isSalvage ? 5 : 28} pts`);
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
    score >= 80 ? 'Low Risk' :
    score >= 60 ? 'Moderate Risk' :
    score >= 40 ? 'Higher Risk' : 'High Risk';

  return { score, label, details };
}

// ── Fit Score ────────────────────────────────────────────────────────────────

const USE_CASE_LABELS: Record<UseCaseKey, string> = {
  commute:     'Daily Commute',
  family:      'Family Use',
  offroad:     'Off-Road',
  reliability: 'Long-Term Reliability',
  budget:      'Budget-Friendly',
  mpg:         'Fuel Economy',
};

function scoreFitUseCase(
  useCase: UseCaseKey,
  vehicle: VehicleData,
  inputs: EvaluationInputs,
): number {
  const body   = inputs.bodyStyle;
  const drive  = inputs.drivetrain;
  const mileage = vehicle.mileage ?? 60000;
  const year   = vehicle.year ?? 2018;
  const price  = vehicle.price ?? 25000;
  const age    = new Date().getFullYear() - year;
  const make   = vehicle.make ?? '';

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
      const goodOffroad = ['jeep', 'toyota', 'ford', 'ram', 'chevrolet', 'gmc', 'subaru'];
      if (goodOffroad.some((b) => make.toLowerCase().includes(b))) s += 10;
      return Math.min(100, s);
    }
    case 'reliability': {
      let s = getReliabilityScore(make);
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
      if (body === 'suv')   s += 5;
      if (body === 'van')   s -= 5;
      if (body === 'truck') s -= 15;
      if (drive === 'AWD')  s -= 5;
      if (drive === '4WD')  s -= 10;
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
    avg >= 80 ? 'Great Fit' :
    avg >= 60 ? 'Good Fit' :
    avg >= 40 ? 'Partial Fit' : 'Poor Fit';
  return { score: avg, label, details };
}

// ── Talk Track ────────────────────────────────────────────────────────────────

function buildTalkTrack(
  vehicle: VehicleData,
  scores: { dealScore: number; riskScore: number; fitScore: number },
  verdict: 'BUY' | 'CONSIDER' | 'PASS',
  estimatedValue?: number,
  compStats?: CompStats,
): { short: string; email: string } {
  const price = vehicle.price ? `$${vehicle.price.toLocaleString()}` : 'the asking price';
  const est = estimatedValue ? `$${estimatedValue.toLocaleString()}` : 'market value';
  const compNote = compStats
    ? ` (based on ${compStats.count} comparable listings, median $${compStats.median.toLocaleString()})`
    : '';
  const name =
    [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(' ') || 'this vehicle';

  const short =
    verdict === 'BUY'
      ? `"I've pulled ${compStats ? compStats.count + ' comps' : 'market data'} and ${name} at ${price} is a solid buy — comparable listings are running around ${est}${compNote}. I'd like to move forward before it goes."`
      : verdict === 'CONSIDER'
      ? `"${name} is listed at ${price}. My comp research puts adjusted market value closer to ${est}${compNote}. Can we discuss the price or add value to make this work?"`
      : `"${name} at ${price} is above what I'm finding in the market${compNote} — around ${est}. Without a meaningful adjustment, I'll need to pass."`;

  const email =
    verdict === 'BUY'
      ? `Subject: Ready to Move Forward on ${name}

Hi,

I researched comparable listings${compNote} and ${name} at ${price} is competitively priced — market value comes in around ${est}.

I'm ready to proceed and would like to schedule time this week. Please let me know your availability.

Thank you`
      : verdict === 'CONSIDER'
      ? `Subject: Pricing Question on ${name}

Hi,

I'm very interested in ${name} listed at ${price}. Based on ${compStats ? compStats.count + ' comparable listings' : 'market research'}, I'm seeing adjusted market value closer to ${est}${compNote}.

Could we discuss price flexibility, or include value such as a service contract, accessories, or a pre-purchase inspection?

Thank you`
      : `Subject: Pass on ${name} — Price Concerns

Hi,

Thank you for the listing on ${name} at ${price}. After reviewing ${compStats ? compStats.count + ' comparable listings' : 'market data'}, I'm finding adjusted market value around ${est}${compNote}.

At the current price the value isn't aligned with my budget. Please reach out if the price changes.

Thank you`;

  return { short, email };
}

// ── Master Compute ────────────────────────────────────────────────────────────

export function computeScores(
  vehicle: VehicleData,
  inputs: EvaluationInputs,
  compStats?: CompStats,
): ScoreResults {
  const { breakdown: dealBreakdown, estimatedValue, msrpUsed } =
    computeDealScore(vehicle, inputs, compStats);
  const riskBreakdown = computeRiskScore(vehicle, inputs);
  const fitBreakdown  = computeFitScore(vehicle, inputs);

  const finalScore = Math.round(
    dealBreakdown.score * 0.4 +
    riskBreakdown.score * 0.4 +
    fitBreakdown.score  * 0.2,
  );
  const verdict: 'BUY' | 'CONSIDER' | 'PASS' =
    finalScore >= 68 ? 'BUY' : finalScore >= 42 ? 'CONSIDER' : 'PASS';

  const { short: talkTrackShort, email: talkTrackEmail } = buildTalkTrack(
    vehicle,
    { dealScore: dealBreakdown.score, riskScore: riskBreakdown.score, fitScore: fitBreakdown.score },
    verdict,
    estimatedValue,
    compStats,
  );

  return {
    dealScore: dealBreakdown,
    riskScore: riskBreakdown,
    fitScore: fitBreakdown,
    finalScore,
    verdict,
    estimatedValue,
    msrpUsed,
    compStats,
    talkTrackShort,
    talkTrackEmail,
  };
}
