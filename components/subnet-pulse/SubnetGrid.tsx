import { useState, useMemo } from 'react';
import { Subnet, PingResult } from '@/lib/config/types';
import { Search } from 'lucide-react';
import { SubnetCard } from './SubnetCard';

export function SubnetGrid({ subnets, setSubnets }: { subnets: Subnet[], setSubnets: import('react').Dispatch<import('react').SetStateAction<Subnet[]>> }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return subnets.filter(s => {
      const q = search.toLowerCase();
      return String(s.id).includes(q) || s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q));
    });
  }, [search, subnets]);

  const updateSubnet = (id: number, data: PingResult) => {
    setSubnets(prev => prev.map(s => s.id === id ? { ...s, lastPing: data } : s));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input 
          type="search" 
          placeholder="Search by name or netuid" 
          className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-ring font-sans"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-5">
        {filtered.map(subnet => (
          <SubnetCard key={subnet.id} subnet={subnet} updateSubnet={updateSubnet} />
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-full">No subnets found matching &quot;{search}&quot;</p>
        )}
      </div>
    </div>
  );
}
