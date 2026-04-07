import { NextResponse } from 'next/server';
import subnetsData from '@/lib/config/subnets.json';
import net from 'net';
import { Subnet } from '@/lib/config/types';

const REQUEST_TIMEOUT_MS = 5000;

function getSubnetById(subnetId: number | string): Subnet | undefined {
  const subnet = (subnetsData as unknown as Subnet[]).find((s) => String(s.id) === String(subnetId));
  if (!subnet) return undefined;
  return {
    ...subnet,
    check: subnet.check || { type: "demo" }
  };
}

async function pingHttp(url: string) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    let response;
    try {
      response = await fetch(url, { method: "HEAD", signal: controller.signal });
    } catch {
      response = await fetch(url, { method: "GET", signal: controller.signal });
    }

    return {
      ok: response.ok,
      latencyMs: Date.now() - startedAt,
      statusCode: response.status,
      statusText: response.statusText || "OK",
      detail: `${response.status} ${response.statusText || ""}`.trim()
    };
  } catch (error: unknown) {
    const isAbort = error instanceof Error && error.name === "AbortError";
    const msg = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      detail: isAbort ? "Request timed out" : msg
    };
  } finally {
    clearTimeout(timeout);
  }
}

function pingTcp(host: string, port: number) {
  return new Promise<{ ok: boolean; detail: string; latencyMs?: number }>((resolve) => {
    const startedAt = Date.now();
    const socket = new net.Socket();
    let settled = false;

    const finish = (result: { ok: boolean; detail: string; latencyMs?: number }) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ...result, latencyMs: Date.now() - startedAt });
    };

    socket.setTimeout(REQUEST_TIMEOUT_MS);
    socket.connect(port, host, () => finish({ ok: true, detail: "TCP connection established" }));
    socket.on("timeout", () => finish({ ok: false, detail: "TCP connection timed out" }));
    socket.on("error", (error) => finish({ ok: false, detail: error.message }));
  });
}

function createDemoCheck(subnet: Subnet) {
  const timeBucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const seed = (Number(subnet.id) * 37 + timeBucket * 17) % 100;
  const ok = seed % 7 !== 0;
  const latencyMs = 48 + ((Number(subnet.id) * 29 + timeBucket * 11) % 240);

  const healthyDetails = [
    "Demo snapshot shows stable subnet health",
    "Demo snapshot indicates low latency",
    "Demo sample reports normal validator response",
    "Demo sample shows healthy service availability"
  ];

  const degradedDetails = [
    "Demo snapshot shows elevated latency",
    "Demo sample reports intermittent validator response",
    "Demo sample indicates brief service degradation",
    "Demo snapshot shows partial endpoint instability"
  ];

  const details = ok ? healthyDetails : degradedDetails;
  const detail = details[(Number(subnet.id) + timeBucket) % details.length];

  return { ok, latencyMs, detail, demo: true };
}

export async function runCheck(subnet: Subnet) {
  if (!subnet || !subnet.check || !subnet.check.type) {
    return {
      subnetId: subnet ? subnet.id : null,
      ok: null,
      configured: false,
      checkedAt: new Date().toISOString(),
      detail: "No monitoring endpoint configured"
    };
  }

  let result: Record<string, unknown> = {};
  if (subnet.check.type === "http") {
    if (!subnet.check.url) {
      result = { ok: false, detail: "HTTP check URL is missing in configuration" };
    } else {
      result = await pingHttp(subnet.check.url);
    }
  } else if (subnet.check.type === "tcp") {
    if (!subnet.check.host || !subnet.check.port) {
      result = { ok: false, detail: "TCP check host or port is missing in configuration" };
    } else {
      result = await pingTcp(subnet.check.host, subnet.check.port);
    }
  } else if (subnet.check.type === "demo") {
    result = createDemoCheck(subnet);
  } else {
    result = { ok: false, detail: `Unsupported check type: ${subnet.check.type}` };
  }

  return {
    subnetId: subnet.id,
    name: subnet.name,
    configured: true,
    checkType: subnet.check.type,
    checkedAt: new Date().toISOString(),
    ...result
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subnet = getSubnetById(body.subnetId);

    if (!subnet) {
      return NextResponse.json({ error: "Subnet not found" }, { status: 404 });
    }

    const result = await runCheck(subnet);
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
