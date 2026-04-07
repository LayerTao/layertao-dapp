"use client";

import { useState, useMemo } from "react";
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
import { Input } from "@/components/ui/input";
import {
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

const initialKeys = [
  {
    id: 1,
    name: "Production",
    prefix: "layertao_live_51A9",
    created: "2026-03-20",
    lastUsed: "2 min ago",
    status: "Active",
  },
  {
    id: 2,
    name: "Staging",
    prefix: "layertao_test_98DD",
    created: "2026-03-18",
    lastUsed: "1 hour ago",
    status: "Active",
  },
  {
    id: 3,
    name: "Data Pipeline",
    prefix: "layertao_live_22KF",
    created: "2026-03-15",
    lastUsed: "2 days ago",
    status: "Restricted",
  },
];

export function ApiKeys() {
  const [keys, setKeys] = useState(initialKeys);
  const [showSecret, setShowSecret] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(false);

  const generatedKey = useMemo(() => "layertao_live_2Hq7M9xnP8f2QvYxj4eR7cA9", []);

  function handleCreateKey() {
    const name = newKeyName.trim() || `Project Key ${keys.length + 1}`;
    const nextId = keys.length ? Math.max(...keys.map((key) => key.id)) + 1 : 1;

    const newKey = {
      id: nextId,
      name,
      prefix: "layer_test_98DD",
      created: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
      status: "Active",
    };

    setKeys((prev) => [newKey, ...prev]);
    setNewKeyName("");
    setNewlyCreatedKey(true);
    setShowSecret(true);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      {/* Left Column: Key List */}
      <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20 h-fit">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
          <div>
            <CardTitle className="font-sans font-medium text-lg tracking-tight">API Keys</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">
              Create, rotate, and revoke project keys.
            </CardDescription>
          </div>
          <div className="flex w-full sm:w-auto flex-col gap-2 sm:flex-row">
            <Input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="New key name..."
              className="sm:w-[200px] rounded-xl bg-secondary border-border"
            />
            <Button onClick={handleCreateKey} className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" /> Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-6 font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Name</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Prefix</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Created</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Last Used</TableHead>
                <TableHead className="font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Status</TableHead>
                <TableHead className="pr-6 text-right font-display uppercase text-[0.65rem] tracking-widest font-semibold text-muted-foreground/70">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id} className="hover:bg-muted/50 dark:hover:bg-white/5 border-border/50 transition-colors">
                  <TableCell className="pl-6 font-medium text-foreground">{key.name}</TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {key.prefix}••••••••
                  </TableCell>
                  <TableCell className="text-muted-foreground font-sans text-sm">
                    {key.created}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-sans text-sm">
                    {key.lastUsed}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 text-[0.65rem] font-display tracking-[0.06em] rounded-full uppercase border ${key.status === "Active" ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-[#71e3b0]/10 dark:text-[#71e3b0] dark:border-[#71e3b0]/20' : 'bg-white/5 border-black/10 dark:border-white/10 text-muted-foreground'}`}>
                      {key.status}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
                        <RefreshCw className="mr-2 h-3 w-3" /> Rotate
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
                        onClick={() =>
                          setKeys((prev) => prev.filter((k) => k.id !== key.id))
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Right Column: Previews & Docs */}
      <div className="space-y-6">
        {newlyCreatedKey && (
          <Card className="border-primary/20 rounded-[24px] shadow-sm bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="font-sans font-medium text-lg tracking-tight text-primary">New Key Preview</CardTitle>
              <CardDescription className="text-muted-foreground">
                Show this only once after creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="break-all rounded-xl border border-border bg-black/5 dark:bg-white/5 p-4 font-mono text-sm text-foreground">
                {showSecret
                  ? generatedKey
                  : "layertao_live_••••••••••••••••••••••••••"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setShowSecret((s) => !s)}
                >
                  {showSecret ? (
                    <EyeOff className="mr-2 h-4 w-4" />
                  ) : (
                    <Eye className="mr-2 h-4 w-4" />
                  )}
                  {showSecret ? "Hide" : "Reveal"}
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={() =>
                    navigator?.clipboard?.writeText?.(generatedKey)
                  }
                >
                  <Copy className="mr-2 h-4 w-4" /> Copy Key
                </Button>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-orange-600 dark:text-orange-400 font-sans">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="leading-relaxed">
                  Store this key securely. You won’t be able to view the full
                  secret again after leaving this page.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border rounded-[24px] shadow-sm overflow-hidden bg-card transition-all hover:border-black/5 dark:hover:border-white/20">
          <CardHeader className="border-b border-border/50 pb-4">
            <CardTitle className="font-sans font-medium text-lg tracking-tight">Integration Example</CardTitle>
            <CardDescription className="text-muted-foreground">
              Use your key in a normal HTTP request.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <pre className="overflow-x-auto rounded-xl bg-zinc-950 dark:bg-black/40 p-4 text-xs text-zinc-300 font-mono leading-relaxed border border-white/5">
              {`curl https://api.layer.dev/v1/chat \\
  -H "Authorization: Bearer YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "layer-chat-1",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
