import { Subnet } from '@/lib/config/types';

export function NetworkSweep({ lastSweep }: { lastSweep: string }) {
  return (
    <section className="grid md:grid-cols-[104px_1fr_auto] gap-5 items-center mt-5 p-5 border border-border rounded-3xl bg-card dark:bg-[#171c24]">
      <div className="w-[104px] h-[104px] rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-center p-4">
        <img src="/assets/network-sweep-icon.svg" alt="" className="w-full h-full object-contain dark:invert-0 invert" />
      </div>
      <div>
        <p className="font-sans text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1.5">Network sweep</p>
        <h2 className="font-display text-xl font-bold tracking-tight mb-1 text-foreground">Live subnet monitor ready</h2>
        <p className="text-muted-foreground text-sm">
          Run a first sweep to populate status, latency, and response details.
        </p>
      </div>
      <p className="text-sm text-muted-foreground/80 md:ml-auto">
        Last sweep: {lastSweep !== 'Never' ? new Date(lastSweep).toLocaleTimeString() : 'Never'}
      </p>
    </section>
  );
}


