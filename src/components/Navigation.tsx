"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Car, Calendar, Share2, CreditCard,
  MessageSquare, ChevronRight,
} from "lucide-react";
import { clsx } from "clsx";

const nav = [
  { href: "/",                   icon: LayoutDashboard, label: "Dashboard" },
  { href: "/leads",              icon: Users,           label: "Leads" },
  { href: "/inventory",          icon: Car,             label: "Inventory" },
  { href: "/appointments",       icon: Calendar,        label: "Appointments" },
  { href: "/post-kit",           icon: Share2,          label: "Post Kit" },
  { href: "/business-card",      icon: CreditCard,      label: "Business Card" },
  { href: "/message-templates",  icon: MessageSquare,   label: "Templates" },
];

export default function Navigation() {
  const path = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-kia-navy text-white flex flex-col z-40">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-kia-red rounded-md flex items-center justify-center font-bold text-sm">K</div>
          <div>
            <p className="font-semibold text-sm leading-tight">KIA Sales</p>
            <p className="text-xs text-white/50 leading-tight">Assistant</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-white/40">{process.env.NEXT_PUBLIC_APP_URL ?? "localhost:3000"}</p>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, icon: Icon, label }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-kia-red text-white shadow"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Salesperson info */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/60">Signed in as</p>
        <p className="text-sm font-medium text-white truncate">
          {process.env.NEXT_PUBLIC_SALES_NAME ?? process.env.NEXT_PUBLIC_SALESPERSON_NAME ?? "Salesperson"}
        </p>
        <p className="text-xs text-white/40">{process.env.NEXT_PUBLIC_STORE_ADDRESS?.split(",")[0] ?? "KIA of Raleigh"}</p>
      </div>
    </aside>
  );
}
