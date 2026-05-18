"use client";

import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  drawCount: number;
};

function Mosaic() {
  return (
    <div
      style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gridTemplateRows: "repeat(3,1fr)",
        gap: 4,
        height: 160,
        marginBottom: 12,
      }}
    >
      {Array.from({ length: 9 }).map((_, i) => {
        const base = i % 4 === 0 ? "var(--ink)" : "rgba(0,0,0,0.10)";
        return (
          <div
            key={i}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ink)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = base)}
            style={{ background: base, border: "1px solid var(--ink)", transition: "background .25s" }}
          />
        );
      })}
    </div>
  );
}

export default function DrawCell({ hover, setHover, drawCount }: Props) {
  return (
    <Cell id="draw" hover={hover} setHover={setHover} neon style={{ gridColumn: "span 5", gridRow: "span 2" }}>
      <CellHead idx="01" name="DRAWINGS · 그림" count={drawCount} suffix=" PIECES" live />
      <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: 24 }}>
        <div>
          <div
            className="font-display"
            style={{ fontSize: 140, fontWeight: 900, lineHeight: 0.82, letterSpacing: "-0.06em" }}
          >
            그림
          </div>
          <div className="font-mono" style={{ fontSize: 11, letterSpacing: "0.25em", marginTop: 4 }}>
            OIL · INK · DIGITAL · MIXED
          </div>
        </div>
        <Mosaic />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 8,
          borderTop: "1px solid var(--ink)",
          paddingTop: 8,
        }}
      >
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5 }}>
          NO PIECES YET · 첫 그림 업로드 대기 중
        </span>
        <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.5 }}>
          ─
        </span>
      </div>
    </Cell>
  );
}