"use client";

import { useEffect, useState } from "react";
import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  codeCount: number;
};

export default function CodeCell({ hover, setHover, codeCount }: Props) {
  const lines = ["> ls -la", `> ${codeCount} scripts`, "> cat me.json"];
  const [text, setText] = useState("");
  const [li, setLi] = useState(0);

  useEffect(() => {
    const full = lines[li];
    let i = 0;
    const interval = window.setInterval(() => {
      i++;
      setText(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(interval);
        window.setTimeout(() => setLi((p) => (p + 1) % lines.length), 1200);
      }
    }, 55);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [li, codeCount]);

  return (
    <Cell id="code" hover={hover} setHover={setHover} dark style={{ gridColumn: "span 3", gridRow: "span 1" }}>
      <CellHead idx="07" name="碼" count={codeCount} live />
      <div
        className="font-mono"
        style={{
          flex: 1,
          fontSize: 10,
          lineHeight: 1.5,
          opacity: 0.9,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {text}
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 11,
            background: "var(--neon)",
            marginLeft: 2,
            verticalAlign: "middle",
            animation: "blink 1s steps(2) infinite",
          }}
        />
      </div>
      <div
        className="font-display"
        style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.02em", color: "var(--neon)" }}
      >
        코드
      </div>
    </Cell>
  );
}
