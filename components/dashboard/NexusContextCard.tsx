"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SPARKLINE_POINTS = 20;

function formatTokens(chars: number): string {
  const tokens = Math.round(chars / 4);
  if (tokens >= 10000) return `${Math.round(tokens / 1000)}K`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${tokens}`;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));

  if (diffSec < 5) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

/**
 * Convert token-count history to SVG coordinates.
 * Returns polyline points string for 2+ points, or a single dot coordinate for 1.
 * Auto-scales Y axis to data range. More tokens → higher Y.
 */
function tokensToSvgCoords(history: number[]): {
  polyline: string;
  dot: { x: number; y: number } | null;
} {
  if (history.length === 0) return { polyline: "", dot: null };

  const maxX = 112;
  const maxY = 18;
  const minY = 3;
  const dataMax = Math.max(...history);
  const dataMin = Math.min(...history);
  const range = dataMax - dataMin || 1;

  const points = history.map((tokens, i) => {
    const x = Math.round((i / Math.max(history.length - 1, 1)) * maxX);
    const normalized = (tokens - dataMin) / range;
    const y = Math.round(maxY - normalized * (maxY - minY));
    return { x, y };
  });

  if (history.length === 1) {
    return { polyline: "", dot: points[0] };
  }

  return {
    polyline: points.map((p) => `${p.x},${p.y}`).join(" "),
    dot: null,
  };
}

export interface NexusContextCardProps {
  contextSizeChars?: number;
  contextLimitChars?: number;
  healthPct?: number;
  lastSummarizedAt?: string | null;
  conversationId?: string | null;
  /** Server-side sparkline history (persisted in DB, loaded on mount). */
  sparklineHistory?: number[];
}

export function NexusContextCard({
  contextSizeChars = 0,
  contextLimitChars = 0,
  healthPct = 100,
  lastSummarizedAt,
  conversationId: _conversationId,
  sparklineHistory: seedHistory,
}: NexusContextCardProps) {
  // Only render real data when we have valid metrics. During transitions
  // (conversation switch via key remount), props may briefly be zero.
  const hasRealData = contextSizeChars > 0 && contextLimitChars > 0;

  // Sparkline: seed from DB history, then accumulate live points.
  // Component remounts on conversation switch (key={conversationId}).
  const [sparklineHistory, setSparklineHistory] = useState<number[]>(() => {
    if (seedHistory && seedHistory.length > 0) return seedHistory;
    return contextSizeChars > 0 ? [Math.round(contextSizeChars / 4)] : [];
  });

  // Skip the first effect fire ONLY when mounting with pre-loaded data
  // (conversation switch via context-state). When mounting from zero (new chat),
  // we want to append the first real response immediately.
  const mountedWithData = useRef(contextSizeChars > 0);
  useEffect(() => {
    if (contextSizeChars === 0) return;
    if (mountedWithData.current) {
      // Data was already present on mount (DB-loaded). Skip this fire
      // to avoid appending a duplicate of the last persisted point.
      mountedWithData.current = false;
      return;
    }
    const currentTokens = Math.round(contextSizeChars / 4);
    setSparklineHistory((prev) => {
      if (prev.length === 0) return [currentTokens];
      if (prev[prev.length - 1] === currentTokens) return prev;
      const next = [...prev, currentTokens];
      return next.length > MAX_SPARKLINE_POINTS
        ? next.slice(next.length - MAX_SPARKLINE_POINTS)
        : next;
    });
  }, [contextSizeChars, contextLimitChars]);

  const fillPct = hasRealData
    ? Math.min(100, Math.round((contextSizeChars / contextLimitChars) * 100))
    : 0;
  const sizeLabel = formatTokens(contextSizeChars);
  const limitLabel = formatTokens(contextLimitChars);
  const sparklineCoords = tokensToSvgCoords(sparklineHistory);

  const lastUpdatedStr = lastSummarizedAt
    ? formatRelativeTime(lastSummarizedAt)
    : "No summary yet";

  return (
    <div className="relative w-full rounded-[28px] p-[1px] bg-[linear-gradient(135deg,#2ECC71,#6C63FF)] flex flex-col">
      <div className="relative w-full flex-1 h-full overflow-hidden rounded-[27px] bg-[#050A14] shadow-2xl shadow-black/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_40%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />

        <div className="relative z-10 flex w-full items-stretch justify-between gap-6 p-8">
          {/* ====== ZONE 1: BRAND / IDENTITY ====== */}
        <div className="flex w-[28%] min-w-[200px] flex-col justify-start gap-1">
          <h3 className="m-0 font-sans text-2xl font-bold leading-[1.1] tracking-[-0.03em] text-foreground">
            Nexus
          </h3>
          <p className="m-0 font-sans text-sm leading-[1.45] text-text-dim">
            Persistent context layer that compresses, updates, and maintains
            important conversation context.
          </p>
        </div>

        {/* Divider */}
        <div className="my-auto h-12 w-px shrink-0 bg-white/10" />

        {/* ====== ZONE 2: CONTEXT STATUS ====== */}
        <div className="flex min-w-[140px] flex-1 flex-col justify-start gap-2">
          <div className="flex h-5 items-center gap-2">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dim">
              CONTEXT STATUS
            </span>
            <span
              className={`flex items-center gap-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.08em] ${
                hasRealData ? "text-healthy" : "text-muted-foreground"
              }`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  hasRealData
                    ? "bg-healthy shadow-[0_0_7px_var(--color-healthy)]"
                    : "bg-muted-foreground"
                }`}
              />
              {hasRealData ? "ACTIVE" : "IDLE"}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-panel-strong">
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${
                  hasRealData ? "bg-healthy" : "bg-muted-foreground"
                }`}
                style={{ width: `${fillPct}%` }}
              />
            </div>

            <div className="font-sans text-sm leading-tight">
              <span
                className={`font-bold ${
                  hasRealData ? "text-healthy" : "text-text-dim"
                }`}
              >
                {sizeLabel}
              </span>
              <span className="text-text-dim"> / </span>
              <span className="text-text-dim">{limitLabel}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="my-auto h-12 w-px shrink-0 bg-white/10" />

        {/* ====== ZONE 3: CONTEXT HEALTH ====== */}
        <div className="flex min-w-[140px] flex-1 flex-col justify-start gap-2">
          <div className="flex h-5 items-center">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dim">
              CONTEXT HEALTH
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <svg viewBox="0 0 120 20" className="h-[30px] w-full max-w-[150px]">
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-healthy)"
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-healthy)"
                    stopOpacity="0"
                  />
                </linearGradient>
                <filter
                  id="sparkGlow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feDropShadow
                    dx="0"
                    dy="0"
                    stdDeviation="3"
                    floodColor="var(--color-healthy)"
                    floodOpacity="0.5"
                  />
                </filter>
              </defs>
              {sparklineCoords.polyline && (
                <>
                  <path
                    d={`M 0 20 L ${sparklineCoords.polyline} L 112 20 Z`}
                    fill="url(#sparkFill)"
                  />
                  <polyline
                    points={sparklineCoords.polyline}
                    fill="none"
                    stroke="var(--color-healthy)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#sparkGlow)"
                  />
                </>
              )}
              {sparklineCoords.dot && !sparklineCoords.polyline && (
                <line
                  x1="0"
                  y1={sparklineCoords.dot.y}
                  x2="112"
                  y2={sparklineCoords.dot.y}
                  stroke="var(--color-healthy)"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
              )}
              {!sparklineCoords.dot && !sparklineCoords.polyline && (
                <text
                  x="60"
                  y="12"
                  textAnchor="middle"
                  fill="var(--color-muted-foreground)"
                  fontSize="9"
                >
                  no data yet
                </text>
              )}
            </svg>

            <span
              className={`font-sans text-sm font-bold uppercase leading-tight ${
                hasRealData ? "text-healthy" : "text-text-dim"
              }`}
            >
              {hasRealData ? `${fillPct}% FULL` : "--% FULL"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="my-auto h-12 w-px shrink-0 bg-white/10" />

        {/* ====== ZONE 4: LAST UPDATED ====== */}
        <div className="flex min-w-[140px] flex-1 flex-col justify-start gap-2">
          <div className="flex h-5 items-center">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-text-dim">
              LAST UPDATED
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-sans text-sm font-medium leading-tight text-foreground">
              {lastUpdatedStr}
            </span>
            <span className="font-sans text-[13px] leading-tight text-text-dim">
              {lastSummarizedAt
                ? "Last summary compression"
                : "No summarization has run yet"}
            </span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
