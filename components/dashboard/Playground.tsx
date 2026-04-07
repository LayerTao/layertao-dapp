"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Play, RotateCcw, Settings2 } from "lucide-react";

export function Playground() {
  const [prompt, setPrompt] = useState(
    "Explain what this API does in one sentence.",
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      {/* Input Side */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="font-sans font-medium text-lg tracking-tight">API Playground</CardTitle>
          <CardDescription className="text-muted-foreground">
            Test your request format before shipping.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[0.65rem] font-display font-semibold text-muted-foreground uppercase tracking-widest px-1">
              Model
            </label>
            <div className="relative">
              <Settings2 className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                defaultValue="layer-chat-1"
                className="pl-11 rounded-xl bg-secondary dark:bg-black/20 border-border font-mono text-sm h-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[0.65rem] font-display font-semibold text-muted-foreground uppercase tracking-widest px-1">
              System Prompt
            </label>
            <Textarea
              className="min-h-[220px] rounded-xl bg-secondary dark:bg-black/20 border-border resize-none font-mono text-sm p-4 leading-relaxed"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="flex-1 rounded-xl h-12 font-sans font-semibold uppercase tracking-wide">
              <Play className="mr-2 h-4 w-4 fill-current" /> Run Request
            </Button>
            <Button
              variant="outline"
              className="rounded-xl h-12 px-6 border-border"
              onClick={() =>
                setPrompt("Explain what this API does in one sentence.")
              }
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Output Side */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-zinc-950 dark:bg-black/40 border-zinc-800 dark:border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 bg-white/5 dark:bg-transparent">
          <CardTitle className="font-sans font-medium text-lg tracking-tight text-white">Sample Response</CardTitle>
          <CardDescription className="text-zinc-400">
            Normalized API output for developers.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="rounded-xl bg-zinc-900/50 border border-white/5 p-6 overflow-hidden">
            <pre className="overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed">
            {`{
  "id": "resp_01HXYZ",
  "object": "chat.completion",
  "model": "layer-chat-1",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "This API gives developers a clean way to use decentralized AI inference through one standard endpoint."
      }
    }
  ],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 21,
    "total_tokens": 35
  }
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
