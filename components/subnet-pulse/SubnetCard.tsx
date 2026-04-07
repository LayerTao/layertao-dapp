import { useState } from 'react';
import { Subnet, PingResult } from '@/lib/config/types';

export function SubnetCard({ subnet, updateSubnet }: { subnet: Subnet, updateSubnet: (id: number, data: PingResult) => void }) {
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const result = subnet.lastPing;

  const pingSubnet = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subnetId: subnet.id })
      });
      const data = await res.json();
      updateSubnet(subnet.id, data);
    } catch(e) {
      updateSubnet(subnet.id, { ok: false, checkedAt: new Date().toISOString(), detail: 'Failed to ping' });
    } finally {
      setLoading(false);
    }
  };

  const statusType = result ? (result.ok ? 'healthy' : 'degraded') : 'unknown';

  return (
    <article className="bg-card dark:bg-[#131820] border border-border rounded-[24px] p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden transition-all hover:border-black/5 dark:hover:border-white/20 hover:-translate-y-[1px]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center font-bold text-foreground overflow-hidden shrink-0">
            {subnet.logoUrl && !imageError ? (
              <img 
                src={subnet.logoUrl} 
                alt="" 
                className="w-full h-full object-cover" 
                onError={() => setImageError(true)}
              />
            ) : (
              subnet.logoGlyph || subnet.name[0]
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans font-semibold uppercase tracking-wider">Subnet {subnet.id}</p>
            <h3 className="font-display font-medium text-lg tracking-tight m-0">{subnet.name}</h3>
          </div>
        </div>
        <div className={`px-2.5 py-1 text-xs font-display tracking-[0.06em] rounded-full uppercase border ${statusType === 'healthy' ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:bg-[#71e3b0]/10 dark:text-[#71e3b0] dark:border-[#71e3b0]/20' : statusType === 'degraded' ? 'bg-orange-500/10 text-orange-600 border-orange-500/30 dark:bg-[#ffbf86]/10 dark:text-[#ffbf86] dark:border-[#ffbf86]/20' : 'bg-black/5 border-black/10 dark:bg-white/5 dark:border-white/10 text-muted-foreground'}`}>
          {result ? (result.ok ? 'Healthy' : 'Degraded') : 'Unknown'}
        </div>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px] leading-relaxed">
        {subnet.description || 'No description available'}
      </p>

      <div className="text-xs text-muted-foreground/80 font-sans tracking-wide">
        {subnet.network} / {subnet.region} / NetUID {subnet.id}
      </div>

      <div className="grid grid-cols-2 gap-3 mt-1">
        <div className="bg-secondary dark:bg-black/20 rounded-xl p-3 border border-border dark:border-white/5">
          <span className="text-[0.7rem] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1 block">Latency</span>
          <strong className="text-foreground font-sans">{result?.latencyMs ? `${result.latencyMs} ms` : '--'}</strong>
        </div>
        <div className="bg-secondary dark:bg-black/20 rounded-xl p-3 border border-border dark:border-white/5">
          <span className="text-[0.7rem] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1 block">Status</span>
          <strong className={`font-sans ${statusType === 'healthy' ? 'text-green-600 dark:text-[#71e3b0]' : statusType === 'degraded' ? 'text-orange-600 dark:text-[#ffbf86]' : 'text-foreground'}`}>
            {result ? (result.ok ? 'Healthy' : 'Degraded') : 'Pending'}
          </strong>
        </div>
      </div>

      <div className="flex gap-2 mt-2">
        <button 
          onClick={pingSubnet}
          disabled={loading}
          className="flex-1 bg-secondary border border-border hover:bg-accent dark:hover:bg-white/10 text-foreground font-sans font-semibold text-sm rounded-xl py-2.5 transition-colors disabled:opacity-50"
        >
          {loading ? 'Checking...' : 'Check'}
        </button>
        {subnet.website && (
          <a href={subnet.website} target="_blank" rel="noreferrer" className="flex-1 bg-secondary border border-border hover:bg-accent dark:hover:bg-white/10 text-foreground font-sans font-semibold text-sm rounded-xl py-2.5 transition-colors text-center">
            Open
          </a>
        )}
      </div>
    </article>
  );
}
