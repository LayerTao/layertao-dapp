"use client";

const MOCK_CONTEXT_SIZE_KB = 1.24;
const MOCK_CONTEXT_LIMIT_KB = 32;
const MOCK_CONTEXT_HEALTH_PCT = 98;
const MOCK_LAST_UPDATED = "2s ago";

const SPARKLINE_POINTS = "0,15 8,8 16,13 24,6 32,11 40,5 48,9 56,14 64,7 72,12 80,4 88,10 96,6 104,11 112,3";

export function NexusContextCard() {
  const fillPct = Math.min(
    100,
    Math.round((MOCK_CONTEXT_SIZE_KB / MOCK_CONTEXT_LIMIT_KB) * 100)
  );

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
          padding: "28px 28px",   // reduced horizontal padding from 32px → 28px
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
            {/* --- ROTATING ORBITAL NEXUS LOGO --- */}
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

        {/* Divider – reduced margin */}
        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.1)",
            margin: "0 8px",   // was 12px → 8px
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
                color: "#34D399",
                fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "#34D399",
                  boxShadow: "0 0 7px rgba(52,211,153,0.6)",
                  display: "inline-block",
                }}
              />
              ACTIVE
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
                backgroundColor: "#34D399",
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
            <span style={{ fontWeight: 700, color: "#34D399" }}>{MOCK_CONTEXT_SIZE_KB} KB</span>
            <span style={{ color: "#9CA3AF" }}> / </span>
            <span style={{ color: "#9CA3AF" }}>{MOCK_CONTEXT_LIMIT_KB} KB</span>
          </div>
        </div>

        {/* Divider – reduced margin */}
        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.1)",
            margin: "0 8px",   // was 12px → 8px
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
            <path
              d={`M 0 20 L ${SPARKLINE_POINTS} L 112 20 Z`}
              fill="url(#sparkFill)"
            />
            <polyline
              points={SPARKLINE_POINTS}
              fill="none"
              stroke="#34D399"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#sparkGlow)"
            />
          </svg>

          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#34D399",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {MOCK_CONTEXT_HEALTH_PCT}% OPTIMAL
          </span>
        </div>

        {/* Divider – reduced margin */}
        <div
          style={{
            width: 1,
            height: 36,
            backgroundColor: "rgba(255,255,255,0.1)",
            margin: "0 8px",   // was 12px → 8px
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
            {MOCK_LAST_UPDATED}
          </span>
          <span
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              fontFamily: "Inter, Manrope, SF Pro Display, system-ui, sans-serif",
              lineHeight: 1.3,
            }}
          >
            Auto-compressing and optimizing...
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
            {/* Latitude bands (dotted ellipses) */}
            <ellipse cx="100" cy="100" rx="95" ry="12" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 10" strokeLinecap="round" opacity="0.8" />
            <ellipse cx="100" cy="100" rx="85" ry="28" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 12" strokeLinecap="round" opacity="0.7" />
            <ellipse cx="100" cy="100" rx="70" ry="40" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 14" strokeLinecap="round" opacity="0.6" />
            <ellipse cx="100" cy="100" rx="50" ry="50" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 16" strokeLinecap="round" opacity="0.5" />
            <ellipse cx="100" cy="100" rx="28" ry="68" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 14" strokeLinecap="round" opacity="0.7" />
            <ellipse cx="100" cy="100" rx="12" ry="80" fill="none" stroke="url(#globeGrad)" strokeWidth="2" strokeDasharray="0 12" strokeLinecap="round" opacity="0.8" />
            {/* Longitude bands (rotated ellipses) */}
            <ellipse cx="100" cy="100" rx="95" ry="95" fill="none" stroke="url(#globeGrad)" strokeWidth="1.8" strokeDasharray="0 15" strokeLinecap="round" opacity="0.55" transform="rotate(30 100 100)" />
            <ellipse cx="100" cy="100" rx="95" ry="95" fill="none" stroke="url(#globeGrad)" strokeWidth="1.8" strokeDasharray="0 15" strokeLinecap="round" opacity="0.55" transform="rotate(90 100 100)" />
            <ellipse cx="100" cy="100" rx="95" ry="95" fill="none" stroke="url(#globeGrad)" strokeWidth="1.8" strokeDasharray="0 15" strokeLinecap="round" opacity="0.55" transform="rotate(150 100 100)" />
            {/* Scattered ambient dots */}
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