export interface MsrpEntry {
  base: number;
  high: number;
}

// Approximate MSRP ranges (new vehicle base MSRP in current dollars)
const MSRP_TABLE: Record<string, Record<string, MsrpEntry>> = {
  toyota: {
    '4runner': { base: 40000, high: 57000 },
    camry: { base: 27000, high: 38000 },
    rav4: { base: 29000, high: 43000 },
    'rav4 hybrid': { base: 33000, high: 45000 },
    tacoma: { base: 32000, high: 56000 },
    tundra: { base: 40000, high: 72000 },
    highlander: { base: 38000, high: 56000 },
    corolla: { base: 22000, high: 30000 },
    prius: { base: 29000, high: 40000 },
    sienna: { base: 38000, high: 55000 },
    sequoia: { base: 58000, high: 80000 },
    venza: { base: 33000, high: 42000 },
    'land cruiser': { base: 56000, high: 90000 },
  },
  honda: {
    'cr-v': { base: 30000, high: 43000 },
    'cr-v hybrid': { base: 34000, high: 46000 },
    pilot: { base: 40000, high: 56000 },
    accord: { base: 28000, high: 41000 },
    civic: { base: 24000, high: 34000 },
    odyssey: { base: 38000, high: 52000 },
    ridgeline: { base: 38000, high: 52000 },
    passport: { base: 37000, high: 47000 },
    hrv: { base: 24000, high: 31000 },
  },
  kia: {
    telluride: { base: 38000, high: 56000 },
    sorento: { base: 32000, high: 52000 },
    'sorento hybrid': { base: 36000, high: 55000 },
    sportage: { base: 27000, high: 42000 },
    'sportage hybrid': { base: 30000, high: 45000 },
    soul: { base: 21000, high: 29000 },
    forte: { base: 20000, high: 28000 },
    k5: { base: 26000, high: 37000 },
    stinger: { base: 40000, high: 56000 },
    carnival: { base: 34000, high: 52000 },
    niro: { base: 26000, high: 38000 },
    ev6: { base: 42000, high: 56000 },
  },
  hyundai: {
    tucson: { base: 28000, high: 42000 },
    'tucson hybrid': { base: 31000, high: 45000 },
    santa_fe: { base: 33000, high: 50000 },
    sonata: { base: 26000, high: 38000 },
    elantra: { base: 22000, high: 32000 },
    palisade: { base: 38000, high: 55000 },
    kona: { base: 23000, high: 34000 },
    ioniq5: { base: 42000, high: 58000 },
  },
  ford: {
    f150: { base: 34000, high: 80000 },
    'f-150': { base: 34000, high: 80000 },
    explorer: { base: 38000, high: 60000 },
    escape: { base: 29000, high: 42000 },
    bronco: { base: 36000, high: 70000 },
    'bronco sport': { base: 30000, high: 42000 },
    maverick: { base: 23000, high: 36000 },
    edge: { base: 36000, high: 47000 },
    expedition: { base: 55000, high: 90000 },
    ranger: { base: 33000, high: 48000 },
    mustang: { base: 30000, high: 60000 },
  },
  chevrolet: {
    equinox: { base: 28000, high: 40000 },
    traverse: { base: 36000, high: 55000 },
    silverado: { base: 36000, high: 75000 },
    tahoe: { base: 54000, high: 80000 },
    suburban: { base: 57000, high: 85000 },
    colorado: { base: 30000, high: 50000 },
    trailblazer: { base: 23000, high: 34000 },
    trax: { base: 21000, high: 29000 },
    malibu: { base: 24000, high: 32000 },
    blazer: { base: 35000, high: 50000 },
  },
  gmc: {
    sierra: { base: 36000, high: 75000 },
    terrain: { base: 30000, high: 43000 },
    acadia: { base: 38000, high: 55000 },
    yukon: { base: 55000, high: 85000 },
    canyon: { base: 30000, high: 50000 },
  },
  ram: {
    '1500': { base: 37000, high: 78000 },
    'ram 1500': { base: 37000, high: 78000 },
    '2500': { base: 44000, high: 85000 },
    promaster: { base: 35000, high: 50000 },
  },
  jeep: {
    wrangler: { base: 32000, high: 62000 },
    'grand cherokee': { base: 40000, high: 72000 },
    gladiator: { base: 38000, high: 65000 },
    compass: { base: 27000, high: 38000 },
    renegade: { base: 24000, high: 34000 },
    cherokee: { base: 29000, high: 41000 },
  },
  nissan: {
    rogue: { base: 29000, high: 42000 },
    pathfinder: { base: 36000, high: 52000 },
    murano: { base: 34000, high: 46000 },
    frontier: { base: 30000, high: 44000 },
    titan: { base: 38000, high: 64000 },
    altima: { base: 25000, high: 35000 },
    sentra: { base: 20000, high: 28000 },
    armada: { base: 52000, high: 70000 },
  },
  subaru: {
    outback: { base: 30000, high: 43000 },
    forester: { base: 29000, high: 41000 },
    crosstrek: { base: 24000, high: 34000 },
    ascent: { base: 36000, high: 52000 },
    legacy: { base: 25000, high: 36000 },
    impreza: { base: 23000, high: 32000 },
    wrx: { base: 32000, high: 42000 },
  },
  mazda: {
    'cx-5': { base: 29000, high: 40000 },
    'cx-50': { base: 31000, high: 44000 },
    'cx-9': { base: 38000, high: 50000 },
    mazda3: { base: 24000, high: 35000 },
    mazda6: { base: 27000, high: 37000 },
    'cx-30': { base: 24000, high: 35000 },
  },
  volkswagen: {
    tiguan: { base: 30000, high: 43000 },
    atlas: { base: 36000, high: 55000 },
    jetta: { base: 23000, high: 34000 },
    passat: { base: 26000, high: 36000 },
    'id.4': { base: 40000, high: 55000 },
  },
  bmw: {
    '3 series': { base: 43000, high: 62000 },
    '5 series': { base: 56000, high: 80000 },
    x3: { base: 46000, high: 63000 },
    x5: { base: 64000, high: 90000 },
    x1: { base: 38000, high: 52000 },
    '4 series': { base: 46000, high: 70000 },
  },
  mercedes: {
    'c-class': { base: 46000, high: 66000 },
    'e-class': { base: 58000, high: 82000 },
    glc: { base: 48000, high: 68000 },
    gle: { base: 60000, high: 90000 },
    gla: { base: 38000, high: 52000 },
  },
  lexus: {
    rx: { base: 48000, high: 68000 },
    nx: { base: 40000, high: 58000 },
    es: { base: 42000, high: 58000 },
    gx: { base: 58000, high: 75000 },
    is: { base: 40000, high: 54000 },
    lx: { base: 88000, high: 115000 },
  },
  acura: {
    mdx: { base: 48000, high: 68000 },
    rdx: { base: 40000, high: 54000 },
    tlx: { base: 38000, high: 55000 },
  },
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function lookupMsrp(
  make: string,
  model: string,
): MsrpEntry | null {
  const m = normalize(make);
  const mo = normalize(model);

  // Try exact make match first
  const makeEntry = MSRP_TABLE[m];
  if (!makeEntry) {
    // Try partial match
    for (const key of Object.keys(MSRP_TABLE)) {
      if (m.includes(key) || key.includes(m)) {
        return findModel(MSRP_TABLE[key], mo);
      }
    }
    return null;
  }
  return findModel(makeEntry, mo);
}

function findModel(
  makeEntry: Record<string, MsrpEntry>,
  model: string,
): MsrpEntry | null {
  // Exact
  if (makeEntry[model]) return makeEntry[model];
  // Partial
  for (const key of Object.keys(makeEntry)) {
    if (model.includes(key) || key.includes(model)) {
      return makeEntry[key];
    }
  }
  return null;
}

const CURRENT_YEAR = new Date().getFullYear();

export function estimateCurrentValue(
  msrp: number,
  year: number,
  mileage: number,
): number {
  const age = Math.max(0, CURRENT_YEAR - year);

  // Depreciation schedule
  let retained = 1.0;
  for (let i = 0; i < age; i++) {
    if (i === 0) retained *= 0.82; // year 1: ~18% drop off lot
    else if (i === 1) retained *= 0.87;
    else if (i <= 3) retained *= 0.9;
    else if (i <= 6) retained *= 0.92;
    else if (i <= 10) retained *= 0.94;
    else retained *= 0.97;
  }

  const baseValue = msrp * retained;

  // Mileage adjustment: standard = 12k/year
  const expectedMileage = age * 12000;
  const mileageDelta = mileage - expectedMileage;
  // $0.06 per mile delta
  const mileageAdj = mileageDelta * 0.06;

  return Math.max(2500, Math.round(baseValue - mileageAdj));
}

export function getMidMsrp(entry: MsrpEntry): number {
  return Math.round((entry.base + entry.high) / 2);
}

// Known reliable brands that hold value / score well for reliability use case
export const RELIABILITY_TIER: Record<string, number> = {
  toyota: 95,
  lexus: 93,
  honda: 92,
  acura: 88,
  mazda: 90,
  subaru: 82,
  hyundai: 78,
  kia: 77,
  volkswagen: 72,
  nissan: 74,
  ford: 70,
  chevrolet: 68,
  gmc: 68,
  ram: 66,
  jeep: 60,
  dodge: 58,
  bmw: 65,
  mercedes: 64,
  audi: 63,
  cadillac: 62,
  buick: 70,
  lincoln: 65,
  volvo: 67,
  infiniti: 72,
  mitsubishi: 72,
};

export function getReliabilityScore(make: string): number {
  const m = normalize(make);
  if (RELIABILITY_TIER[m] !== undefined) return RELIABILITY_TIER[m];
  // Try partial match
  for (const [key, val] of Object.entries(RELIABILITY_TIER)) {
    if (m.includes(key) || key.includes(m)) return val;
  }
  return 65; // default unknown
}
