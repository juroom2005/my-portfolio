"use client";

import type { Drawing } from "./drawingsData";

type Props = {
  d: Drawing;
  small?: boolean;
};

/**
 * Tiny abstract "drawing" — solid bg + minimal compositional shape per medium.
 * Just enough variation that the grid reads as different artworks, not swatches.
 * Replace with a real <Image src={d.url} ... /> when real artwork URLs land.
 */
export default function Thumb({ d, small }: Props) {
  const isDark = parseInt(d.bg.slice(1, 3), 16) < 80;
  const ink = isDark ? "#FAFAF7" : "#0A0A0A";

  // composition variant — picked by id so it's stable
  const variant = parseInt(d.id.slice(1), 36) % 6;
  const seed = parseInt(d.id.slice(1), 36);

  return (
    <div style={{ position: "absolute", inset: 0, background: d.bg, overflow: "hidden" }}>
      {variant === 0 && (
        <div
          style={{
            position: "absolute",
            left: "18%",
            top: "22%",
            width: "40%",
            aspectRatio: "1",
            borderRadius: "50%",
            background: d.accent,
            opacity: 0.85,
          }}
        />
      )}
      {variant === 1 && (
        <>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: "30%", height: 2, background: ink, opacity: 0.4 }} />
          <div style={{ position: "absolute", left: "35%", bottom: "30%", width: "18%", aspectRatio: "1/2.6", background: d.accent }} />
        </>
      )}
      {variant === 2 && (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={`M 10 ${60 + (seed % 20)} Q 50 ${20 + (seed % 30)}, 90 ${50 + (seed % 25)}`}
            stroke={ink}
            strokeWidth="2"
            fill="none"
            opacity="0.7"
          />
        </svg>
      )}
      {variant === 3 && (
        <>
          <div style={{ position: "absolute", left: "20%", top: "20%", width: "60%", height: "60%", border: `1.5px solid ${ink}`, opacity: 0.5 }} />
          <div style={{ position: "absolute", left: "30%", top: "30%", width: "25%", height: "25%", background: d.accent }} />
        </>
      )}
      {variant === 4 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `radial-gradient(${ink} 0.8px, transparent 1.2px)`,
            backgroundSize: "6px 6px",
            opacity: 0.35,
          }}
        />
      )}
      {variant === 5 && (
        <>
          <div style={{ position: "absolute", left: 0, bottom: 0, width: "60%", height: "45%", background: d.accent, opacity: 0.7 }} />
          <div style={{ position: "absolute", right: 0, top: 0, width: "45%", height: "55%", background: ink, opacity: 0.2 }} />
        </>
      )}
      {!small && (
        <>
          <div
            className="font-mono"
            style={{ position: "absolute", top: 6, left: 6, fontSize: 8, color: ink, opacity: 0.7, letterSpacing: "0.15em" }}
          >
            {String(d.idx).padStart(3, "0")}
          </div>
          <div
            className="font-mono"
            style={{ position: "absolute", bottom: 6, right: 6, fontSize: 8, color: ink, opacity: 0.6, letterSpacing: "0.15em" }}
          >
            {d.medium.toUpperCase()}
          </div>
        </>
      )}
    </div>
  );
}
