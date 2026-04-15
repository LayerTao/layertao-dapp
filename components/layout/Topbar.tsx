"use client";

import { Search, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { ConnectWallet } from "./ConnectWallet";
import { Sidebar } from "./Sidebar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Topbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:h-20 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 border-none w-[260px]">
             <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
             <SheetDescription className="sr-only">
               Access the developer portal navigation links
             </SheetDescription>
             <Sidebar />
           </SheetContent>
        </Sheet>

        {/* Brand/Title Section */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-primary shadow-sm md:hidden">
            <div
              className="h-4 w-4 bg-primary-foreground"
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
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold tracking-tight text-foreground hidden md:flex md:text-xl">
              Developer Console
            </h1>
            <p className="hidden text-xs text-muted-foreground md:block">
              Manage API keys, billing, and inference routes.
            </p>
          </div>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Search - Collapsed on Mobile, visible on MD */}
        <div className="relative hidden w-64 lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-9 bg-muted/30 border-transparent focus-visible:bg-background transition-all"
            placeholder="Search console..."
          />
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Action Buttons - Hidden on Mobile */}
          <div className="hidden items-center gap-2 sm:flex">
            <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
              <Link href="/docs">Docs</Link>
            </Button>
            <Button size="sm" asChild className="hidden lg:flex">
              <Link href="/api-keys">Create API Key</Link>
            </Button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          <ConnectWallet />
        </div>
      </div>
    </header>
  );
}
