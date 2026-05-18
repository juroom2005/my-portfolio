"use client";

import { CSSProperties, ReactNode } from "react";

type CellProps = {
  id: string;
  hover: string | null;
  setHover: (v: string | null) => void;
  children: ReactNode;
  style?: CSSProperties;
  dark?: boolean;
  neon?: boolean;
  noHover?: boolean;
  onClick?: () => void;
};

/**
 * Base cell — the bento grid building block.
 * Set `noHover` for cells whose internal animation should be the only motion
 * (e.g. Sound cell).
 */
export function Cell({
  id, hover, setHover, children, style, dark, neon, noHover, onClick,
}: CellProps) {
  const isHover = hover === id && !noHover;
  return (
    <div
      onMouseEnter={() => setHover(id)}
      onMouseLeave={() => setHover(null)}
      onClick={onClick}
      style={{
        position: "relative",
        background: dark ? "var(--ink)" : neon ? "var(--neon)" : "var(--paper)",
        color: dark ? "var(--neon)" : "var(--ink)",
        border: "1px solid var(--ink)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        transition: "transform .22s cubic-bezier(.2,.7,.3,1), box-shadow .22s",
        transform: isHover ? "translateY(-3px)" : "translateY(0)",
        boxShadow: isHover ? "0 10px 0 -3px var(--ink), 0 0 0 1px var(--ink)" : "none",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
      <div
        className="font-mono"
        style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.15em",
          display: "flex",
          alignItems: "center",
          gap: 6,
          opacity: isHover ? 1 : 0,
          transform: isHover ? "translateX(0)" : "translateX(-6px)",
          transition: "all .18s",
        }}
      >
        OPEN <span>→</span>
      </div>
    </div>
  );
}

type CellHeadProps = {
  idx: string;
  name: string;
  count: ReactNode;
  suffix?: string;
  live?: boolean;
};

export function CellHead({ idx, name, count, suffix = "", live }: CellHeadProps) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "auto" }}>
      <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.25em", fontWeight: 700 }}>
        <span style={{ opacity: 0.5 }}>NO.</span>
        {idx}
        <span style={{ margin: "0 6px", opacity: 0.4 }}>/</span>
        {name}
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.85, display: "flex", alignItems: "center", gap: 5 }}
      >
        {live && (
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "currentColor",
              animation: "pulseDot 1.4s infinite",
            }}
          />
        )}
        {count}
        {suffix}
      </div>
    </div>
  );
}
