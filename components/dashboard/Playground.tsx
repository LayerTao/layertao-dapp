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
  Network,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutingVisual, SubnetIcon, type SubnetOption } from "@/components/layout/RoutingVisual";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import useTokenBalance from "@/hooks/useTokenBalance";
import { TOKEN_ADDRESS, GATING_THRESHOLD } from "@/lib/constants";
import { Lock } from "lucide-react";
import { useAppKit } from "@reown/appkit/react";

// Define the message type
type Message = {
  role: "user" | "assistant";
  content: string;
}

// --- PRE-FORMATTED MODEL LIST ---
const availableModels = [
  { id: "Qwen/Qwen3-32B-TEE", company: "Qwen", name: "Qwen3-32B-TEE" },
  { id: "Qwen/Qwen3-Coder-Next-TEE", company: "Qwen", name: "Qwen3-Coder-Next-TEE" },
  { id: "openai/gpt-oss-120b-TEE", company: "OpenAI", name: "gpt-oss-120b-TEE" },
  { id: "deepseek-ai/DeepSeek-V3.1-TEE", company: "DeepSeek", name: "DeepSeek-V3.1-TEE" },
  { id: "deepseek-ai/DeepSeek-R1-0528-TEE", company: "DeepSeek", name: "DeepSeek-R1-0528-TEE" },
  { id: "deepseek-ai/DeepSeek-V3.2-TEE", company: "DeepSeek", name: "DeepSeek-V3.2-TEE" },
  { id: "MiniMaxAI/MiniMax-M2.5-TEE", company: "MiniMax", name: "MiniMax-M2.5-TEE" },
  { id: "zai-org/GLM-4.7-TEE", company: "Zai-Org", name: "GLM-4.7-TEE" },
  { id: "Qwen/Qwen3-235B-A22B-Instruct-2507-TEE", company: "Qwen", name: "Qwen3-235B-A22B-Instruct-2507-TEE" },
  { id: "zai-org/GLM-5-Turbo", company: "Zai-Org", name: "GLM-5-Turbo" },

];
// --- HELPER FUNCTION TO PARSE <think> TAGS ---
function parseMessageContent(content: string) {
  let thinkContent = "";
  let mainContent = content;

  // Regex matches <think>...</think> or <think>... if streaming isn't complete yet
  const thinkMatch = content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  if (thinkMatch) {
    thinkContent = thinkMatch[1].trim();
    // Remove the think block from the main content
    mainContent = content.replace(/<think>([\s\S]*?)(?:<\/think>|$)/, '').trim();
  }

  return { thinkContent, mainContent };
}

export function Playground() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSubnet, setActiveSubnet] = useState("subnet-01");
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id);

  const { isConnected } = useAccount();
  const { balance, decimals, isFetched } = useTokenBalance(TOKEN_ADDRESS);

  // Determine if the user is gated
  // If not connected, or if fetched and balance is below threshold
  const isGated = isConnected && isFetched && balance !== undefined && balance < GATING_THRESHOLD;
  const showLock = !isConnected || isGated;
  const needsConnection = !isConnected;
  const { open } = useAppKit();

  const thresholdFormatted = GATING_THRESHOLD > BigInt(0) && typeof decimals === 'number'
    ? formatUnits(GATING_THRESHOLD, decimals) 
    : "0";

  const subnetOptions = [
    {
      id: "subnet-01",
      title: "Chutes AI",
      subtitle: "Deep Reasoning",
      description: "Designed for complex AI workloads requiring deeper context and multi-step thinking.",
      iconString: "chutes-ai", 
      available: true,
    },
    {
      id: "subnet-02",
      title: "Lium",
      subtitle: "Reasoning workloads",
      description: "Designed for longer context windows and more complex tasks.",
      iconString: "default", 
      available: false,
    },
    {
      id: "subnet-03",
      title: "Targon",
      subtitle: "Specialized agents",
      description: "Best for agentic flows, orchestration, and domain-specific tools.",
      iconString: "default", 
      available: false,
    },
  ];

  const [routingStep, setRoutingStep] = useState<'idle' | 'routing' | 'processing' | 'received'>('idle');

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setRoutingStep('routing');

    try {
      // Small artificial delay for "Routing" phase
      await new Promise(resolve => setTimeout(resolve, 800));
      setRoutingStep('processing');

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          model: selectedModel,
          messages: [
            { role: "system", "content": "You are a helpful AI assistant." },
            ...newMessages
          ] 
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setRoutingStep('received');
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        
        // Reset status after a brief moment of success showing
        setTimeout(() => setRoutingStep('idle'), 3000);
      } else {
        setRoutingStep('idle');
        console.error(data.error);
      }
    } catch (error) {
      setRoutingStep('idle');
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[0.65rem] md:text-[0.7rem] font-display font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Playground
          </p>
          <h1 className="text-2xl md:text-3xl font-sans tracking-[-0.03em] text-foreground leading-tight">
            Build across subnets
          </h1>
        </div>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* LayerTao Unified Router */}
          <button 
            disabled
            className="group relative col-span-1 sm:col-span-2 md:col-span-3 xl:col-span-3 overflow-hidden rounded-[24px] border border-border dark:border-white/10 bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-panel dark:to-background p-6 text-left shadow-lg opacity-80 cursor-not-allowed min-h-[160px]"
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
                  <SubnetIcon 
                    iconString={option.iconString}
                    className={`h-4 w-4 transition-colors ${
                      activeSubnet === option.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`} 
                  />
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
      <section className="grid gap-6 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px]">
        {/* Prompt Workspace */}
        <div className="flex flex-col rounded-[28px] border border-border bg-card shadow-sm overflow-hidden">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/50 px-6 py-4 bg-muted/20">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2 uppercase tracking-widest text-[11px]">
                <Layout className="h-3.5 w-3.5" /> Prompt Workspace
              </h2>
              <p className="text-[12px] text-muted-foreground mt-0.5 font-medium">
                Compose prompts and test subnet behavior in one place.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="!h-11 w-full sm:w-[220px] lg:w-[240px] bg-background border-border/50 shadow-sm text-xs focus:ring-primary/20">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="py-2 cursor-pointer">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                          {model.company}
                        </span>
                        <span className="font-semibold text-foreground text-[13px]">
                          {model.name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1.5 rounded-full border border-healthy/20 bg-healthy/10 px-2.5 py-1 text-[10px] font-bold text-healthy uppercase tracking-wider shrink-0">
                <CheckCircle2 className="h-3 w-3" /> Ready
              </div>
            </div>

          </div>

          <div className="flex-1 p-6 flex flex-col gap-6">
            <div className="flex-1 min-h-[400px] max-h-[600px] rounded-[20px] border border-dashed border-border bg-muted/10 flex flex-col relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none" />
              
              {showLock ? (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md p-6 md:p-8 text-center animate-in fade-in duration-500">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 animate-pulse blur-2xl bg-primary/20 rounded-full" />
                    <div className="relative h-16 w-16 md:h-20 md:w-20 rounded-[20px] md:rounded-3xl bg-card border border-border shadow-2xl flex items-center justify-center">
                      <Lock className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-sans tracking-tight font-bold text-foreground mb-2 md:mb-3">
                    {needsConnection ? "Connect Wallet to Access" : "Token Gated Access"}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed mb-8">
                    {needsConnection 
                      ? "The Playground requires a connected wallet and a minimum token balance to use." 
                      : `You need at least ${thresholdFormatted} $LAYERTAO tokens to use the Playground.`}
                  </p>
                  
                  {!isConnected ? (
                    <div className="flex flex-col gap-2 w-full max-w-[240px]">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Get Started
                      </p>
                      {/* Note: Clicking this triggers the wallet modal */}
                      <Button 
                        onClick={() => open()}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl h-12 font-bold transition-all active:scale-95"
                      >
                        Connect Wallet
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <div className="px-6 py-3 rounded-2xl bg-muted/50 border border-border flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                          Balance: {balance !== undefined && balance !== null && typeof decimals === 'number' ? formatUnits(balance as bigint, decimals) : "0"} $LAYERTAO
                        </span>
                      </div>
                      <Button variant="outline" className="rounded-xl font-bold">
                        Learn how to get $LAYERTAO
                      </Button>
                    </div>
                  )}
                </div>
              ) : null}

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
                          // --- UPDATED ASSISTANT RENDERER ---
                          (() => {
                            const { thinkContent, mainContent } = parseMessageContent(msg.content);
                            
                            return (
                              <div className="flex flex-col gap-3">
                                {thinkContent && (
                                  <details className="group border border-border/50 rounded-xl overflow-hidden bg-background/50 open:bg-background/80 transition-colors">
                                    <summary className="cursor-pointer px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 hover:bg-muted/40 transition-colors select-none">
                                      <Brain className="h-3.5 w-3.5" />
                                      <span className="group-open:hidden">View Thinking Process</span>
                                      <span className="hidden group-open:inline">Hide Thinking Process</span>
                                    </summary>
                                    <div className="p-4 pt-2 text-[13px] text-muted-foreground/80 border-t border-border/50 whitespace-pre-wrap font-mono leading-relaxed max-h-[300px] overflow-y-auto">
                                      {thinkContent}
                                    </div>
                                  </details>
                                )}
                                {mainContent && (
                                  <div className="prose prose-sm dark:prose-invert max-w-none break-words text-foreground">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {mainContent}
                                    </ReactMarkdown>
                                  </div>
                                )}
                              </div>
                            );
                          })()
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

            <div className={`flex items-center gap-3 rounded-[24px] border border-border bg-background px-4 py-3 shadow-inner focus-within:border-primary/50 transition-colors group ${showLock ? "opacity-50 pointer-events-none" : ""}`}>
              <Input
                className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none text-base placeholder:text-muted-foreground/40 font-medium"
                placeholder={showLock ? "Connect wallet to start" : "Ask anything or add your prompt here..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !showLock) handleSend();
                }}
                disabled={isLoading || showLock}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isLoading || showLock}
                className="h-11 w-11 bg-foreground text-background hover:bg-foreground/90 shadow-lg transition-transform active:scale-95 shrink-0 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Aside Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="rounded-[32px] border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-widest text-[11px]">Request Routing</h2>
              <div className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <span className={`h-1.5 w-1.5 rounded-full ${isLoading ? "bg-amber-500 animate-pulse" : "bg-healthy"}`} />
                {isLoading ? "Active" : "Stable"}
              </div>
            </div>

            <RoutingVisual 
              activeSubnet={activeSubnet} 
              step={routingStep} 
              subnets={subnetOptions} 
            />

            <div className="mt-8 rounded-[24px] border border-border bg-muted/10 p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Network className="h-12 w-12" />
              </div>
              <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                Why LayerTao?
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground font-medium">
                It presents a single abstraction layer over the subnet ecosystem so builders do not need to manually coordinate routing.
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