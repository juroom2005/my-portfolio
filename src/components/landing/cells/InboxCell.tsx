"use client";

import { useState } from "react";
import { CellHead } from "../Cell";

type Props = {
  setHover: (v: string | null) => void;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
};

export default function InboxCell({ setHover, dragOver, setDragOver }: Props) {
  const [dropped, setDropped] = useState<string[]>([]);

  return (
    <div
      onDragEnter={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files).slice(0, 3).map((f) => f.name);
        setDropped((d) => [...files, ...d].slice(0, 3));
      }}
      onMouseEnter={() => setHover("drop")}
      onMouseLeave={() => setHover(null)}
      style={{
        gridColumn: "span 6",
        gridRow: "span 1",
        background: dragOver ? "var(--neon)" : "transparent",
        border: dragOver ? "1.5px solid var(--ink)" : "1.5px dashed rgba(0,0,0,0.4)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        transition: "background .15s, border .15s, transform .2s",
        transform: dragOver ? "scale(1.01)" : "scale(1)",
      }}
    >
      <CellHead
        idx="08"
        name="INBOX · 임시함"
        count={dragOver ? "RELEASE TO DROP" : dropped.length ? `${dropped.length} STAGED` : "DROP"}
      />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 6 }}>
        {dropped.length === 0 ? (
          <>
            <div style={{ fontSize: 30, opacity: dragOver ? 0.9 : 0.4, transition: "opacity .15s" }}>
              {dragOver ? "↓" : "+"}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 10, letterSpacing: "0.2em", opacity: 0.6, textAlign: "center" }}
            >
              {dragOver ? (
                "RELEASE TO DROP"
              ) : (
                <>
                  DROP FILES TO STAGE
                  <br />
                  UNCATEGORIZED → SORT LATER
                </>
              )}
            </div>
          </>
        ) : (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 4 }}>
            {dropped.map((f, i) => (
              <div
                key={i}
                className="font-mono"
                style={{
                  fontSize: 10,
                  padding: "4px 8px",
                  background: "rgba(0,0,0,0.06)",
                  border: "1px solid rgba(0,0,0,0.15)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                <span
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    background: "var(--neon)",
                    padding: "1px 5px",
                    border: "1px solid var(--ink)",
                  }}
                >
                  NEW
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
