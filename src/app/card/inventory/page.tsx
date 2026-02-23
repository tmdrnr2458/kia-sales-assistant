import Link from "next/link";
import { Car, ExternalLink, ArrowLeft } from "lucide-react";

const NEW_URL =
  "https://www.kiaofraleigh.com/new-inventory/index.htm?reset=InventoryListing&make=Kia";
const USED_URL =
  "https://www.kiaofraleigh.com/used-inventory/index.htm?accountId=fredandersonkia&accountId=nissanraleigh&accountId=toyotaraleigh";

export default function InventoryLinksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-5 pt-8 pb-16 space-y-5">

        {/* Back */}
        <Link
          href="/card"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={14} /> Back
        </Link>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-1">Open our live inventory pages.</p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">

          <a
            href={NEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 w-full px-5 py-5 rounded-2xl bg-[#05141F] text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Car size={22} />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-base leading-tight">NEW KIA INVENTORY</p>
              <p className="text-xs opacity-60 mt-0.5">Browse all new KIA models</p>
            </div>
            <ExternalLink size={16} className="opacity-50 shrink-0" />
          </a>

          <a
            href={USED_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 w-full px-5 py-5 rounded-2xl bg-[#BB162B] text-white shadow-sm active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Car size={22} />
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-base leading-tight">PRE-OWNED VEHICLE INVENTORY</p>
              <p className="text-xs opacity-60 mt-0.5">Certified pre-owned &amp; used vehicles</p>
            </div>
            <ExternalLink size={16} className="opacity-50 shrink-0" />
          </a>

        </div>
      </div>
    </div>
  );
}
