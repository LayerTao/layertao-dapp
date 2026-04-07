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

import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  DollarSign,
  Key,
  CheckCircle2,
  Terminal,
  Receipt,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Requests Today",
    value: "128,420",
    delta: "+12.4%",
    icon: ArrowUpRight,
  },
  {
    label: "Credits Balance",
    value: "$1,240.80",
    delta: "Healthy",
    icon: DollarSign,
  },
  { label: "Active API Keys", value: "4", delta: "+1 this week", icon: Key },
  {
    label: "Success Rate",
    value: "99.2%",
    delta: "Last 24h",
    icon: CheckCircle2,
  },
];

const usageRows = [
  {
    time: "09:42",
    endpoint: "/v1/chat/completions",
    requests: 2401,
    latency: "742ms",
    cost: "$14.20",
    status: "Healthy",
  },
  {
    time: "09:30",
    endpoint: "/v1/images/generations",
    requests: 221,
    latency: "2.1s",
    cost: "$18.41",
    status: "Healthy",
  },
  {
    time: "09:15",
    endpoint: "/v1/embeddings",
    requests: 10022,
    latency: "231ms",
    cost: "$9.88",
    status: "Healthy",
  },
  {
    time: "08:50",
    endpoint: "/v1/chat/completions",
    requests: 1611,
    latency: "1.2s",
    cost: "$10.92",
    status: "Degraded",
  },
];

export function Overview() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border rounded-[24px] bg-card shadow-sm hover:-translate-y-[1px] transition-all overflow-hidden"
            >
              <CardContent className="p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[0.65rem] font-display font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                    {stat.label}
                  </div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
                    {stat.value}
                  </div>
                  <div className={`mt-2 text-sm font-medium ${stat.delta === 'Healthy' || stat.delta.startsWith('+') ? 'text-green-600 dark:text-[#71e3b0]' : 'text-muted-foreground'}`}>
                    {stat.delta}
                  </div>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-foreground">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        {/* Usage Overview */}
        <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>
              How your core endpoints are performing today.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[
              {
                label: "Chat Completions",
                usage: 78,
                meta: "95,200 req • $124.40",
              },
              { label: "Embeddings", usage: 44, meta: "22,410 req • $38.14" },
              {
                label: "Image Generation",
                usage: 62,
                meta: "1,820 req • $84.12",
              },
            ].map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{row.meta}</span>
                </div>
                <Progress value={row.usage} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks for your engineering team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Generate production API key",
                href: "/api-keys",
                icon: Key,
              },
              { label: "Top up credits", href: "/billing", icon: DollarSign },
              { label: "Open playground", href: "/playground", icon: Terminal },
              {
                label: "Download latest invoice",
                href: "/billing",
                icon: Receipt,
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex w-full items-center justify-between rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 border border-border">
                      <Icon className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Usage Table */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20 h-fit">
        <CardHeader>
          <CardTitle>Recent Usage</CardTitle>
          <CardDescription>
            Latest endpoint activity across your projects.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Time</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Endpoint</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Requests</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Latency</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Cost</TableHead>
                <TableHead className="pr-6 font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usageRows.map((row) => (
                <TableRow key={`${row.time}-${row.endpoint}`} className="hover:bg-muted/50 dark:hover:bg-white/5 border-border/50 transition-colors">
                  <TableCell className="pl-6 text-muted-foreground">
                    {row.time}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">{row.endpoint}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.requests.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.latency}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.cost}
                  </TableCell>
                  <TableCell className="pr-6">
                    <span className={`px-2.5 py-1 text-[0.65rem] font-display tracking-[0.06em] rounded-full uppercase border ${row.status === 'Healthy' ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-[#71e3b0]/10 dark:text-[#71e3b0] dark:border-[#71e3b0]/20' : 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-[#ffbf86]/10 dark:text-[#ffbf86] dark:border-[#ffbf86]/20'}`}>
                      {row.status}
                    </span>
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
