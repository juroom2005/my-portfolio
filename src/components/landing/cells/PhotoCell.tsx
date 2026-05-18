"use client";

import { useRef, useState } from "react";
import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  photoCount: number;
};

export default function PhotoCell({ hover, setHover, photoCount }: Props) {
  const cellRef = useRef<HTMLDivElement | null>(null);
  const [local, setLocal] = useState({ x: 0.5, y: 0.5 });

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cellRef.current?.getBoundingClientRect();
    if (!r) return;
    setLocal({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };
  const onLeave = () => setLocal({ x: 0.5, y: 0.5 });

  const tx1 = (local.x - 0.5) * 30;
  const ty1 = (local.y - 0.5) * 30;
  const tx2 = (local.x - 0.5) * -20;
  const ty2 = (local.y - 0.5) * -20;

  return (
    <Cell id="photo" hover={hover} setHover={setHover} dark style={{ gridColumn: "span 4", gridRow: "span 2" }}>
      <div
        ref={cellRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{ display: "flex", flexDirection: "column", flex: 1, position: "relative" }}
      >
        <CellHead idx="02" name="PHOTOS · 사진" count={photoCount} suffix=" FRAMES" live />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", position: "relative" }}>
          <div
            style={{
              position: "absolute", top: 14, right: 0, width: 130, height: 130, borderRadius: "50%",
              background: "var(--neon)", opacity: 0.9,
              transform: `translate(${tx1}px, ${ty1}px)`,
              transition: "transform .25s cubic-bezier(.2,.7,.3,1)",
            }}
          />
          <div
            style={{
              position: "absolute", top: 56, right: 34, width: 78, height: 78, borderRadius: "50%",
              background: "var(--ink)", border: "2px solid var(--neon)",
              transform: `translate(${tx2}px, ${ty2}px)`,
              transition: "transform .25s cubic-bezier(.2,.7,.3,1)",
            }}
          />
          <div
            style={{
              position: "absolute", top: 90, right: 78, width: 14, height: 14, borderRadius: "50%",
              background: "var(--neon)",
              transform: `translate(${tx1 * 0.6}px, ${ty1 * 0.6}px)`,
              transition: "transform .25s cubic-bezier(.2,.7,.3,1)",
            }}
          />
          <div style={{ position: "relative", pointerEvents: "none" }}>
            <div
              className="font-display"
              style={{ fontSize: 80, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.05em", color: "var(--neon)" }}
            >
              사진
            </div>
            <div
              className="font-display"
              style={{ fontSize: 32, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em", color: "var(--paper)" }}
            >
              寫 · PHOTO
            </div>
          </div>
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 10, letterSpacing: "0.2em", opacity: 0.8, marginTop: 8,
            borderTop: "1px solid var(--neon)", paddingTop: 8,
            display: "flex", justifyContent: "space-between",
          }}
        >
          <span>ROLL #{photoCount}</span>
          <span style={{ color: "var(--neon)" }}>+12 THIS WEEK ↑</span>
        </div>
      </div>
    </Cell>
  );
}
