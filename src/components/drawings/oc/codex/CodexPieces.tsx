// src/components/drawings/oc/codex/CodexPieces.tsx
// Shared presentational atoms for the codex: portrait silhouette, stat meter,
// blueprint frame, and the light CRT overlay. Swap CodexPortrait for a real
// illustration later (keep the bottom-aligned bounding box).

import { Fragment } from "react";
import type { OCChar } from "./ocCodexData";

export function CodexPortrait({ oc }: { oc: OCChar }) {
  return (
    <svg viewBox="0 0 320 460" width="100%" height="100%" preserveAspectRatio="xMidYMax meet" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`coat-${oc.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={oc.ink} />
          <stop offset="1" stopColor={oc.ink} stopOpacity="0.82" />
        </linearGradient>
      </defs>
      <path d="M 96 150 C 96 120 130 104 160 104 C 190 104 224 120 224 150 L 244 300 C 250 340 250 400 244 460 L 76 460 C 70 400 70 340 76 300 Z" fill={`url(#coat-${oc.id})`} />
      <ellipse cx="160" cy="86" rx="46" ry="52" fill={oc.ink} />
      <path d="M 160 38 C 196 38 214 70 210 104 C 206 96 196 92 186 96 C 184 70 174 58 160 58 C 146 58 136 70 134 96 C 124 92 114 96 110 104 C 106 70 124 38 160 38 Z" fill={oc.ink} />
      <path d="M 160 138 L 160 440" stroke={oc.accent} strokeWidth="2.5" opacity="0.9" />
      <path d="M 120 196 L 200 196 M 116 244 L 204 244" stroke={oc.accent} strokeWidth="1.4" opacity="0.55" />
      <circle cx="146" cy="86" r="3" fill={oc.accent} />
      <circle cx="174" cy="86" r="3" fill={oc.accent} />
      {oc.locked && (
        <g>
          <rect x="0" y="0" width="320" height="460" fill="rgba(14,15,13,0.86)" />
          <text x="160" y="240" textAnchor="middle" fill={oc.accent} fontSize="64" fontFamily="Instrument Serif" fontStyle="italic">?</text>
        </g>
      )}
      {oc.addSlot && (
        <g>
          <rect x="0" y="0" width="320" height="460" fill="rgba(242,239,228,0.9)" />
          <line x1="160" y1="200" x2="160" y2="260" stroke={oc.ink} strokeWidth="3" />
          <line x1="130" y1="230" x2="190" y2="230" stroke={oc.ink} strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}

export function StatMeter({ label, value, accent, segments = 14, big = false }: { label: string; value: number; accent: string; segments?: number; big?: boolean }) {
  const filled = Math.round((value / 100) * segments);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: big ? 7 : 6 }}>
        <span className="occ-grotesk" style={{ fontSize: big ? 12 : 11, fontWeight: 600, color: "rgba(237,235,226,0.74)", whiteSpace: "nowrap" }}>{label}</span>
        <span className="occ-mono" style={{ fontSize: big ? 13 : 11, fontWeight: 700, color: accent, fontVariantNumeric: "tabular-nums" }}>{String(value).padStart(2, "0")}</span>
      </div>
      <div style={{ display: "flex", gap: 2, height: big ? 9 : 7 }}>
        {Array.from({ length: segments }).map((_, i) => {
          const on = i < filled;
          return <span key={i} style={{ flex: 1, background: on ? accent : "rgba(237,235,226,0.10)", opacity: on ? 0.4 + 0.6 * (i / Math.max(1, segments - 1)) : 1 }} />;
        })}
      </div>
    </div>
  );
}

export function BlueprintFrame({ accent }: { accent: string }) {
  const corners = [
    { top: 8, left: 8, bt: true, bl: true },
    { top: 8, right: 8, bt: true, br: true },
    { bottom: 8, left: 8, bb: true, bl: true },
    { bottom: 8, right: 8, bb: true, br: true },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 40 }}>
      <div style={{ position: "absolute", inset: 12, border: `1px solid ${accent}`, opacity: 0.13 }} />
      {corners.map((c, i) => (
        <span key={i} style={{ position: "absolute", width: 20, height: 20, opacity: 0.62, top: c.top, left: c.left, right: c.right, bottom: c.bottom, borderTop: c.bt ? `1.5px solid ${accent}` : "none", borderBottom: c.bb ? `1.5px solid ${accent}` : "none", borderLeft: c.bl ? `1.5px solid ${accent}` : "none", borderRight: c.br ? `1.5px solid ${accent}` : "none" }} />
      ))}
    </div>
  );
}

// Light CRT overlay (옅게) — fixed over the viewport, pointer-events: none.
// Uses crtFlicker / crtScan keyframes already in globals.css.
export function CRTCodex() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0 1px, transparent 1px 3px)" }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, background: "repeating-linear-gradient(90deg, rgba(255,0,40,1) 0 1px, rgba(0,255,90,1) 1px 2px, rgba(40,80,255,1) 2px 3px)" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 110% at 50% 48%, transparent 60%, rgba(0,0,0,0.32) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, background: "#cfe9ff", mixBlendMode: "overlay", animation: "crtFlicker 6s steps(10) infinite" }} />
      <div style={{ position: "absolute", left: 0, right: 0, height: "16%", background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.04) 50%, transparent)", animation: "crtScan 9s linear infinite" }} />
    </div>
  );
}

export { Fragment };
