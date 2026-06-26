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
function tokensToSvgCoords(history: number[]): { polyline: string; dot: { x: number; y: number } | null } {
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
    <div
      style={{
        position: "relative",
        width: "100%",
        borderRadius: 28,
        background: "linear-gradient(90deg, #2ECC71, #6C63FF)",
        padding: "1.5px",
        boxShadow:
          "-8px 0 18px 2px rgba(46,204,113,0.4), 8px 0 18px 2px rgba(108,99,255,0.4)",
      }}
    >
      <div
        style={{
          borderRadius: 26.5,
          backgroundColor: "#0B0B10",
          overflow: "hidden",
          position: "relative",
          padding: "28px 28px",
          display: "flex",
          alignItems: "center",
          gap: 0,
        }}
      >
        {/* ====== ZONE 1: BRAND / IDENTITY ====== */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            flex: "1.3",
            minWidth: 200,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              flexShrink: 0,
              position: "relative",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="100%" height="100%">
              <defs>
                <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <style>
                {`
                .orbit {
                  animation: spin 20s linear infinite;
                  transform-origin: 60px 60px;
                }
                @keyframes spin {
                  100% { transform: rotate(360deg); }
                }
                `}
              </style>
              <g className="orbit">
                <circle cx="60" cy="60" r="48" fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />
                <path d="M 25.36 40 A 40 40 0 1 1 20 60" fill="none" stroke="#475569" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.4" />
                <path d="M 60 100 A 40 40 0 1 1 100 60" fill="none" stroke="#00E676" strokeWidth="3" filter="url(#neonGlow)" />
                <path d="M 100 60 A 40 40 0 1 1 25.36 40" fill="none" stroke="#00E5FF" strokeWidth="3" filter="url(#neonGlow)" />
                <path d="M 25.36 40 A 40 40 0 1 1 60 100" fill="none" stroke="#D500F9" strokeWidth="3" filter="url(#neonGlow)" />
                <circle cx="60" cy="100" r="5" fill="#00E676" filter="url(#neonGlow)" />
                <circle cx="60" cy="100" r="1.5" fill="#ffffff" />
                <circle cx="100" cy="60" r="5" fill="#00E5FF" filter="url(#neonGlow)" />
                <circle cx="100" cy="60" r="1.5" fill="#ffffff" />
                <circle cx="25.36" cy="40" r="5" fill="#D500F9" filter="url(#neonGlow)" />
                <circle cx="25.36" cy="40" r="1.5" fill="#ffffff" />
              </g>
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h3
              style={{
                fontSize: 24,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#F5F5F7",
                margin: 0,
                lineHeight: 1.1,
                fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              }}
            >
              NEXUS
            </h3>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.45,
                color: "#9CA3AF",
                maxWidth: 220,
                margin: 0,
                fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              }}
            >
              Persistent context layer that compresses, updates, and maintains important conversation context.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.1)",
            margin: "0 8px",
            alignSelf: "center",
            flexShrink: 0,
          }}
        />

        {/* ====== ZONE 2: CONTEXT STATUS ====== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            flex: 1,
            minWidth: 140,
            position: "relative",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#9CA3AF",
                fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              }}
            >
              CONTEXT STATUS
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: hasRealData ? "#34D399" : "#6B7280",
                fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: hasRealData ? "#34D399" : "#6B7280",
                  boxShadow: hasRealData ? "0 0 7px rgba(52,211,153,0.6)" : "none",
                  display: "inline-block",
                }}
              />
              {hasRealData ? "ACTIVE" : "IDLE"}
            </span>
          </div>

          <div
            style={{
              height: 6,
              width: "100%",
              maxWidth: 160,
              borderRadius: 9999,
              backgroundColor: "#2A2E3A",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 9999,
                backgroundColor: hasRealData ? "#34D399" : "#4B5563",
                width: `${fillPct}%`,
                transition: "width 0.5s",
              }}
            />
          </div>

          <div
            style={{
              fontSize: 14,
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            <span style={{ fontWeight: 700, color: hasRealData ? "#34D399" : "#9CA3AF" }}>{sizeLabel}</span>
            <span style={{ color: "#9CA3AF" }}> / </span>
            <span style={{ color: "#9CA3AF" }}>{limitLabel}</span>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.1)",
            margin: "0 8px",
            alignSelf: "center",
            flexShrink: 0,
          }}
        />

        {/* ====== ZONE 3: CONTEXT HEALTH ====== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
            minWidth: 140,
            position: "relative",
            zIndex: 1,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9CA3AF",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
            }}
          >
            CONTEXT HEALTH
          </span>

          <svg
            viewBox="0 0 120 20"
            style={{ width: "100%", maxWidth: 150, height: 30, marginTop: 2 }}
          >
            <defs>
              <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
              </linearGradient>
              <filter id="sparkGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#34D399" floodOpacity="0.5" />
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
                  stroke="#34D399"
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
                stroke="#34D399"
                strokeWidth="1.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
            )}
            {!sparklineCoords.dot && !sparklineCoords.polyline && (
              <text x="60" y="12" textAnchor="middle" fill="#4B5563" fontSize="9">
                no data yet
              </text>
            )}
          </svg>

          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              color: hasRealData ? "#34D399" : "#9CA3AF",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {hasRealData ? `${fillPct}% FULL` : "--% FULL"}
          </span>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.1)",
            margin: "0 8px",
            alignSelf: "center",
            flexShrink: 0,
          }}
        />

        {/* ====== ZONE 4: LAST UPDATED ====== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
            minWidth: 140,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#9CA3AF",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
            }}
          >
            LAST UPDATED
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#E5E7EB",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {lastUpdatedStr}
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {lastSummarizedAt ? "Last summary compression" : "No summarization has run yet"}
          </span>
        </div>

        {/* ====== RIGHT SIDE DECORATIVE SPHERE GRAPHIC ====== */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: -20,
            bottom: -20,
            width: 240,
            pointerEvents: "none",
            zIndex: 0,
          }}
        >
          <svg
            viewBox="0 0 200 200"
            style={{ width: "100%", height: "100%", overflow: "visible" }}
          >
            <defs>
              <linearGradient id="globeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2ECC71" stopOpacity="1" />
                <stop offset="50%" stopColor="#5EEAD4" stopOpacity="1" />
                <stop offset="100%" stopColor="#6C63FF" stopOpacity="1" />
              </linearGradient>
            </defs>
            <ellipse cx="100" cy="100" rx="95" ry="12" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 10" strokeLinecap="round" opacity="0.8" />
            <ellipse cx="100" cy="100" rx="85" ry="28" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 12" strokeLinecap="round" opacity="0.7" />
            <ellipse cx="100" cy="100" rx="70" ry="40" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 14" strokeLinecap="round" opacity="0.6" />
            <ellipse cx="100" cy="100" rx="50" ry="50" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 16" strokeLinecap="round" opacity="0.5" />
            <ellipse cx="100" cy="100" rx="28" ry="68" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 14" strokeLinecap="round" opacity="0.7" />
            <ellipse cx="100" cy="100" rx="12" ry="80" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 12" strokeLinecap="round" opacity="0.8" />
            <ellipse cx="100" cy="100" rx="95" ry="95" fill="none" stroke="url(#globeGrad)" strokeWidth="1.8" strokeDasharray="0 15" strokeLinecap="round" opacity="0.55" transform="rotate(30 100 100)" />
            <ellipse cx="100" cy="100" rx="95" ry="95" fill="none" stroke="url(#globeGrad)" strokeWidth="1.8" strokeDasharray="0 15" strokeLinecap="round" opacity="0.55" transform="rotate(90 100 100)" />
            <ellipse cx="100" cy="100" rx="95" ry="95" fill="none" stroke="url(#globeGrad)" strokeWidth="1.8" strokeDasharray="0 15" strokeLinecap="round" opacity="0.55" transform="rotate(150 100 100)" />
            <circle cx="30" cy="30" r="1.5" fill="#2ECC71" opacity="0.7" />
            <circle cx="170" cy="40" r="1" fill="#5EEAD4" opacity="0.6" />
            <circle cx="160" cy="160" r="2" fill="#6C63FF" opacity="0.5" />
            <circle cx="40" cy="180" r="1.5" fill="#8B7CF6" opacity="0.6" />
            <circle cx="20" cy="100" r="1" fill="#2ECC71" opacity="0.5" />
            <circle cx="180" cy="120" r="1.5" fill="#34D399" opacity="0.7" />
            <circle cx="90" cy="20" r="1" fill="#6C63FF" opacity="0.4" />
            <circle cx="110" cy="190" r="2" fill="#2ECC71" opacity="0.6" />
            <circle cx="50" cy="70" r="1.5" fill="#5EEAD4" opacity="0.5" />
            <circle cx="150" cy="50" r="1" fill="#6C63FF" opacity="0.55" />
            <circle cx="140" cy="140" r="1.5" fill="#8B7CF6" opacity="0.6" />
            <circle cx="70" cy="150" r="1" fill="#34D399" opacity="0.7" />
            <circle cx="30" cy="130" r="1.5" fill="#2ECC71" opacity="0.5" />
          </svg>
        </div>
      </div>
    </div>
  );
}
