"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Branch popup that appears when 그림 cell is clicked on the landing.
 * Two stacked options: 포트폴리오 (→ /drawings) and OC 목록 (→ /drawings/oc).
 * Stylistically matches CommandPalette — boxy, neon, hard-shadow.
 */
export default function DrawingsBranchPopup({ open, onClose }: Props) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const go = (path: string) => {
    setTransitioning(true);
    setTimeout(() => {
      router.push(path);
    }, 350);
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,10,10,0.55)",
          zIndex: 60,
          animation: transitioning ? "none" : "overlayIn .15s ease both",
          cursor: "none",
          opacity: transitioning ? 0 : 1,
          transition: "opacity .28s ease",
        }}
      />
      {transitioning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--paper)",
            zIndex: 70,
            animation: "slideInFromRight .35s cubic-bezier(.6,.0,.2,1) forwards",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Giant ghost 그림 behind */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 61,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          opacity: transitioning ? 0 : 1,
          transition: "opacity .28s ease",
          }}
        >
        <div
          className="font-display"
          style={{
            fontSize: 240,
            fontWeight: 900,
            color: "rgba(255,255,255,0.06)",
            letterSpacing: "-0.05em",
            lineHeight: 1,
          }}
        >
          그림
        </div>
      </div>

      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 520,
          zIndex: 62,
          background: "var(--paper)",
          border: "1.5px solid var(--ink)",
          boxShadow: "12px 14px 0 var(--ink)",
          animation: transitioning ? "none" : "paletteIn .2s cubic-bezier(.2,.7,.3,1) both",
          opacity: transitioning ? 0 : 1,
          transition: "opacity .28s ease, transform .28s ease",
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: "var(--ink)",
            color: "var(--neon)",
            padding: "10px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="font-mono" style={{ fontSize: 10, letterSpacing: "0.25em", fontWeight: 700 }}>
            01 · DRAWINGS · 그림
          </span>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}>
            SELECT DESTINATION
          </span>
        </div>

        <div style={{ padding: "20px 18px 14px" }}>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
            📓
          </div>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.22em", opacity: 0.6, marginTop: 6 }}>
            원하는 cell을 클릭시, 해당 페이지로 이동합니다.
          </div>
        </div>

        {/* Option 1 — Portfolio */}
        <button
          type="button"
          onClick={() => go("/drawings")}
          style={{
            margin: "0 18px 8px",
            width: "calc(100% - 36px)",
            border: "1.5px solid var(--ink)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "none",
            background: "var(--neon)",
            textAlign: "left",
            color: "var(--ink)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              border: "1.5px solid var(--ink)",
              background: "var(--paper)",
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gridTemplateRows: "repeat(3,1fr)",
              gap: 2,
              padding: 3,
              flexShrink: 0,
            }}
          >
            {Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                style={{ background: i % 3 === 0 ? "var(--ink)" : "rgba(0,0,0,0.18)" }}
              />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-display"
              style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em" }}
            >
              그림
            </div>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.75, marginTop: 3 }}>
              PORTFOLIO · 142 PIECES · 정식 작업물
            </div>
          </div>
          <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em" }}>
            →
          </span>
        </button>

        {/* Option 2 — OC list */}
        <button
          type="button"
          onClick={() => go("/drawings/oc")}
          style={{
            margin: "0 18px 18px",
            width: "calc(100% - 36px)",
            border: "1.5px solid var(--ink)",
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            cursor: "none",
            background: "var(--ink)",
            color: "var(--neon)",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 var(--ink)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" style={{ border: "1.5px solid var(--neon)", background: "#1A1A18", flexShrink: 0 }}>
            <ellipse cx="24" cy="20" rx="11" ry="13" fill="#B4FF3A" />
            <path d="M 6 48 Q 12 30 24 30 Q 36 30 42 48 Z" fill="#B4FF3A" />
          </svg>
          <div style={{ flex: 1 }}>
            <div
              className="font-display"
              style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.02em", color: "var(--paper)" }}
            >
              OC
            </div>
            <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.18em", opacity: 0.75, marginTop: 3 }}>
              ORIGINAL CHARACTERS · 03 ACTIVE · 창작 도감
            </div>
          </div>
          <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.15em", color: "var(--neon)" }}>
            →
          </span>
        </button>

        <div
          className="font-mono"
          style={{
            padding: "8px 14px",
            borderTop: "1px solid var(--ink)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>ESC TO CLOSE</span>
          <span style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>↑ ↓ MOVE · ⏎ SELECT</span>
        </div>
      </div>
    </>
  );
}
