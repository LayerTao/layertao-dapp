"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Key,
  CreditCard,
  Zap,
  BookOpen,
  PlaySquare,
  Diamond,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  // { href: "/", label: "Overview", icon: LayoutDashboard },
  //  { href: "/subnet-pulse", label: "Subnet Pulse", icon: Activity },
  // { href: "/api-keys", label: "API Keys", icon: Key },
 
  // { href: "/billing", label: "Billing", icon: CreditCard },
  // { href: "/usage", label: "Usage", icon: Zap },
  // { href: "/docs", label: "Docs", icon: BookOpen },
  { href: "/", label: "Playground", icon: PlaySquare },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full flex-col border-r border-border bg-background">
      {/* Brand Logo */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-primary shadow-sm">
          <div
            className="h-5 w-5 bg-primary-foreground"
            style={{
              WebkitMaskImage: "url('/tao-logo.svg')",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskImage: "url('/tao-logo.svg')",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
            }}
          />
        </div>
        <div>
          <div className="text-xs font-display tracking-[0.06rem] uppercase text-muted-foreground">
            Developer Portal
          </div>
          <div className="font-semibold tracking-tight text-foreground">
            LayerTao
          </div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade Card */}
      <div className="p-4 mt-auto">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="text-sm font-medium text-muted-foreground">
            Current Plan
          </div>
          <div className="mt-1 text-2xl font-semibold text-foreground">Pro</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Priority routing, usage analytics, and higher rate limits.
          </p>
          <Button variant="outline" className="mt-4 w-full">
            Manage Plan
          </Button>
        </div>
      </div>
    </aside>
  );
}
