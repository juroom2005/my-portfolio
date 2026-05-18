"use client";

import { useMemo, useState } from "react";
import { PALETTE_ITEMS } from "./data";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () =>
      query
        ? PALETTE_ITEMS.filter((it) => (it.k + it.s).toLowerCase().includes(query.toLowerCase()))
        : PALETTE_ITEMS,
    [query],
  );

  if (!open) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,10,10,0.4)",
          zIndex: 50,
          animation: "overlayIn .15s ease both",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 520,
          maxHeight: 480,
          zIndex: 51,
          background: "var(--paper)",
          border: "1.5px solid var(--ink)",
          boxShadow: "10px 12px 0 var(--ink)",
          display: "flex",
          flexDirection: "column",
          animation: "paletteIn .18s cubic-bezier(.2,.7,.3,1) both",
        }}
      >
        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--ink)", display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="font-mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              fontWeight: 700,
              padding: "2px 6px",
              background: "var(--neon)",
              border: "1px solid var(--ink)",
            }}
          >
            ⌘K
          </span>
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어디로 갈까요? · type to search…"
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15 }}
          />
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.5 }}>
            ESC TO CLOSE
          </span>
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: 6 }}>
          {filtered.length === 0 ? (
            <div className="font-mono" style={{ padding: 20, fontSize: 11, opacity: 0.5, textAlign: "center" }}>
              결과 없음.
            </div>
          ) : (
            filtered.map((it) => (
              <div
                key={it.s}
                onClick={onClose}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--neon-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 10px", cursor: "pointer", transition: "background .1s" }}
              >
                <span
                  className="font-mono"
                  style={{
                    width: 30,
                    height: 30,
                    border: "1px solid var(--ink)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {it.icon}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{it.k}</div>
                  <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.55 }}>
                    {it.s}
                  </div>
                </div>
                <span style={{ opacity: 0.4 }}>→</span>
              </div>
            ))
          )}
        </div>

        <div
          className="font-mono"
          style={{ padding: "8px 14px", borderTop: "1px solid var(--ink)", display: "flex", justifyContent: "space-between" }}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>{filtered.length} RESULTS</span>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>↑↓ MOVE · ⏎ OPEN</span>
        </div>
      </div>
    </>
  );
}
