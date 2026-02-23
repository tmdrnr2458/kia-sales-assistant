import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientNavWrapper from "@/components/ClientNavWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "KIA Sales Assistant",
  description: "Your smart assistant for selling KIA vehicles faster",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <ClientNavWrapper>{children}</ClientNavWrapper>
      </body>
    </html>
  );
}
