'use client';

import { useEffect, useState } from 'react';
import { SubnetGrid } from '@/components/subnet-pulse/SubnetGrid';
import { NetworkSweep } from '@/components/subnet-pulse/NetworkSweep';
import { WalletPanel } from '@/components/subnet-pulse/WalletPanel';
import { SummaryGrid } from '@/components/subnet-pulse/SummaryGrid';
import { Subnet, PingResult } from '@/lib/config/types';

export default function SubnetPulsePage() {
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastSweep, setLastSweep] = useState<string>('Never');

  const loadSubnets = async () => {
    try {
      const res = await fetch('/api/subnets');
      const data = await res.json();
      setSubnets(data.subnets);
    } catch (e) {
      console.error('Failed to load subnets', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubnets().then(() => {
      handlePingAll();
    });
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handlePingAll();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handlePingAll = async () => {
    try {
      const res = await fetch('/api/ping-all', { method: 'POST' });
      const data = await res.json();
      
      setSubnets(prevSubnets => prevSubnets.map(subnet => {
        const result = data.results.find((r: PingResult) => r.subnetId === subnet.id);
        if (result) {
          return { ...subnet, lastPing: result };
        }
        return subnet;
      }));

      setLastSweep(new Date().toISOString());
    } catch (e) {
      console.error('Failed to ping all', e);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] w-full mx-auto pb-10">

      <section className="grid md:grid-cols-[1.05fr_minmax(340px,0.95fr)] gap-6 p-7 border border-border rounded-3xl bg-gradient-to-b from-background to-muted/30 dark:from-panel dark:to-background shadow-lg relative overflow-hidden">
        <div className="flex flex-col justify-center relative z-10">
          <p className="font-display text-xs tracking-widest uppercase text-muted-foreground mb-3">Live monitor</p>
          <h1 className="font-sans text-4xl md:text-7xl font-bold tracking-[-0.03em] leading-[0.95em] max-w-[15ch]">
            Explore live subnets with the LayerTao Pulse
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-[60ch] mt-4">
            Track subnet-facing endpoints, compare latency across services, and catch degraded
            checks before they turn into user-facing downtime.
          </p>

          <div className="flex flex-wrap gap-4 mt-7 items-center">
            <button 
              onClick={handlePingAll}
              className="relative inline-flex items-center justify-center font-sans tracking-wide uppercase font-semibold text-primary-foreground bg-primary border-none rounded-2xl min-h-[54px] px-7 shadow-sm transition-transform hover:-translate-y-[1px]"
            >
              Ping all subnets
            </button>

            <label className="inline-flex items-center justify-between gap-4 min-w-[270px] px-4 py-3 border border-border rounded-2xl bg-secondary shadow-sm cursor-pointer">
              <span className="flex flex-col gap-0.5">
                <strong className="font-sans text-[0.97rem] tracking-tight text-foreground font-semibold">Auto refresh</strong>
                <small className="font-sans text-[0.82rem] text-muted-foreground tracking-normal font-normal">Run checks every 30 seconds</small>
              </span>
              <div className="relative inline-flex items-center">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
                <div className="w-12 h-7 bg-muted/80 border border-border rounded-full peer-checked:bg-primary/50 dark:peer-checked:bg-white/30 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 shadow-sm"></div>
              </div>
            </label>
          </div>
        </div>

        <div className="relative min-h-[278px] rounded-2xl overflow-hidden bg-gradient-to-b from-muted to-muted/50 dark:from-background/20 dark:to-background/40">
          <img src="/assets/hero-header-art.svg" alt="" className="absolute inset-0 w-full h-full object-cover dark:mix-blend-screen opacity-50 dark:opacity-100" />
          <div className="absolute left-5 bottom-5 px-3 py-2 border border-border dark:border-white/10 rounded-full bg-background/90 dark:bg-background/70 backdrop-blur-md font-sans text-sm font-semibold tracking-wide text-foreground">
            Status board
          </div>
        </div>
      </section>

      <NetworkSweep lastSweep={lastSweep} />
      
      <WalletPanel />

      <SummaryGrid subnets={subnets} lastSweep={lastSweep} />

      <section className="mt-2">
        <p className="font-sans text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">Subnet matrix</p>
        <h2 className="font-display text-2xl font-bold tracking-tight m-0">Configured endpoint checks</h2>
        <p className="text-muted-foreground mt-2 max-w-[80ch]">
          Each card maps to one configured subnet endpoint and can be checked individually or in a full sweep.
        </p>
      </section>

      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading subnets...</div>
      ) : (
        <SubnetGrid subnets={subnets} setSubnets={setSubnets} />
      )}
    </div>
  );
}
