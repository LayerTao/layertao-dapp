"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChevronRight, FileText, BookOpen, Code2 } from "lucide-react";

export function Docs() {
  const topics = [
    { title: "Quickstart", icon: Code2 },
    { title: "Authentication", icon: FileText },
    { title: "Chat Completions", icon: BookOpen },
    { title: "Embeddings", icon: BookOpen },
    { title: "Image Generation", icon: BookOpen },
    { title: "Errors & Retries", icon: FileText },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
      {/* Navigation Column */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20 h-fit">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-sans font-medium text-lg tracking-tight">Docs Navigation</CardTitle>
          <CardDescription className="text-muted-foreground">
            Start with the basics and move to production.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-2">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <button
                key={topic.title}
                className="group flex w-full items-center justify-between rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted dark:hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-black/5 dark:bg-white/5 border border-border">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{topic.title}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Content Column */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-sans font-medium text-lg tracking-tight">Quickstart</CardTitle>
          <CardDescription className="text-muted-foreground">Call the API with your project key.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative rounded-[20px] overflow-hidden border border-border bg-black/5 dark:bg-black/40">
            {/* Fake window controls for aesthetic */}
            <div className="flex items-center gap-1.5 bg-zinc-900 px-4 py-4 border-b border-zinc-800">
              <div className="h-3 w-3 rounded-full bg-red-500/20 border border-red-500/50" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
              <div className="h-3 w-3 rounded-full bg-green-500/20 border border-green-500/50" />
              <span className="ml-3 text-[0.7rem] text-zinc-500 font-mono uppercase tracking-widest font-semibold">
                main.py
              </span>
            </div>
            <pre className="overflow-x-auto bg-zinc-950 p-6 text-xs text-zinc-300 font-mono leading-relaxed">
              {`import requests

resp = requests.post(
    "https://api.layer.dev/v1/chat/completions",
    headers={
        "Authorization": "Bearer YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "model": "layer-chat-1",
        "messages": [
            {"role": "user", "content": "Write a hello world function in Python"}
        ]
    }
)

print(resp.json())`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
