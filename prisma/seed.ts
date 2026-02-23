import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const leads = [
    { firstName: "Maria", lastName: "Santos", phone: "(919) 555-0101", email: "maria.santos@email.com", preferredContact: "text", vehicleType: "SUV", budgetOTD: 42000, budgetMonthly: 550, downPayment: 3000, creditComfort: "Good (700-749)", term: 72, hasTradeIn: true, tradeYear: 2019, tradeMake: "Honda", tradeModel: "CR-V", tradeMileage: 62000, mustHaveFeatures: "AWD, Sunroof, Apple CarPlay", timeframe: "ASAP – this week", status: "qualified", hotScore: 9, hotScoreReason: "ASAP buyer with strong budget and trade-in ready", source: "website" },
    { firstName: "David", lastName: "Kim", phone: "(919) 555-0202", email: "dkim@email.com", preferredContact: "phone", vehicleType: "EV", budgetOTD: 55000, budgetMonthly: 700, downPayment: 10000, creditComfort: "Excellent (750+)", term: 60, hasTradeIn: false, mustHaveFeatures: "Fast charging, 300+ mile range, Heated seats", timeframe: "Within 1 month", status: "test_drive", hotScore: 8, hotScoreReason: "Strong budget, excellent credit, EV specific", source: "referral" },
    { firstName: "Jennifer", lastName: "Wallace", phone: "(984) 555-0303", preferredContact: "phone", vehicleType: "Sedan", budgetOTD: 28000, budgetMonthly: 380, downPayment: 2000, creditComfort: "Fair (650-699)", term: 72, hasTradeIn: true, tradeYear: 2017, tradeMake: "Ford", tradeModel: "Fusion", tradeMileage: 88000, mustHaveFeatures: "Good gas mileage, Backup camera", timeframe: "1-3 months", status: "new", hotScore: 5, hotScoreReason: "Mid-term buyer, fair credit adds uncertainty", source: "walk-in" },
  ];

  for (const lead of leads) {
    await prisma.lead.upsert({
      where: { id: `seed_${lead.firstName.toLowerCase()}` },
      update: {},
      create: { id: `seed_${lead.firstName.toLowerCase()}`, ...lead },
    });
  }

  const vehicles = [
    { stockNumber: "KN24001", type: "new", year: 2024, make: "KIA", model: "Sportage", trim: "EX AWD", exteriorColor: "Glacier White Pearl", price: 35990, mileage: 0, url: "https://www.kiaofraleigh.com/new-inventory/", photos: JSON.stringify(["https://via.placeholder.com/400x250/05141F/FFFFFF?text=2024+KIA+Sportage"]), features: JSON.stringify(["AWD", "Apple CarPlay", "Sunroof", "Heated seats", "Blind spot monitor"]) },
    { stockNumber: "KN24002", type: "new", year: 2024, make: "KIA", model: "EV6", trim: "Wind AWD", exteriorColor: "Moonscape", price: 52900, mileage: 0, url: "https://www.kiaofraleigh.com/new-inventory/", photos: JSON.stringify(["https://via.placeholder.com/400x250/BB162B/FFFFFF?text=2024+KIA+EV6"]), features: JSON.stringify(["800V ultra-fast charging", "AWD", "310 mile range", "Head-up display", "Panoramic roof"]) },
    { stockNumber: "KN24003", type: "new", year: 2024, make: "KIA", model: "Forte", trim: "LXS", exteriorColor: "Snow White Pearl", price: 21990, mileage: 0, photos: JSON.stringify(["https://via.placeholder.com/400x250/444/FFFFFF?text=2024+KIA+Forte"]), features: JSON.stringify(["Apple CarPlay", "Android Auto", "Backup camera", "Lane keep assist"]) },
    { stockNumber: "PO24101", type: "pre-owned", year: 2022, make: "KIA", model: "Sorento", trim: "EX Hybrid AWD", exteriorColor: "Gravity Gray", price: 38500, mileage: 24800, photos: JSON.stringify(["https://via.placeholder.com/400x250/333/FFFFFF?text=2022+KIA+Sorento"]), features: JSON.stringify(["AWD", "Hybrid", "3rd row", "Panoramic sunroof", "Navigation"]) },
  ];

  for (const vehicle of vehicles) {
    await prisma.vehicle.upsert({
      where: { stockNumber: vehicle.stockNumber },
      update: {},
      create: vehicle,
    });
  }

  console.log("Seed complete! 3 leads + 4 vehicles added.");
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
