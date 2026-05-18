"use client";

import { useEffect, useState } from "react";
import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  soundCount: number;
};

export default function SoundCell({ hover, setHover, soundCount }: Props) {
const [playing, setPlaying] = useState(true);
const [bars, setBars] = useState<number[]>(() =>
  Array.from({ length: 28 }, (_, i) => 30 + ((i * 37) % 60)), // 결정론적 초기값
);

useEffect(() => {
  // 마운트 후 첫 랜덤 채움 (SSR-safe)
  setBars(Array.from({ length: 28 }, () => 20 + Math.random() * 75));

  if (!playing) return;
  const t = window.setInterval(() => {
    setBars((prev) => prev.map(() => 20 + Math.random() * 75));
  }, 140);
  return () => window.clearInterval(t);
}, [playing]);

  return (
    <Cell id="sound" hover={hover} setHover={setHover} noHover style={{ gridColumn: "span 5", gridRow: "span 1" }}>
      <CellHead idx="05" name="SOUND · 음악" count={soundCount} suffix=" TRACKS" live />
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flex: 1 }}>
        <div
          className="font-display"
          style={{ fontSize: 50, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.04em" }}
        >
          음악
        </div>
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 2, height: 48, marginBottom: 6 }}>
          {bars.map((h, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: `${h}%`,
                background: i % 6 === 0 ? "var(--neon-deep)" : "var(--ink)",
                transition: "height .14s ease",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setPlaying((p) => !p);
          }}
          style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--neon)", border: "1.5px solid var(--ink)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 6, padding: 0, cursor: "pointer",
          }}
        >
          {playing ? (
            <div style={{ display: "flex", gap: 3 }}>
              <div style={{ width: 3, height: 11, background: "var(--ink)" }} />
              <div style={{ width: 3, height: 11, background: "var(--ink)" }} />
            </div>
          ) : (
            <div
              style={{
                width: 0, height: 0,
                borderLeft: "9px solid var(--ink)",
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                marginLeft: 2,
              }}
            />
          )}
        </button>
      </div>
    </Cell>
  );
}
