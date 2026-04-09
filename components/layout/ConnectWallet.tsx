"use client";

import { useState, useEffect } from "react";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { formatUnits } from "viem";
import { ChevronDown, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function ConnectWallet() {
  const { isConnected, address, connector } = useAccount();
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { data: ethBalance, refetch: refetchEth } = useBalance({ address });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleConnect = () => {
    open();
  };

  if (!mounted) return <Button variant="outline">Connect Wallet</Button>;

  if (!isConnected || !address) {
    return (
      <Button
        onClick={handleConnect}
        className="font-display tracking-[0.06rem]"
      >
        Connect Wallet
      </Button>
    );
  }

  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="font-display text-[0.8rem] tracking-[0.06rem] dark:bg-zinc-900/50 border-border/50 hover:bg-zinc-800/50 transition-all"
        >
          {truncatedAddress}
          <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-100 p-5 rounded-2xl border-border bg-card shadow-2xl dark:bg-[#0c0f14]/95 backdrop-blur-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
            Connected Wallet
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-border/50">
            <span className="text-[11px] font-semibold text-foreground">
              {connector?.name || "Wallet"}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-bold tracking-tight text-foreground mb-1">
            Ethereum Account 1
          </h3>
          <p className="text-sm font-mono text-muted-foreground break-all leading-tight opacity-70">
            {address}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-border/40 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2 group-hover:text-blue-500/70 transition-colors">
              Ethereum
            </p>
            <p className="text-sm font-bold text-foreground">
              {ethBalance
                ? `${Number(formatUnits(ethBalance.value, ethBalance.decimals)).toFixed(4)} ETH`
                : "0.0000 ETH"}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-border/40 hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
            <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase mb-2 group-hover:text-purple-500/70 transition-colors">
              $LAYERTAO
            </p>
            <p className="text-sm font-bold text-foreground">0 LAYERTAO</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchEth()}
            className="rounded-xl font-sans font-semibold text-xs border-border/50 dark:bg-zinc-900/50 hover:bg-zinc-800/80"
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => disconnect()}
            className="rounded-xl font-sans font-semibold text-xs border-border/50 dark:bg-zinc-900/50 hover:bg-zinc-800/80"
          >
            <LogOut className="mr-2 h-3 w-3" />
            Disconnect
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
