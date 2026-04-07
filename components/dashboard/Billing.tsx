"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Plus, Download } from "lucide-react";

const invoices = [
  { id: "INV-1042", date: "2026-03-01", amount: "$382.14", status: "Paid" },
  { id: "INV-1036", date: "2026-02-01", amount: "$291.33", status: "Paid" },
  { id: "INV-1028", date: "2026-01-01", amount: "$204.77", status: "Paid" },
];

export function Billing() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      {/* Left Column: Credits & Limits */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-sans font-medium text-lg tracking-tight">Credits & Payment</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage your prepaid credits for inference usage.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          {/* Main Balance */}
          <div className="rounded-[20px] border border-border bg-secondary dark:bg-black/20 p-6">
            <div className="text-[0.65rem] font-display font-semibold uppercase tracking-widest text-muted-foreground mb-2">
              Available Credits
            </div>
            <div className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
              $1,240.80
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Add Credits
              </Button>
              <Button variant="outline" className="rounded-xl bg-background border-border shadow-sm">Update Card</Button>
            </div>
          </div>

          {/* Progress limit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Monthly budget usage</span>
              <span className="text-muted-foreground font-sans font-medium">$382 / $1,000</span>
            </div>
            <Progress value={38} className="h-2" />
          </div>

          {/* Payment Methods */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border p-4 bg-muted/10 dark:bg-black/10">
              <div className="flex items-center gap-2 text-[0.65rem] font-display font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                <CreditCard className="h-4 w-4" /> Default Card
              </div>
              <div className="font-medium text-foreground">Visa •••• 4242</div>
              <div className="text-sm text-muted-foreground font-sans mt-1">
                Expires 08/29
              </div>
            </div>
            <div className="rounded-xl border border-border p-4 bg-muted/10 dark:bg-black/10">
              <div className="text-[0.65rem] font-display font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Auto Recharge
              </div>
              <div className="font-medium text-foreground">Enabled at $100</div>
              <div className="text-sm text-muted-foreground font-sans mt-1">
                Top up by $500
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Column: Invoices */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20 h-fit">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-sans font-medium text-lg tracking-tight">Invoices</CardTitle>
          <CardDescription className="text-muted-foreground">Your latest billing history.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Invoice</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Date</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Amount</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Status</TableHead>
                <TableHead className="pr-6 text-right font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-muted/50 dark:hover:bg-white/5 border-border/50 transition-colors">
                  <TableCell className="pl-6 font-medium text-foreground">
                    {invoice.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-sans text-sm">
                    {invoice.date}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-sans text-sm">
                    {invoice.amount}
                  </TableCell>
                  <TableCell>
                    <span className="px-2.5 py-1 text-[0.65rem] font-display tracking-[0.06em] rounded-full uppercase border bg-green-500/10 text-green-600 border-green-500/20 dark:bg-[#71e3b0]/10 dark:text-[#71e3b0] dark:border-[#71e3b0]/20">
                      {invoice.status}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
