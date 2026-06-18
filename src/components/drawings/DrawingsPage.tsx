"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DiamondCursor from "../landing/DiamondCursor";
import { DRAWINGS, type Drawing, type Medium } from "./drawingsData";
import Thumb from "./Thumb";
import Lightbox from "./Lightbox";

type Mode = "grid" | "masonry" | "river" | "contact";
type Sort = "date" | "medium" | "title";

const ALL_MEDIUMS: Medium[] = ["oil", "ink", "digital", "mixed"];

/**
 * Drawings inner page — interactive gallery.
 * Reached from the landing's 그림 cell → "포트폴리오" option in the branch popup.
 *
 * Four view modes (Grid / Masonry / River / Contact) toggleable on the fly.
 * Density slider, medium filter chips, hover meta sidebar, click-to-zoom lightbox.
 *
 * Data is mocked — see `drawingsData.ts`. Swap with a Supabase query when ready.
 */
export default function DrawingsPage() {
  const router = useRouter();

  const [mouse, setMouse] = useState({ x: -1000, y: -1000 });
  const [mode, setMode] = useState<Mode>("grid");
  const [density, setDensity] = useState(6);
  const [filter, setFilter] = useState<Set<Medium>>(new Set(ALL_MEDIUMS));
  const [sort, setSort] = useState<Sort>("date");
  const [hover, setHover] = useState<Drawing | null>(null);
  const [open, setOpen] = useState<Drawing | null>(null);

  const leaveTimer = useRef<number | null>(null);

  const handleEnter = (d: Drawing) => {
    if (leaveTimer.current !== null) {
      window.clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHover(d);
  };

  const handleLeave = () => {
    leaveTimer.current = window.setTimeout(() => {
      setHover(null);
      leaveTimer.current = null;
    }, 120);
  };

  const filtered = useMemo(() => {
    const arr = DRAWINGS.filter((d) => filter.has(d.medium));
    arr.sort((a, b) => {
      if (sort === "date") return b.date.localeCompare(a.date);
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "medium") return a.medium.localeCompare(b.medium);
      return 0;
    });
    return arr;
  }, [filter, sort]);

  // Keyboard nav inside lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const i = filtered.findIndex((d) => d.id === open.id);
        const next = e.key === "ArrowRight" ? (i + 1) % filtered.length : (i - 1 + filtered.length) % filtered.length;
        setOpen(filtered[next]);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, filtered]);

  const toggleMedium = (m: Medium) => {
    setFilter((prev) => {
      const n = new Set(prev);
      if (n.has(m)) n.delete(m);
      else n.add(m);
      if (n.size === 0) return prev; // UX guard
      return n;
    });
  };

  const onMove = (e: React.MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
  const onLeave = () => setMouse({ x: -1000, y: -1000 });

  // === Layout renderers ===
  const renderGrid = () => (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${density},1fr)`,
        gap: 8,
        paddingRight: hover ? 280 : 0,
        transition: "padding .25s",
      }}
    >
      {filtered.map((d) => (
        <button
          key={d.id}
          type="button"
          onMouseEnter={() => handleEnter(d)}
          onMouseLeave={handleLeave}
          onClick={() => setOpen(d)}
          style={{
            position: "relative",
            aspectRatio: "1/1",
            border: "1px solid var(--ink)",
            padding: 0,
            background: "transparent",
            transform: hover?.id === d.id ? "translateY(-2px)" : "none",
            boxShadow: hover?.id === d.id ? "4px 4px 0 var(--ink)" : "none",
            transition: "transform .15s, box-shadow .15s, opacity .2s",
            opacity: hover && hover.id !== d.id ? 0.45 : 1,
            cursor: "none",
          }}
        >
          <Thumb d={d} />
        </button>
      ))}
    </div>
  );

  const renderMasonry = () => (
    <div
      style={{
        columnCount: density,
        columnGap: 8,
        paddingRight: hover ? 280 : 0,
        transition: "padding .25s",
      }}
    >
      {filtered.map((d) => (
        <button
          key={d.id}
          type="button"
          onMouseEnter={() => handleEnter(d)}
          onMouseLeave={handleLeave}
          onClick={() => setOpen(d)}
          style={{
            display: "block",
            width: "100%",
            marginBottom: 8,
            position: "relative",
            aspectRatio: `${d.aspect}/1`,
            border: "1px solid var(--ink)",
            padding: 0,
            background: "transparent",
            breakInside: "avoid",
            opacity: hover && hover.id !== d.id ? 0.45 : 1,
            transition: "opacity .2s",
            cursor: "none",
          }}
        >
          <Thumb d={d} />
        </button>
      ))}
    </div>
  );

  const renderRiver = () => (
    <div style={{ display: "flex", gap: 10, overflowX: "auto", padding: "4px 4px 12px", scrollbarWidth: "thin" }}>
      {filtered.map((d) => (
        <button
          key={d.id}
          type="button"
          onMouseEnter={() => handleEnter(d)}
          onMouseLeave={handleLeave}
          onClick={() => setOpen(d)}
          style={{
            position: "relative",
            flex: "0 0 auto",
            width: 320,
            height: 320 / d.aspect,
            border: "1px solid var(--ink)",
            padding: 0,
            background: "transparent",
            transform: hover?.id === d.id ? "translateY(-3px)" : "none",
            boxShadow: hover?.id === d.id ? "4px 6px 0 var(--ink)" : "none",
            transition: "transform .15s, box-shadow .15s",
            cursor: "none",
          }}
        >
          <Thumb d={d} />
        </button>
      ))}
    </div>
  );

  const renderContact = () => (
    <div style={{ position: "relative", padding: "14px 18px", background: "var(--ink)", border: "1px solid var(--ink)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9,1fr)", gap: 10 }}>
        {filtered.map((d, i) => (
          <button
            key={d.id}
            type="button"
            onMouseEnter={() => handleEnter(d)}
            onMouseLeave={handleLeave}
            onClick={() => setOpen(d)}
            style={{
              position: "relative",
              aspectRatio: "1/1",
              border: "1px solid #555",
              padding: 0,
              background: "transparent",
              outline: hover?.id === d.id ? "1.5px solid var(--neon)" : "none",
              outlineOffset: 2,
              transition: "outline .12s",
              cursor: "none",
            }}
          >
            <Thumb d={d} small />
            <div
              className="font-mono"
              style={{ position: "absolute", top: -12, left: 0, fontSize: 8, color: "var(--neon)", letterSpacing: "0.18em" }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <svg
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                opacity: hover?.id === d.id ? 0.7 : 0,
                transition: "opacity .12s",
                pointerEvents: "none",
              }}
              width="14"
              height="14"
              viewBox="0 0 14 14"
            >
              <path d="M7 0v14M0 7h14" stroke="#B4FF3A" strokeWidth="0.7" />
              <circle cx="7" cy="7" r="3" stroke="#B4FF3A" strokeWidth="0.7" fill="none" />
            </svg>
          </button>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 8,
          display: "flex",
          justifyContent: "space-around",
          padding: "0 8px",
        }}
      >
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} style={{ width: 6, height: 4, background: "var(--paper)", marginTop: 2 }} />
        ))}
      </div>
    </div>
  );

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        background: "var(--paper)",
        color: "var(--ink)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        cursor: "none",
      }}
    >
      <DiamondCursor x={mouse.x} y={mouse.y} />

      {/* Header / breadcrumb */}
      <header
        style={{
          borderBottom: "1px solid var(--ink)",
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          className="font-mono"
          style={{ fontSize: 10, letterSpacing: "0.25em", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}
        >
          <span style={{ opacity: 0.5 }}>INDEX·404</span>
          <span style={{ opacity: 0.4 }}>/</span>
          <span>01 · DRAWINGS</span>
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--neon-deep)",
              marginLeft: 6,
            }}
          />
          <span style={{ opacity: 0.6 }}>
            {filtered.length} / {DRAWINGS.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="font-mono"
          style={{
            border: "1px solid var(--ink)",
            background: "var(--paper)",
            padding: "4px 10px",
            fontSize: 10,
            letterSpacing: "0.2em",
            fontWeight: 700,
            cursor: "none",
          }}
        >
          ← BACK TO INDEX
        </button>
      </header>

      {/* Title row */}
      <div
        style={{
          padding: "18px 24px 14px",
          borderBottom: "1px solid var(--ink)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "end",
          gap: 24,
        }}
      >
        <div className="font-display" style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.82, letterSpacing: "-0.05em" }}>
          그림
          <span style={{ color: "var(--neon-deep)", marginLeft: 8, fontSize: 48 }}>·</span>
        </div>
        <div
          style={{
            borderLeft: "1px solid var(--ink)",
            paddingLeft: 14,
            fontSize: 11,
            lineHeight: 1.55,
            marginBottom: 6,
            maxWidth: 380,
          }}
        >
          작업을 한 번에, 효과적으로. 호버하면 메타가 옆에 뜨고, 클릭하면 크게 봅니다.
          <br />
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>
            HOVER → INSPECT &nbsp;·&nbsp; CLICK → ZOOM &nbsp;·&nbsp; ← → NAVIGATE
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end", marginBottom: 4 }}>
          <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>
            DENSITY · {density} COLS
          </div>
          <input
            type="range"
            min={3}
            max={10}
            value={density}
            onChange={(e) => setDensity(+e.target.value)}
            style={{ width: 160, accentColor: "#8FE600" }}
            disabled={mode === "river" || mode === "contact"}
          />
        </div>
      </div>

      {/* Toolbar */}
      <div
        style={{
          padding: "10px 24px",
          borderBottom: "1px solid var(--ink)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
          background: "var(--paper)",
        }}
      >
        <div style={{ display: "flex", border: "1px solid var(--ink)" }}>
          {(
            [
              { k: "grid", l: "▦ GRID" },
              { k: "masonry", l: "▥ MASONRY" },
              { k: "river", l: "▭ RIVER" },
              { k: "contact", l: "▣ CONTACT" },
            ] as { k: Mode; l: string }[]
          ).map((m, i, arr) => (
            <button
              key={m.k}
              type="button"
              onClick={() => setMode(m.k)}
              className="font-mono"
              style={{
                padding: "6px 12px",
                fontSize: 10,
                letterSpacing: "0.18em",
                fontWeight: 700,
                cursor: "none",
                borderRight: i < arr.length - 1 ? "1px solid var(--ink)" : "none",
                background: mode === m.k ? "var(--neon)" : "var(--paper)",
                color: "var(--ink)",
              }}
            >
              {m.l}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>
            MEDIUM
          </span>
          {ALL_MEDIUMS.map((m) => {
            const on = filter.has(m);
            return (
              <button
                key={m}
                type="button"
                onClick={() => toggleMedium(m)}
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                  padding: "4px 9px",
                  border: "1px solid var(--ink)",
                  cursor: "none",
                  background: on ? "var(--ink)" : "transparent",
                  color: on ? "var(--neon)" : "var(--ink)",
                  textDecoration: on ? "none" : "line-through",
                  opacity: on ? 1 : 0.4,
                }}
              >
                {m.toUpperCase()}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>
            SORT
          </span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.15em",
              fontWeight: 700,
              padding: "4px 8px",
              border: "1px solid var(--ink)",
              background: "var(--paper)",
              cursor: "none",
            }}
          >
            <option value="date">DATE ↓</option>
            <option value="title">TITLE A→Z</option>
            <option value="medium">MEDIUM</option>
          </select>
        </div>
      </div>

      {/* Gallery area */}
      <div style={{ flex: 1, position: "relative", overflow: "auto", padding: 14, minHeight: 0 }}>
        {mode === "grid" && renderGrid()}
        {mode === "masonry" && renderMasonry()}
        {mode === "river" && renderRiver()}
        {mode === "contact" && renderContact()}

        {/* Hover meta sidebar */}
        <div
          style={{
            position: "fixed",
            right: 18,
            top: "50%",
            transform: "translateY(-50%)",
            width: 248,
            pointerEvents: "none",
            zIndex: 30,
            opacity: hover ? 1 : 0,
            transition: "opacity .18s",
          }}
        >
          {hover && (
            <div
              style={{
                background: "var(--ink)",
                color: "var(--neon)",
                border: "1px solid var(--ink)",
                padding: 12,
                boxShadow: "4px 6px 0 rgba(0,0,0,0.15)",
              }}
            >
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7, marginBottom: 8 }}>
                NO. {String(hover.idx).padStart(3, "0")} &nbsp;/&nbsp; INSPECT
              </div>
              <div
                style={{
                  aspectRatio: `${hover.aspect}/1`,
                  border: "1px solid var(--neon)",
                  marginBottom: 10,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <Thumb d={hover} />
              </div>
              <div
                className="font-display"
                style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, marginBottom: 4, color: "var(--paper)" }}
              >
                {hover.title}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.2em",
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                  marginTop: 8,
                  color: "var(--neon)",
                }}
              >
                <span style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ opacity: 0.6 }}>MEDIUM</span>
                  <span>{hover.medium.toUpperCase()}</span>
                </span>
                <span style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ opacity: 0.6 }}>DATE</span>
                  <span>{hover.date}</span>
                </span>
                <span style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ opacity: 0.6 }}>ASPECT</span>
                  <span>{hover.aspect.toFixed(2)} : 1</span>
                </span>
                <span style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ opacity: 0.6 }}>DOMINANT</span>
                  <span style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    <span style={{ width: 10, height: 10, background: hover.bg, border: "0.5px solid var(--neon)" }} />
                    {hover.bg}
                  </span>
                </span>
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 8,
                  letterSpacing: "0.2em",
                  opacity: 0.5,
                  marginTop: 10,
                  paddingTop: 8,
                  borderTop: "1px solid rgba(180,255,58,0.3)",
                }}
              >
                CLICK TO OPEN ⏎
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom status bar */}
      <footer
        className="font-mono"
        style={{
          borderTop: "1px solid var(--ink)",
          padding: "6px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.6 }}>
          VIEW · {mode.toUpperCase()} &nbsp;·&nbsp; {filtered.length} VISIBLE / {DRAWINGS.length} TOTAL
        </span>
        <span style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.6 }}>
          ↑↓ ZOOM &nbsp;·&nbsp; SHIFT+M MODE &nbsp;·&nbsp; F FILTER
        </span>
      </footer>

      {open && (
        <Lightbox
          piece={open}
          index={filtered.findIndex((d) => d.id === open.id) + 1}
          total={filtered.length}
          onClose={() => setOpen(null)}
          onNav={(dir) => {
            const i = filtered.findIndex((d) => d.id === open.id);
            const next = dir > 0 ? (i + 1) % filtered.length : (i - 1 + filtered.length) % filtered.length;
            setOpen(filtered[next]);
          }}
        />
      )}
    </div>
  );
}
