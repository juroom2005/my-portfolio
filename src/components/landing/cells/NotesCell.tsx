"use client";

import { useEffect, useState } from "react";
import { Cell, CellHead } from "../Cell";
import { NOTES } from "../data";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  noteCount: number;
};

export default function NotesCell({ hover, setHover, noteCount }: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (paused) return;
    let start: number | undefined;
    let raf: number;
    const dur = 3800;
    const tick = (ts: number) => {
      if (start === undefined) start = ts;
      const p = (ts - start) / dur;
      if (p >= 1) {
        setIdx((i) => (i + 1) % NOTES.length);
        start = ts;
        setProgress(0);
      } else {
        setProgress(p);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  const n = NOTES[idx];

  return (
    <Cell id="notes" hover={hover} setHover={setHover} style={{ gridColumn: "span 7", gridRow: "span 1" }}>
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        style={{ display: "flex", flexDirection: "column", flex: 1 }}
      >
        <CellHead idx="04" name="NOTES · 글" count={noteCount} suffix=" ENTRIES" />
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, flex: 1 }}>
          <div
            className="font-display"
            style={{ fontSize: 60, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-0.04em" }}
          >
            글
          </div>
          <div style={{ flex: 1, marginBottom: 4, position: "relative", minHeight: 60 }}>
            <div
              key={idx}
              className="font-mono"
              style={{ fontSize: 11, lineHeight: 1.55, animation: "fadeUp .4s ease both" }}
            >
              <span style={{ opacity: 0.5 }}>{n.d}</span> &nbsp; {n.t}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10 }}>
              <div style={{ flex: 1, height: 2, background: "rgba(0,0,0,0.1)", position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: `${progress * 100}%`,
                    background: "var(--neon-deep)",
                    transition: paused ? "none" : "width .1s linear",
                  }}
                />
              </div>
              <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>
                {String(idx + 1).padStart(2, "0")} / {String(NOTES.length).padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Cell>
  );
}
