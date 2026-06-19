// src/components/code/MiniScreen.tsx
// 장르별 미니 데모 루프. 실제 게임 썸네일/캡처가 준비되면 이 자리에 <img>/<video>로
// 교체하면 된다. 애니메이션 키프레임은 arcade.css 에 있다.

import type { GameKind } from "./gamesData";

export default function MiniScreen({ kind, accent }: { kind: GameKind; accent: string }) {
  const base: React.CSSProperties = { position: "absolute", inset: 0, overflow: "hidden" };

  if (kind === "snake")
    return (
      <div style={base}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ position: "absolute", top: "46%", left: 8 + i * 9, width: 8, height: 8, background: accent, opacity: 1 - i * 0.18, animation: "arcSnake 1.4s steps(4) infinite" }} />
        ))}
        <span style={{ position: "absolute", top: "30%", right: 14, width: 7, height: 7, borderRadius: "50%", background: accent, animation: "arcBlink 1s steps(2) infinite" }} />
      </div>
    );
  if (kind === "block")
    return (
      <div style={base}>
        {[{ l: 18, d: 0 }, { l: 34, d: 0.5 }, { l: 50, d: 1 }, { l: 26, d: 1.4 }].map((b, i) => (
          <span key={i} style={{ position: "absolute", left: b.l, top: 0, width: 11, height: 11, background: accent, opacity: 0.9, animation: `arcFall 1.6s ${b.d}s linear infinite` }} />
        ))}
        <div style={{ position: "absolute", left: 8, right: 8, bottom: 8, height: 9, background: accent, opacity: 0.5 }} />
      </div>
    );
  if (kind === "ship")
    return (
      <div style={base}>
        <div style={{ position: "absolute", left: "46%", top: "58%", animation: "arcShip 2s ease-in-out infinite" }}>
          <div style={{ width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: `16px solid ${accent}` }} />
        </div>
        <span style={{ position: "absolute", left: "52%", top: "52%", width: 2, height: 10, background: accent, animation: "arcBullet 1s linear infinite" }} />
        <span style={{ position: "absolute", right: 14, top: 14, width: 13, height: 13, borderRadius: "50%", border: `2px solid ${accent}`, opacity: 0.6 }} />
      </div>
    );
  if (kind === "word")
    return (
      <div className="font-mono" style={{ ...base, display: "flex", gap: 5, alignItems: "center", justifyContent: "center" }}>
        {["ㄱ", "ㅏ", "ㅁ", "ㅣ"].map((c, i) => (
          <span key={i} style={{ color: accent, fontSize: 18, fontWeight: 700, animation: `arcWord 1.6s ${i * 0.3}s infinite` }}>{c}</span>
        ))}
      </div>
    );
  if (kind === "pong")
    return (
      <div style={base}>
        <span style={{ position: "absolute", left: 6, top: "40%", width: 4, height: 20, background: accent }} />
        <span style={{ position: "absolute", right: 6, top: "30%", width: 4, height: 20, background: accent }} />
        <span style={{ position: "absolute", width: 7, height: 7, background: accent, animation: "arcBall 2.6s linear infinite" }} />
      </div>
    );
  // maze
  return (
    <div style={base}>
      <div style={{ position: "absolute", inset: 10, backgroundImage: `linear-gradient(${accent}44 1px,transparent 1px),linear-gradient(90deg,${accent}44 1px,transparent 1px)`, backgroundSize: "12px 12px" }} />
      <span style={{ position: "absolute", width: 7, height: 7, background: accent, offsetPath: 'path("M 14 14 L 56 14 L 56 40 L 28 40 L 28 56")', animation: "arcMaze 3s linear infinite" } as React.CSSProperties} />
    </div>
  );
}
