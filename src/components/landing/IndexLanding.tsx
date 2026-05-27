"use client";

import { useState } from "react";
import { useClock, usePaletteHotkey } from "./hooks";
import CommandPalette from "./CommandPalette";
import DiamondCursor from "./DiamondCursor";

import DrawCell from "./cells/DrawCell";
import PhotoCell from "./cells/PhotoCell";
import JournalCell from "./cells/JournalCell";
import NotesCell from "./cells/NotesCell";
import SoundCell from "./cells/SoundCell";
import BookmarksCell from "./cells/BookmarksCell";
import CodeCell from "./cells/CodeCell";
import InboxCell from "./cells/InboxCell";
import IDCard from "./IDCard";

import type { CategoryWithCount, CellVariant } from "@/lib/landing";

const pad = (n: number) => String(n).padStart(2, "0");
const DOW = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Props = {
  categories: CategoryWithCount[];
  user: { email: string } | null;
  isAdmin: boolean;
};

/**
 * 각 카테고리는 DB의 cell_variant 값에 따라 다른 셀로 렌더링된다.
 * 새 카테고리 추가 시 여기에 매핑만 추가하면 됨.
 */
function renderCell(
  variant: CellVariant | null,
  count: number,
  ctx: {
    hover: string | null;
    setHover: (v: string | null) => void;
    dragOver: boolean;
    setDragOver: (v: boolean) => void;
  },
) {
  const { hover, setHover, dragOver, setDragOver } = ctx;

  switch (variant) {
    case "draw":
      return <DrawCell hover={hover} setHover={setHover} drawCount={count} />;
    case "photo":
      return <PhotoCell hover={hover} setHover={setHover} photoCount={count} />;
    case "journal":
      return <JournalCell hover={hover} setHover={setHover} journalCount={count} />;
    case "notes":
      return <NotesCell hover={hover} setHover={setHover} noteCount={count} />;
    case "sound":
      return <SoundCell hover={hover} setHover={setHover} soundCount={count} />;
    case "bookmarks":
      return <BookmarksCell hover={hover} setHover={setHover} bmCount={count} />;
    case "code":
      return <CodeCell hover={hover} setHover={setHover} codeCount={count} />;
    case "inbox":
      return <InboxCell setHover={setHover} dragOver={dragOver} setDragOver={setDragOver} />;
    default:
      return null;
  }
}

export default function IndexLanding({ categories, user, isAdmin }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const [mouse, setMouse] = useState({ x: -1000, y: -1000 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const clock = useClock();
  usePaletteHotkey(setPaletteOpen, () => setPaletteOpen(false));

  const totalCount = categories.reduce((sum, c) => sum + c.count, 0);

  const time = clock
  ? `${pad(clock.getHours())}:${pad(clock.getMinutes())}:${pad(clock.getSeconds())}`
  : "--:--:--";

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    setMouse({ x: e.clientX, y: e.clientY });
  };
  const onLeave = () => setMouse({ x: -1000, y: -1000 });

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

      {/* Masthead */}
      <header
        style={{
          borderBottom: "1px solid var(--ink)",
          padding: "14px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          className="font-mono"
          style={{ fontSize: 10, letterSpacing: "0.3em", fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}
        >
          <span>ISSUE 04 · MAY 2026 · PRIVATE INDEX</span>
          <span style={{ background: "var(--ink)", color: "var(--neon)", padding: "2px 6px" }}>{time}</span>
        </div>
        <nav className="font-mono" style={{ fontSize: 10, letterSpacing: "0.3em", fontWeight: 700, display: "flex", gap: 18, alignItems: "center" }}>
        <span>INDEX</span>
        <span style={{ opacity: 0.4 }}>ARCHIVE</span>
        <span style={{ opacity: 0.4 }}>TIMELINE</span>
        {isAdmin && (
          <a href="/settings" style={{ color: "inherit", textDecoration: "none" }}>
            SETTINGS
          </a>
        )}
        {user ? (
          <form action="/auth/signout" method="post" style={{ display: "inline" }}>
            <button
              type="submit"
              className="font-mono"
              style={{
                border: "1px solid var(--ink)",
                background: "var(--paper)",
                padding: "2px 8px",
                fontSize: 10,
                letterSpacing: "0.3em",
                fontWeight: 700,
                cursor: "none",
              }}
            >
              LOG OUT
            </button>
          </form>
        ) : (
            <a
            href="/login"
            className="font-mono"
            style={{
              border: "1px solid var(--ink)",
              background: "var(--neon)",
              padding: "2px 8px",
              fontSize: 10,
              letterSpacing: "0.3em",
              fontWeight: 700,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            LOG IN
          </a>
        )}
      </nav>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="font-mono"
          style={{
            border: "1px solid var(--ink)",
            background: "var(--paper)",
            padding: "4px 10px",
            fontSize: 10,
            letterSpacing: "0.25em",
            fontWeight: 700,
            cursor: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ opacity: 0.6 }}>SEARCH</span>
          <span style={{ padding: "1px 5px", border: "1px solid var(--ink)", background: "var(--neon)" }}>⌘K</span>
        </button>
      </header>

      {/* Title block */}
      <div
        style={{
          padding: "20px 32px 16px",
          borderBottom: "1px solid var(--ink)",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "end",
          gap: 24,
        }}
      >
        <div
          className="font-display"
          style={{ fontSize: 110, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.08em" }}
        >
          MODID<span style={{ color: "var(--neon-deep)" }}>·</span>WEB
        </div>
        <div style={{ borderLeft: "1px solid var(--ink)", paddingLeft: 18, maxWidth: 340, fontSize: 12, lineHeight: 1.6, marginBottom: 8 }}>
          포트폴리오, OC 리스트 등
          <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
            {["VOL.04", `${totalCount} PCS`, "EST.2026", "PRIVATE"].map((t) => (
              <span key={t} className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", border: "1px solid var(--ink)", padding: "2px 7px" }}>
                {t}
              </span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: "right", marginBottom: 8 }}>
          <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.25em", opacity: 0.6 }}>
            TODAY
          </div>
            <div
              className="font-display"
              style={{ fontSize: 46, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.03em" }}
            >
              {clock ? `${pad(clock.getMonth() + 1)}/${pad(clock.getDate())}` : "--/--"}
            </div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.3em", opacity: 0.6, marginTop: 2 }}>
              {clock ? `${DOW[clock.getDay()]} · ${clock.getFullYear()}` : "—"}
            </div>
        </div>
      </div>

      {/* Bento grid — DB-driven */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          padding: 18,
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridTemplateRows: "repeat(4, minmax(0, 1fr))",
          gap: 10,
          minBlockSize: "calc(100vh - 220px)",
        }}
      >
        {categories.map((cat) => (
          <div key={cat.id} style={{ display: "contents" }}>
            {renderCell(cat.cell_variant, cat.count, { hover, setHover, dragOver, setDragOver })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer
        className="font-mono"
        style={{
          borderTop: "1px solid var(--ink)",
          padding: "8px 32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.6 }}>
          MODID · PAGE · MAINTAINED BY ONE PERSON · LAST SYNC {time} KST
        </span>
        <span style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.6 }}>↑ ↓ NAVIGATE · ⏎ OPEN · ⌘K SEARCH</span>
      </footer>
      <IDCard />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}