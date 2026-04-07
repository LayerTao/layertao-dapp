import { Subnet } from '@/lib/config/types';

export function SummaryGrid({ subnets, lastSweep }: { subnets: Subnet[], lastSweep: string }) {
  // Calculate healthy and degraded based on lastPing ok status
  const healthyCount = subnets.filter(s => s.lastPing?.ok === true).length;
  const degradedCount = subnets.filter(s => s.lastPing?.ok === false).length;

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 mb-7">
      <article className="p-5 border border-border rounded-[22px] bg-gradient-to-b from-background to-muted dark:from-[#11151d] dark:to-[#0d1118] shadow-sm hover:-translate-y-[1px] transition-transform">
        <span className="block text-sm text-muted-foreground mb-3 font-semibold tracking-wide uppercase">Configured</span>
        <strong className="text-3xl font-display font-medium tracking-tight text-foreground">{subnets.length}</strong>
      </article>
      <article className="p-5 border border-green-500/30 dark:border-[#71e3b0]/20 rounded-[22px] bg-gradient-to-b from-green-500/10 to-background dark:from-panel dark:to-background shadow-sm hover:-translate-y-[1px] transition-transform">
        <span className="block text-sm text-green-600 dark:text-[#71e3b0] mb-3 font-semibold tracking-wide uppercase">Healthy</span>
        <strong className="text-3xl font-display font-medium tracking-tight text-foreground">{healthyCount}</strong>
      </article>
      <article className="p-5 border border-orange-500/30 dark:border-[#ffbf86]/20 rounded-[22px] bg-gradient-to-b from-orange-500/10 to-background dark:from-panel dark:to-background shadow-sm hover:-translate-y-[1px] transition-transform">
        <span className="block text-sm text-orange-600 dark:text-[#ffbf86] mb-3 font-semibold tracking-wide uppercase">Degraded</span>
        <strong className="text-3xl font-display font-medium tracking-tight text-foreground">{degradedCount}</strong>
      </article>
      <article className="p-5 border border-border rounded-[22px] bg-gradient-to-b from-background to-muted dark:from-[#11151d] dark:to-[#0d1118] shadow-sm hover:-translate-y-[1px] transition-transform">
        <span className="block text-sm text-muted-foreground mb-3 font-semibold tracking-wide uppercase">Last sweep</span>
        <strong className="text-2xl font-display font-medium tracking-tight text-foreground truncate block mt-1">
          {lastSweep !== 'Never' ? new Date(lastSweep).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}
        </strong>
      </article>
    </section>
  );
}
