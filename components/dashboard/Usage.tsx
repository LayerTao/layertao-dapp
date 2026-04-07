"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Usage() {
  return (
    <div className="space-y-6">
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-sans font-medium text-lg tracking-tight">Performance Breakdown</CardTitle>
          <CardDescription className="text-muted-foreground">
            Detailed inspection of your API interaction layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="requests" className="w-full">
            <TabsList className="mb-8 p-1 bg-muted/50 dark:bg-black/20 rounded-xl w-full max-w-md grid grid-cols-3">
              <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Activity className="mr-2 h-4 w-4" /> Requests
              </TabsTrigger>
              <TabsTrigger value="latency" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Clock className="mr-2 h-4 w-4" /> Latency
              </TabsTrigger>
              <TabsTrigger value="cost" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <DollarSign className="mr-2 h-4 w-4" /> Cost
              </TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-0">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Chat Completions", value: "95,200", trend: "+12%" },
                  { label: "Embeddings", value: "22,410", trend: "+4%" },
                  { label: "Image Generation", value: "1,820", trend: "-2%" },
                ].map((stat) => (
                  <article
                    key={stat.label}
                    className="p-5 border border-border rounded-[20px] bg-muted/10 dark:bg-black/10 hover:-translate-y-[1px] transition-all"
                  >
                    <div className="text-[0.65rem] font-display font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      {stat.label}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-medium tracking-tight text-foreground">
                        {stat.value}
                      </div>
                      <div
                        className={`text-sm font-medium ${stat.trend.startsWith("+") ? "text-green-600 dark:text-[#71e3b0]" : "text-red-600 dark:text-red-400"}`}
                      >
                        {stat.trend}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="latency" className="mt-0 text-center">
              <div className="rounded-[20px] border border-border bg-muted/10 dark:bg-black/10 p-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6 border border-border">
                  <Clock className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-medium text-foreground tracking-tight">
                  Global Latency Metrics
                </h3>
                <p className="text-muted-foreground mt-2 max-w-sm font-sans">
                  P50: <strong className="text-foreground">420ms</strong> &bull; 
                  P95: <strong className="text-foreground">1.1s</strong> &bull; 
                  P99: <strong className="text-foreground">2.8s</strong>
                </p>
                <Button variant="outline" className="mt-6 rounded-xl border-border px-6">View Heatmap</Button>
              </div>
            </TabsContent>

            <TabsContent value="cost" className="mt-0 text-center">
              <div className="rounded-[20px] border border-border bg-muted/10 dark:bg-black/10 p-12 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center mb-6 border border-border">
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-display font-medium text-foreground tracking-tight">Cost Efficiency</h3>
                <p className="text-muted-foreground mt-2 max-w-sm font-sans leading-relaxed">
                  Average blended cost per request is trending{" "}
                  <strong className="text-green-600 dark:text-[#71e3b0]">
                    down 8.2%
                  </strong>{" "}
                  week over week due to optimized routing.
                </p>
                <Button variant="outline" className="mt-6 rounded-xl border-border px-6">View Savings</Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
