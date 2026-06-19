"use client";

// src/components/drawings/oc/OCBroadcastPage.tsx
// 전광판(broadcast) OC select screen. Reached from the 그림 branch popup → /drawings/oc.
// OCs are laid out as vertical standing panels (LED dot-matrix names, full-body
// silhouettes, neon rails). The active panel expands; click → character dossier.
// Fills the viewport responsively; CRT overlay on top.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ROSTER, RARITY_N } from "./ocData";
import FullBody from "./FullBody";
import CRTLayer from "./CRTLayer";
import DiamondCursor from "../../landing/DiamondCursor";

export default function OCBroadcastPage() {
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 });
  const router = useRouter();
  const [sel, setSel] = useState(0);
  const [now, setNow] = useState("");
  const [transitioning, setTransitioning] = useState<"none" | "back">("none");

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setNow(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
          d.getSeconds()
        ).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
  const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
  window.addEventListener("mousemove", onMove);
  return () => window.removeEventListener("mousemove", onMove);
}, []);

  // keyboard nav: ← → to move, Enter to open, Esc to go back
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setSel((s) => Math.min(ROSTER.length - 1, s + 1));
      else if (e.key === "ArrowLeft") setSel((s) => Math.max(0, s - 1));
      else if (e.key === "Enter") open(ROSTER[sel]);
      else if (e.key === "Escape") goBack();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const open = (c: (typeof ROSTER)[number]) => {
    if (c.locked) return;
    router.push(`/drawings/oc/${c.id}`);
  };

  const goBack = () => {
    setTransitioning("back");
    setTimeout(() => router.push("/"), 200);
  };

  const cur = ROSTER[sel];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#050604",
        color: "#EDEBE2",
        overflow: "hidden",
        fontFamily: "var(--font-sans)",
        cursor:"none",
        animation: "slideInFromRight .4s cubic-bezier(.6,.0,.2,1) both",
      }}
    >
      <DiamondCursor x={mouse.x} y={mouse.y} />
      {/* dot-matrix faint backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(rgba(180,255,58,0.10) 0.8px, transparent 1px)",
          backgroundSize: "7px 7px",
          opacity: 0.5,
        }}
      />

      {/* TOP STATUS BOARD */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 54,
          zIndex: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 26px",
          borderBottom: "1px solid rgba(180,255,58,0.35)",
          background: "rgba(5,8,4,0.85)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14,  }}>
        <button
          type="button"
          onClick={goBack}
          className="font-mono"
          style={{
            border: "1px solid rgba(180,255,58,0.5)",
            background: "transparent",
            color: "var(--neon)",
            padding: "4px 10px",
            fontSize: 10,
            letterSpacing: "0.25em",
            fontWeight: 700,
            cursor: "none",
            textShadow: "0 0 6px rgba(180,255,58,0.5)",
            transition: "all .15s",
            
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--neon)";
            e.currentTarget.style.color = "#050604";
            e.currentTarget.style.textShadow = "none";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--neon)";
            e.currentTarget.style.textShadow = "0 0 6px rgba(180,255,58,0.5)";
          }}
        >
          ← INDEX
        </button>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            fontWeight: 700,
            color: "var(--neon)",
            textShadow: "0 0 10px rgba(180,255,58,0.7)",
          }}
        >
          ● OC BROADCAST · 등록 캐릭터 전광판
        </div>
      </div>
        <div className="font-mono" style={{ display: "flex", gap: 18, fontSize: 11, letterSpacing: "0.22em", opacity: 0.8 }}>
          <span>NOW SHOWING · {ROSTER.length} CHANNELS</span>
          <span style={{ color: "var(--neon)" }}>{now}</span>
        </div>
      </div>

      {/* PANEL ROW */}
      <div
        style={{
          position: "absolute",
          top: 54,
          left: 0,
          right: 0,
          bottom: 46,
          display: "flex",
          gap: 2,
          padding: "0 14px",
          background: "#050604",
        }}
      >
        {ROSTER.map((c, i) => {
          const active = i === sel;
          return (
            <button
              key={c.id}
              onClick={() => (active ? open(c) : setSel(i))}
              onMouseEnter={() => setSel(i)}
              style={{
                flex: active ? 1.5 : 1,
                position: "relative",
                overflow: "hidden",
                cursor: "none",
                border: "none",
                padding: 0,
                transition: "flex .45s cubic-bezier(.5,0,.1,1)",
                background: `linear-gradient(180deg, ${c.tone} 0%, #050604 78%)`,
                borderLeft: i ? "1px solid rgba(180,255,58,0.18)" : "none",
              }}
            >
              {/* neon side rail */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: 3,
                  background: active ? c.accent : "transparent",
                  boxShadow: active ? `0 0 16px ${c.accent}` : "none",
                  transition: "all .4s",
                }}
              />
              {/* glow halo behind body when active */}
              {active && (
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "30%",
                    width: "90%",
                    height: "60%",
                    transform: "translateX(-50%)",
                    background: `radial-gradient(circle, ${c.accent}33, transparent 68%)`,
                  }}
                />
              )}

              {/* name (top) */}
              <div style={{ position: "absolute", top: 18, left: 0, right: 0, textAlign: "center", zIndex: 5 }}>
                <div
                  className="font-display"
                  style={{
                    fontWeight: 900,
                    fontSize: active ? 54 : 40,
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                    color: active ? c.accent : "rgba(237,235,226,0.55)",
                    textShadow: active ? `0 0 18px ${c.accent}99` : "none",
                    transition: "all .4s",
                  }}
                >
                  {c.kor}
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: active ? 12 : 10,
                    letterSpacing: "0.4em",
                    marginTop: 6,
                    fontWeight: 700,
                    color: active ? "var(--neon)" : "rgba(237,235,226,0.4)",
                    paddingLeft: "0.4em",
                  }}
                >
                  {c.en}
                </div>
              </div>

              {/* full body */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 46,
                  top: 120,
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                }}
              >
                <FullBody accent={c.accent} locked={c.locked} dim={!active} height="100%" />
              </div>

              {/* channel no badge */}
              <div
                className="font-mono"
                style={{
                  position: "absolute",
                  top: 14,
                  left: 14,
                  fontSize: 11,
                  letterSpacing: "0.2em",
                  fontWeight: 700,
                  color: active ? c.accent : "rgba(237,235,226,0.35)",
                }}
              >
                CH·{c.no}
              </div>
              {/* rarity */}
              <div style={{ position: "absolute", top: 16, right: 14, display: "flex", gap: 3 }}>
                {Array.from({ length: 4 }).map((_, k) => (
                  <span
                    key={k}
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background:
                        k < RARITY_N[c.rarity]
                          ? active
                            ? c.accent
                            : "rgba(237,235,226,0.4)"
                          : "rgba(255,255,255,0.08)",
                    }}
                  />
                ))}
              </div>

              {/* bottom plate */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 40,
                  background: active ? c.accent : "rgba(255,255,255,0.04)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 14px",
                  transition: "all .4s",
                }}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    fontWeight: 700,
                    color: active ? "#050604" : "rgba(237,235,226,0.5)",
                  }}
                >
                  {c.role}
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    color: active ? "#050604" : "rgba(237,235,226,0.35)",
                  }}
                >
                  {active ? "ENTER ▸" : c.rarity}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* BOTTOM MARQUEE */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 46,
          zIndex: 30,
          background: "#0A0C07",
          borderTop: "1px solid rgba(180,255,58,0.35)",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <span
          className="font-mono"
          style={{
            flex: "0 0 auto",
            background: "var(--neon)",
            color: "#050604",
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            fontSize: 11,
            letterSpacing: "0.24em",
            fontWeight: 700,
          }}
        >
          SELECTED ▸
        </span>
        <div style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap", paddingLeft: 18 }}>
          <span
            className="font-mono"
            style={{ fontSize: 12, letterSpacing: "0.3em", color: "var(--neon)", textShadow: "0 0 8px rgba(180,255,58,0.5)" }}
          >
            {`${cur.kor} / ${cur.en} · ${cur.roleKo} · “${cur.tag}” · ${cur.affil} ········· `.repeat(3)}
          </span>
        </div>
      </div>
      
      {transitioning === "back" && (
      <div
        style={{
            position: "fixed",
            inset: 0,
            background: "var(--paper)",
            zIndex: 80,
            animation: "slideInFromLeft .2s cubic-bezier(.6,.0,.2,1) forwards",
            pointerEvents: "none",
          }}
        />
      )}

    <CRTLayer band curve strength={1} />
    </div>
  );
}
