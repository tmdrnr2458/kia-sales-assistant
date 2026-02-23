"use client";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Copy, CheckCircle } from "lucide-react";

const INFO = {
  name: process.env.NEXT_PUBLIC_SALESPERSON_NAME ?? "Your Name",
  title: "KIA Product Specialist",
  phone: process.env.NEXT_PUBLIC_SALESPERSON_PHONE ?? "(919) 000-0000",
  email: process.env.NEXT_PUBLIC_SALESPERSON_EMAIL ?? "sales@kiaofraleigh.com",
  dealership: "KIA of Raleigh",
  address: "3901 Capital Blvd, Raleigh, NC 27604",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const INVENTORY_URL = process.env.NEXT_PUBLIC_INVENTORY_URL ?? "https://www.kiaofraleigh.com/new-inventory/";

export default function BusinessCardPage() {
  const [qrInventory, setQrInventory] = useState("");
  const [qrScheduler, setQrScheduler] = useState("");
  const [qrVcard, setQrVcard] = useState("");
  const [copied, setCopied] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(INVENTORY_URL, { width: 120, margin: 1, color: { dark: "#05141F" } }).then(setQrInventory);
    QRCode.toDataURL(`${APP_URL}/appointments`, { width: 120, margin: 1, color: { dark: "#BB162B" } }).then(setQrScheduler);
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${INFO.name}\nTITLE:${INFO.title}\nORG:${INFO.dealership}\nTEL:${INFO.phone}\nEMAIL:${INFO.email}\nADR:;;${INFO.address}\nEND:VCARD`;
    QRCode.toDataURL(`data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`, { width: 120, margin: 1, color: { dark: "#888" } }).then(setQrVcard);
  }, []);

  function copyShare() {
    navigator.clipboard.writeText(`${APP_URL}/appointments`);
    setCopied("link"); setTimeout(() => setCopied(""), 2000);
  }

  async function printCard() {
    window.print();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Business Card</h1>
        <div className="flex gap-2">
          <button onClick={copyShare}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
            {copied ? <><CheckCircle size={14} className="text-green-500" /> Copied!</> : <><Copy size={14} /> Copy Scheduler Link</>}
          </button>
          <button onClick={printCard}
            className="flex items-center gap-2 px-4 py-2 bg-kia-navy text-white rounded-lg text-sm font-medium hover:bg-kia-navy-light transition">
            <Download size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Card preview */}
      <div ref={cardRef} className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 print:shadow-none">
        {/* Front of card */}
        <div className="relative bg-kia-navy text-white p-8 min-h-[220px] flex flex-col justify-between">
          {/* KIA stripe */}
          <div className="absolute top-0 right-0 w-2 h-full bg-kia-red" />

          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-1">KIA of Raleigh</p>
            <h2 className="text-3xl font-bold tracking-tight">{INFO.name}</h2>
            <p className="text-kia-red font-medium mt-1">{INFO.title}</p>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-white/50 text-xs">Phone</p>
              <p className="font-medium">{INFO.phone}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Email</p>
              <p className="font-medium">{INFO.email}</p>
            </div>
            <div>
              <p className="text-white/50 text-xs">Address</p>
              <p className="font-medium text-xs">{INFO.address}</p>
            </div>
          </div>
        </div>

        {/* Back of card (QR codes) */}
        <div className="p-6 bg-gray-50">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 text-center">Scan to connect</p>
          <div className="flex justify-center gap-8">
            {[
              { label: "Browse Inventory", qr: qrInventory, color: "text-kia-navy" },
              { label: "Schedule Appointment", qr: qrScheduler, color: "text-kia-red" },
              { label: "Save Contact", qr: qrVcard, color: "text-gray-500" },
            ].map(({ label, qr, color }) => (
              <div key={label} className="text-center">
                {qr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qr} alt={label} className="w-24 h-24 mx-auto rounded-lg border border-gray-200" />
                ) : (
                  <div className="w-24 h-24 mx-auto rounded-lg bg-gray-200 animate-pulse" />
                )}
                <p className={`text-xs font-medium mt-2 ${color}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Setup instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Fill in your info in the <code className="bg-blue-100 px-1 rounded">.env</code> file: <code>NEXT_PUBLIC_SALESPERSON_NAME</code>, <code>NEXT_PUBLIC_SALESPERSON_PHONE</code>, <code>NEXT_PUBLIC_SALESPERSON_EMAIL</code></li>
          <li>The <strong>Inventory QR</strong> links to <code>kiaofraleigh.com</code> inventory</li>
          <li>The <strong>Schedule QR</strong> links to your app's appointment scheduler — share this with customers</li>
          <li>The <strong>Save Contact QR</strong> lets customers scan to save your vCard</li>
          <li>Click <strong>Print / Save PDF</strong> to print or export as PDF from your browser</li>
        </ol>
      </div>

      {/* Mobile share page link */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-2">Share Your Scheduling Link</h3>
        <p className="text-sm text-gray-500 mb-3">Send this link to customers so they can see available slots:</p>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
          <code className="text-sm text-gray-700 flex-1 truncate">{APP_URL}/appointments</code>
          <button onClick={copyShare} className="text-xs text-kia-red hover:underline shrink-0">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
