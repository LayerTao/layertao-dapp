import { NextResponse } from 'next/server';
import subnetsData from '@/lib/config/subnets.json';
import { Subnet } from '@/lib/config/types';

export async function GET() {
  const subnets = subnetsData.map((s) => {
    const subnet = s as unknown as Subnet & Record<string, unknown>;
    return {
      id: subnet.id,
      name: subnet.name,
      network: subnet.network || "Bittensor",
      region: subnet.region || "Unknown",
      description: subnet.description || "",
      logoGlyph: subnet.logoGlyph || "",
      logoUrl: subnet.logoUrl || "",
      website: subnet.website || "",
      githubRepo: subnet.githubRepo || "",
      twitter: subnet.twitter || "",
      monitoringTarget: subnet.monitoringTarget || "",
      check: subnet.check || { type: "demo" }
    };
  });

  return NextResponse.json({ subnets });
}
