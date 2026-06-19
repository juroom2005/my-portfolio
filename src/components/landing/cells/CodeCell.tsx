"use client";

// src/components/landing/cells/CodeCell.tsx
// '코드' 셀 — 클릭 시 paper 색 오버레이가 오른쪽에서 슬라이드 인 → /code 로 push.
// DrawingsBranchPopup 의 트랜지션 컨벤션과 동일. 도착 페이지(CodeArcadePage)는
// 자체 slideInFromRight 가 외곽 div 에 걸려 있어서 연속된 모션으로 이어진다.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Cell, CellHead } from "../Cell";

type Props = {
  hover: string | null;
  setHover: (v: string | null) => void;
  codeCount: number;
};

export default function CodeCell({ hover, setHover, codeCount }: Props) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);

  const go = () => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(() => router.push("/code"), 300);
  };

  const lines = [
    "> ls -la",
    codeCount > 0 ? `> ${codeCount} scripts` : "> no scripts yet",
    "> cat me.json",
  ];
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
    <>
      <Cell id="code" hover={hover} setHover={setHover} dark onClick={go} style={{ gridColumn: "span 3", gridRow: "span 1" }}>
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

      {/* 나가는 슬라이드 — paper 가 오른쪽에서 들어와 랜딩을 덮음.
          그 사이 router.push 가 발화되고, /code 페이지가 자체 slideInFromRight 로 이어받는다. */}
      {transitioning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--paper)",
            zIndex: 70,
            animation: "slideInFromRight .3s cubic-bezier(.6,.0,.2,1) forwards",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}