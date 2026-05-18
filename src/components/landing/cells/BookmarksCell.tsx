"use client";

import { useEffect, useState } from "react";
import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  bmCount: number;
};

export default function BookmarksCell({ hover, setHover, bmCount }: Props) {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setAngle((a) => a + 1), 60);
    return () => window.clearInterval(t);
  }, []);

  const isHover = hover === "bm";

  return (
    <Cell id="bm" hover={hover} setHover={setHover} style={{ gridColumn: "span 3", gridRow: "span 1" }}>
      <CellHead idx="06" name="栞" count={bmCount} />
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          className="font-display"
          style={{
            fontSize: 46,
            fontWeight: 900,
            lineHeight: 1,
            transform: `rotate(${isHover ? angle * 4 : angle}deg)`,
            transition: "transform .2s",
          }}
        >
          ※
        </div>
      </div>
      <div
        className="font-display"
        style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.02em" }}
      >
        책갈피
      </div>
    </Cell>
  );
}
