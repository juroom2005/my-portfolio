"use client";

import { useMemo, useState } from "react";
import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  journalCount: number;
};

type HeatCell = { intensity: number; date: string; count: number };

export default function JournalCell({ hover, setHover, journalCount }: Props) {
  const [tip, setTip] = useState<HeatCell | null>(null);

  const cells = useMemo<HeatCell[]>(() => {
    const today = new Date();
    return Array.from({ length: 70 }).map((_, i) => {
      const seed = (i * 17 + 3) % 5;
      const d = new Date(today);
      d.setDate(today.getDate() - (69 - i));
      return {
        intensity: seed,
        date: d.toISOString().slice(0, 10),
        count: seed === 0 ? 0 : seed,
      };
    });
  }, []);

  const bgFor = (n: number) =>
    n === 0 ? "rgba(0,0,0,0.06)" :
    n === 1 ? "var(--neon-soft)" :
    n === 2 ? "var(--neon)" :
    n === 3 ? "var(--neon-deep)" :
              "var(--ink)";

  return (
    <Cell id="journal" hover={hover} setHover={setHover} style={{ gridColumn: "span 3", gridRow: "span 2" }}>
      <CellHead idx="03" name="JOURNAL · 일기" count={journalCount} suffix=" DAYS" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 14 }}>
        <div
          className="font-display"
          style={{ fontSize: 66, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.04em" }}
        >
          일기
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 2 }}>
          {cells.map((c, i) => (
            <div
              key={i}
              onMouseEnter={() => setTip(c)}
              onMouseLeave={() => setTip(null)}
              style={{
                aspectRatio: "1 / 1",
                background: bgFor(c.intensity),
                border: "0.5px solid rgba(0,0,0,0.08)",
                transition: "transform .12s",
                transform: tip === c ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <div style={{ height: 24, display: "flex", alignItems: "center" }}>
          {tip ? (
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em" }}>
              <span style={{ opacity: 0.6 }}>{tip.date}</span>
              &nbsp; · &nbsp;
              {tip.count === 0 ? "비어있음" : `${tip.count}개의 기록`}
            </div>
          ) : (
            <div
              className="font-mono"
              style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.5, display: "flex", gap: 4, alignItems: "center" }}
            >
              LESS
              <span style={{ width: 9, height: 9, background: "rgba(0,0,0,0.06)", border: "0.5px solid rgba(0,0,0,0.1)" }} />
              <span style={{ width: 9, height: 9, background: "var(--neon-soft)" }} />
              <span style={{ width: 9, height: 9, background: "var(--neon)" }} />
              <span style={{ width: 9, height: 9, background: "var(--neon-deep)" }} />
              <span style={{ width: 9, height: 9, background: "var(--ink)" }} />
              MORE
            </div>
          )}
        </div>

        <div
          className="font-mono"
          style={{
            fontSize: 11, lineHeight: 1.5,
            borderLeft: "2px solid var(--neon-deep)", paddingLeft: 8, opacity: 0.85,
          }}
        >
          &ldquo;그동안 만들어 놓은 것들을 다시 보고 싶다.&rdquo; <span style={{ opacity: 0.5 }}>— 05.16</span>
        </div>
      </div>
    </Cell>
  );
}
