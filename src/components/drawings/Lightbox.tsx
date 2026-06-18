"use client";

import { useEffect, useState } from "react";
import DiamondCursor from "../landing/DiamondCursor";
import type { Drawing } from "./drawingsData";
import Thumb from "./Thumb";

type Props = {
  piece: Drawing;
  index: number;
  total: number;
  onClose: () => void;
  onNav: (dir: 1 | -1) => void;
};

export default function Lightbox({ piece, index, total, onClose, onNav }: Props) {
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        background: "rgba(242,242,238,0.97)",
        display: "flex",
        flexDirection: "column",
        padding: 24,
        animation: "overlayIn .15s ease both",
      }}
    >
      <DiamondCursor x={mouse.x} y={mouse.y} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.25em", fontWeight: 700 }}>
          DRAWINGS / NO.{String(piece.idx).padStart(3, "0")} &nbsp;·&nbsp; {index}/{total}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="font-mono"
          style={{
            border: "1px solid var(--ink)",
            background: "var(--neon)",
            padding: "5px 12px",
            fontSize: 10,
            letterSpacing: "0.2em",
            fontWeight: 700,
            cursor: "none",
          }}
        >
          CLOSE ✕ &nbsp;ESC
        </button>
      </div>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, minHeight: 0 }}>
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            type="button"
            onClick={() => onNav(-1)}
            className="font-mono"
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              border: "1px solid var(--ink)",
              background: "var(--paper)",
              padding: "10px 12px",
              fontSize: 14,
              cursor: "none",
              zIndex: 2,
            }}
          >
            ←
          </button>
          <div
            style={{
              position: "relative",
              aspectRatio: `${piece.aspect}/1`,
              maxHeight: "100%",
              maxWidth: "100%",
              width: piece.aspect >= 1 ? "90%" : "auto",
              height: piece.aspect < 1 ? "90%" : "auto",
              border: "1px solid var(--ink)",
              boxShadow: "8px 10px 0 var(--ink)",
            }}
          >
            <Thumb d={piece} />
          </div>
          <button
            type="button"
            onClick={() => onNav(1)}
            className="font-mono"
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              border: "1px solid var(--ink)",
              background: "var(--paper)",
              padding: "10px 12px",
              fontSize: 14,
              cursor: "none",
              zIndex: 2,
            }}
          >
            →
          </button>
        </div>

        <aside
          style={{
            border: "1px solid var(--ink)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            background: "var(--paper)",
          }}
        >
          <div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.55, marginBottom: 4 }}>
              TITLE
            </div>
            <div className="font-display" style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}>
              {piece.title}
            </div>
          </div>
          <div className="font-mono" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 14px", fontSize: 11 }}>
            <span style={{ opacity: 0.6, letterSpacing: "0.2em" }}>NO.</span>
            <span>{String(piece.idx).padStart(3, "0")}</span>
            <span style={{ opacity: 0.6, letterSpacing: "0.2em" }}>MEDIUM</span>
            <span>{piece.medium.toUpperCase()}</span>
            <span style={{ opacity: 0.6, letterSpacing: "0.2em" }}>DATE</span>
            <span>{piece.date}</span>
            <span style={{ opacity: 0.6, letterSpacing: "0.2em" }}>ASPECT</span>
            <span>{piece.aspect.toFixed(2)} : 1</span>
            <span style={{ opacity: 0.6, letterSpacing: "0.2em" }}>PALETTE</span>
            <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ width: 14, height: 14, background: piece.bg, border: "1px solid var(--ink)" }} />
              <span style={{ width: 14, height: 14, background: piece.accent, border: "1px solid var(--ink)" }} />
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--ink)", paddingTop: 12 }}>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.55, marginBottom: 6 }}>
              NOTE
            </div>
            <div className="font-mono" style={{ fontSize: 12, lineHeight: 1.6, opacity: 0.85 }}>
              작품 캡션이 들어갈 자리. 작업 노트, 영감, 참고 자료, 다음 단계 등을 마크다운으로 정리해두면 회고하기 좋음.
            </div>
          </div>
          <div style={{ marginTop: "auto", display: "flex", gap: 6 }}>
            <button
              type="button"
              className="font-mono"
              style={{
                flex: 1,
                border: "1px solid var(--ink)",
                background: "var(--ink)",
                color: "var(--neon)",
                padding: "8px 10px",
                fontSize: 10,
                letterSpacing: "0.2em",
                fontWeight: 700,
                cursor: "none",
              }}
            >
              ★ FAVORITE
            </button>
            <button
              type="button"
              className="font-mono"
              style={{
                flex: 1,
                border: "1px solid var(--ink)",
                background: "var(--neon)",
                padding: "8px 10px",
                fontSize: 10,
                letterSpacing: "0.2em",
                fontWeight: 700,
                cursor: "none",
              }}
            >
              ✎ EDIT NOTE
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
