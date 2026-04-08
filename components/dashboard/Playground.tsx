"use client";

import { useState } from "react";
import { 
  Play, 
  Save, 
  Send, 
  Layout, 
  CheckCircle2, 
  Image as ImageIcon,
  Loader2,
  Network // <-- The ONLY fallback icon we need now
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Define the message type
type Message = {
  role: "user" | "assistant";
  content: string;
};

// --- THE NEW STRIPPED DOWN ICON COMPONENT ---
function SubnetIcon({ 
  iconString, 
  className 
}: { 
  iconString: string; 
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  // If you pass "default" OR if the SVG fails to load, just show the Network icon
  if (iconString === "default" || hasError) {
    return <Network className={className} />;
  }

  // Otherwise, try to load the SVG
  return (
    <img 
      src={`/assets/subnets/${iconString}.svg`}
      alt="Subnet icon"
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
// ---------------------------------------------

export function Playground() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubnet, setActiveSubnet] = useState("subnet-01");

  // --- UPDATED OPTIONS ---
  // Just use the string. "default" triggers the Network icon. Anything else triggers the SVG.
  const subnetOptions = [
    {
      id: "subnet-01",
      title: "Chutes AI",
      subtitle: "Deep Reasoning",
      description: "Designed for complex AI workloads requiring deeper context and multi-step thinking.",
      iconString: "chutes-ai", // Will try to load /assets/subnets/chutes-ai.svg
      available: true,
    },
    {
      id: "subnet-02",
      title: "Subnet 02",
      subtitle: "Reasoning workloads",
      description: "Designed for longer context windows and more complex tasks.",
      iconString: "default", // Instantly loads the Lucide Network icon
      available: false,
    },
    {
      id: "subnet-03",
      title: "Subnet 03",
      subtitle: "Specialized agents",
      description: "Best for agentic flows, orchestration, and domain-specific tools.",
      iconString: "default", // Instantly loads the Lucide Network icon
      available: false,
    },
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [
            { role: "system", "content": "You are a helpful AI assistant." },
            ...newMessages
          ] 
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        console.error(data.error);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[0.7rem] font-display font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Playground
          </p>
          <h1 className="mt-1 text-3xl font-sans tracking-[-0.03em] text-foreground ">
            Build across subnets
          </h1>
        </div>

        {/* <div className="flex items-center gap-2">
          <Button variant="outline" className="h-10 border-border bg-background shadow-sm px-5">
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button className="h-10 px-6 shadow-sm">
            <Play className="mr-2 h-4 w-4 fill-current" /> Run Playground
          </Button>
        </div> */}
      </div>

      {/* Network Selection Section */}
      <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Choose your network</h2>
            <p className="text-sm text-muted-foreground">
              Pick a subnet directly or use LayerTao to unify routing across them.
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full border border-border bg-muted/50 px-3 py-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
            4 options available
          </span>
        </div>

        <div className="grid gap-4 xl:grid-cols-6">
          {/* LayerTao Unified Router */}
          <button 
            disabled
            className="group relative col-span-3 overflow-hidden rounded-[24px] border border-border dark:border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-panel dark:to-background p-6 text-left shadow-lg opacity-80 cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90">
                  Unified
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70 backdrop-blur-sm border border-white/10">
                  Coming Soon
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-2xl tracking-[-0.03em] font-sans text-white/80">LayerTao</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400 dark:text-muted-foreground max-w-[60ch]">
                  One entry point that abstracts subnet selection, balances traffic, and lets apps scale across the ecosystem effortlessly.
                </p>
              </div>
            </div>
          </button>

          {/* Subnet Options */}
          {subnetOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => option.available && setActiveSubnet(option.id)}
              disabled={!option.available}
              className={`col-span-1 rounded-[24px] border p-4 text-left shadow-sm transition-all group ${
                activeSubnet === option.id 
                  ? "border-primary/5 bg-background ring-1 ring-primary/20" 
                  : option.available 
                    ? "border-border bg-background hover:-translate-y-0.5 hover:border-border/80 hover:bg-muted/30"
                    : "border-border/50 bg-muted/10 opacity-70 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${
                  activeSubnet === option.id 
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/50 text-muted-foreground"
                }`}>
                  Subnet
                </span>
                {option.available ? (
                  <div className={`h-2 w-2 rounded-full border transition-colors ${
                    activeSubnet === option.id ? "bg-transparent border-green-500" : "border-border bg-zinc-200 dark:bg-zinc-800 group-hover:bg-primary/50"
                  }`} />
                ) : (
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                   Coming Soon
                  </span>
                )}
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-1">
                  
                  {/* --- USING THE NEW ICON COMPONENT --- */}
                  <SubnetIcon 
                    iconString={option.iconString}
                    className={`h-4 w-4 transition-colors ${
                      activeSubnet === option.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`} 
                  />
                  {/* ------------------------------------ */}

                  <h3 className={`text-sm font-semibold tracking-tight ${
                    activeSubnet === option.id ? "text-primary" : "text-foreground"
                  }`}>
                    {option.title}
                  </h3>
                </div>
                <p className="text-[11px] font-medium text-muted-foreground/80 mb-2 truncate">{option.subtitle}</p>
                <p className="text-[11px] leading-relaxed text-muted-foreground line-clamp-3">
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Workspace Grid */}
      <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
        {/* Prompt Workspace */}
        <div className="flex flex-col rounded-[28px] border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-widest text-[11px]">
                <Layout className="h-3.5 w-3.5" /> Prompt Workspace
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
                Compose prompts and test subnet behavior in one place.
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-healthy/20 bg-healthy/10 px-2.5 py-1 text-[10px] font-bold text-healthy uppercase tracking-wider">
              <CheckCircle2 className="h-3 w-3" /> Ready
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col gap-6">
            <div className="flex-1 min-h-[400px] max-h-[500px] rounded-[20px] border border-dashed border-border bg-muted/10 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
              
              <div className="w-full h-full p-6 overflow-y-auto z-10 flex flex-col gap-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center opacity-40">
                    <Network className="h-10 w-10 text-muted-foreground mb-1" />
                    <p className="text-sm font-medium">Workspace is empty</p>
                    <p className="text-xs">Your conversation will appear here.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed overflow-x-auto ${
                        msg.role === "user" 
                          ? "bg-primary text-primary-foreground rounded-tr-sm" 
                          : "bg-muted text-foreground rounded-tl-sm border border-border/50"
                      }`}>
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                         <div className="prose prose-sm dark:prose-invert max-w-none break-words text-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-muted border border-border/50 px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-[24px] border border-border bg-background px-4 py-3 shadow-inner focus-within:border-primary/50 transition-colors group">
              <Input
                className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none text-base placeholder:text-muted-foreground/40 font-medium"
                placeholder="Ask anything or add your prompt here..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-11 w-11 bg-foreground text-background hover:bg-foreground/90 shadow-lg transition-transform active:scale-95 shrink-0 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Aside Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-[28px] border border-border bg-muted/30 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest text-[11px]">Examples</h2>
              <span className="text-[10px] font-bold text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-full uppercase tracking-tighter">
                3 presets
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Market Map", id: "preset-1" },
                { label: "Agent Flow", id: "preset-2" },
                { label: "Model Test", id: "preset-3" }
              ].map((example) => (
                <button
                  key={example.id}
                  className="group flex flex-col items-center gap-2"
                >
                  <div className="aspect-square w-full rounded-[20px] border border-border bg-background flex items-center justify-center text-muted-foreground transition-all hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5 group-hover:text-primary">
                    <ImageIcon className="h-6 w-6 opacity-60" />
                  </div>
                  <p className="w-full truncate text-[10px] font-bold uppercase tracking-widest text-center text-muted-foreground group-hover:text-foreground transition-colors">
                    {example.label}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-8 rounded-[24px] border border-border bg-card p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Network className="h-12 w-12" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                Why LayerTao?
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground font-medium">
                It presents a single abstraction layer over the subnet ecosystem so builders do not need to manually coordinate routing, failover, or subnet-specific integration logic.
              </p>
            </div>
          </div>
          
          <div className="rounded-[28px] border border-dashed border-border p-6 flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <Network className="h-5 w-5 text-muted-foreground" />
            </div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">Usage Statistics</h4>
            <div className="w-full bg-muted/50 rounded-full h-1.5 mt-1 overflow-hidden">
              <div className="bg-primary h-full w-[40%] rounded-full" />
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">
              40% of Daily credits used
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}