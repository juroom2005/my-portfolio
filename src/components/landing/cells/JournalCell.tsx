"use client";

import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  journalCount: number;
};

export default function JournalCell({ hover, setHover, journalCount }: Props) {
  return (
    <Cell id="journal" hover={hover} setHover={setHover} style={{ gridColumn: "span 3", gridRow: "span 2" }}>
      <CellHead idx="03" name="JOURNAL · 일기" count={journalCount} suffix=" DAYS" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16 }}>
        <div
          className="font-display"
          style={{ fontSize: 66, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.04em" }}
        >
          일기
        </div>

        {/* 빈 히트맵 — 격자만 회색으로, 활동 없음 표시 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(14, 1fr)", gap: 2, opacity: 0.4 }}>
          {Array.from({ length: 70 }).map((_, i) => (
            <div
              key={i}
              style={{
                aspectRatio: "1 / 1",
                background: "rgba(0,0,0,0.06)",
                border: "0.5px solid rgba(0,0,0,0.08)",
              }}
            />
          ))}
        </div>

        <div
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.2em",
            opacity: 0.5,
            borderLeft: "2px solid rgba(0,0,0,0.2)",
            paddingLeft: 8,
            lineHeight: 1.6,
          }}
        >
          NO RECORDS YET
          <br />
          오늘의 첫 일기를 남겨보세요
        </div>
      </div>
    </Cell>
  );
}