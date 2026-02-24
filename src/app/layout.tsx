import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Deal Scout — Used Car Price & Risk Evaluator",
  description:
    "Instantly evaluate any used car listing: deal score, risk score, fit score, and a clear BUY / CONSIDER / PASS verdict with negotiation talk tracks.",
  openGraph: {
    title: "Deal Scout",
    description: "Used car evaluator — BUY, CONSIDER, or PASS in seconds.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50">{children}</body>
    </html>
  );
}
