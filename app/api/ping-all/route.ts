import { NextResponse } from 'next/server';
import subnetsData from '@/lib/config/subnets.json';
import { runCheck } from '../ping/route';
import { Subnet } from '@/lib/config/types';

export async function POST() {
  try {
    const subnets = subnetsData.map((s) => {
      const subnet = s as unknown as Subnet;
      return {
        ...subnet,
        check: subnet.check || { type: "demo" }
      };
    });
    const results = await Promise.all(subnets.map((subnet) => runCheck(subnet)));
    return NextResponse.json({ results });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
