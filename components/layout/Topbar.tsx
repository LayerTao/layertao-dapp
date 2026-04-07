"use client";

import { Search, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ConnectWallet } from "./ConnectWallet";

export function Topbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 border-b border-border px-6 py-4 backdrop-blur md:flex-row md:items-center md:justify-between bg-background">
      <div>
        <h1 className="text-xl font-medium tracking-[-0.03rem] text-foreground">
          Developer Console
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage API keys, billing, usage, and inference routes.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
            placeholder="Search endpoints, keys, invoices..."
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-5 w-5 dark:hidden" />
            <Moon className="hidden h-5 w-5 dark:block" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Button variant="outline" asChild>
            <Link href="/docs">Docs</Link>
          </Button>
          <Button asChild>
            <Link href="/api-keys">Create API Key</Link>
          </Button>
          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
