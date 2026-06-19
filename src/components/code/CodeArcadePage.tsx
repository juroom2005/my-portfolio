"use client";

// src/components/code/CodeArcadePage.tsx
// '코드' 진입 화면 — 내가 만든 웹게임 런처. cmd 터미널 `ls` 리스트 + 행 클릭 시
// 상세 패널이 CRT 켜지듯 떠오른다. /code 라우트. 브랜드 형광 녹 팔레트.
//   행 클릭 / Enter → 상세 켜짐 · Esc·바깥·BACK → 닫힘 · ↑↓ 선택
//
// 트랜지션 컨벤션은 OCBroadcastPage / DrawingsPage 패턴 그대로:
//   진입 → 외곽 div 가 slideInFromRight
//   나가기(Esc·← BACK) → paper 색 오버레이가 왼쪽에서 슬라이드 인 → router.push("/")

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES, STATUS_COLOR } from "./gamesData";
import MiniScreen from "./MiniScreen";
import CRTLayer from "./CRTLayer";
import "./arcade.css";
import { runFarmSelfCheck } from "@/components/code/games/farm/_selfCheck";

const NEON = "#B4FF3A";
const DIM = "rgba(180,255,58,0.55)";
const LINE = "rgba(180,255,58,0.3)";
const CMD = "ls -la ~/code/games";

export default function CodeArcadePage() {
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [done, setDone] = useState(false);
  const [sel, setSel] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [clock, setClock] = useState("");
  const [transitioning, setTransitioning] = useState(false);

  // 홈으로 슬라이드-아웃하며 복귀. 중복 클릭 방어.
  const goBack = () => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(() => router.push("/"), 200);
  };

  // typewriter for the command
  useEffect(() => {
    let i = 0;
    const t = window.setInterval(() => {
      i++;
      setTyped(CMD.slice(0, i));
      if (i >= CMD.length) {
        window.clearInterval(t);
        window.setTimeout(() => setDone(true), 250);
      }
    }, 55);
    return () => window.clearInterval(t);
  }, []);

  //체크
  useEffect(() => { runFarmSelfCheck(); }, []);

  useEffect(() => {
    const t = window.setInterval(() => {
      const d = new Date();
      setClock(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`);
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  // keyboard: ↑↓ select · Enter open · Esc close (or back to home with slide)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!done) return;
      if (open !== null) {
        if (e.key === "Escape") { e.preventDefault(); setOpen(null); }
        return;
      }
      if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => (s + 1) % GAMES.length); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => (s - 1 + GAMES.length) % GAMES.length); }
      if (e.key === "Enter") { e.preventDefault(); setOpen(sel); }
      if (e.key === "Escape") { e.preventDefault(); goBack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, sel, open, transitioning]);

  const g = open !== null ? GAMES[open] : null;

  return (
    <div
      className="code-arcade font-mono"
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "#060A06",
        color: NEON,
        overflow: "hidden",
        textShadow: "0 0 4px rgba(180,255,58,0.45)",
        animation: "slideInFromRight .4s cubic-bezier(.6,.0,.2,1) both",
      }}
    >
      {/* window chrome */}
      <div style={{ height: 34, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#0B130B", borderBottom: `1px solid ${LINE}` }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: NEON, opacity: 0.85 }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(180,255,58,0.35)" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(180,255,58,0.35)" }} />
        <button
          type="button"
          onClick={goBack}
          className="font-mono"
          style={{
            background: "transparent",
            border: `1px solid ${LINE}`,
            color: NEON,
            fontSize: 10,
            letterSpacing: "0.2em",
            fontWeight: 700,
            padding: "3px 9px",
            marginLeft: 6,
            cursor: "pointer",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(180,255,58,0.12)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          ← BACK
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 11, letterSpacing: "0.3em", opacity: 0.7 }}>guest@room404 — games — 80×24</span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>{clock}</span>
      </div>

      <div style={{ padding: "26px 36px", fontSize: 14.5, lineHeight: 1.85 }}>
        <div style={{ opacity: 0.55 }}>Last login: archive session · INDEX·404 shell</div>
        <div style={{ opacity: 0.8, marginBottom: 14 }}>
          type <span style={{ color: "#DAFF85" }}>help</span> · ↑↓ select · <span style={{ color: "#DAFF85" }}>enter</span> to open · <span style={{ color: "#DAFF85" }}>esc</span> to close
        </div>

        <div style={{ fontSize: 16 }}>
          <span style={{ color: "#7FD0FF" }}>guest@room404</span>:<span style={{ color: "#DAFF85" }}>~/code/games</span>$ {typed}
          {!done && <span style={{ display: "inline-block", width: 9, height: 18, background: NEON, marginLeft: 2, verticalAlign: "-3px", animation: "arcBlink 1s steps(2) infinite" }} />}
        </div>

        {done && (
          <div className="code-list" style={{ marginTop: 14 }}>
            <div style={{ opacity: 0.55, marginBottom: 4 }}>total {GAMES.length} · drwxr-xr-x  6 modid  staff  204 06 Jun  ./</div>
            <div className="code-list-head" style={{ display: "grid", gridTemplateColumns: "120px 64px 70px 1fr 110px", gap: 14, opacity: 0.45, fontSize: 12, letterSpacing: "0.08em", padding: "0 10px 4px" }}>
              <span>PERMS</span><span>SIZE</span><span>YEAR</span><span>NAME</span><span>STATUS</span>
            </div>
            {GAMES.map((it, i) => {
              const active = i === sel;
              return (
                <div
                  key={it.id}
                  className="code-list-row"
                  onMouseEnter={() => setSel(i)}
                  onClick={() => setOpen(i)}
                  style={{ display: "grid", gridTemplateColumns: "120px 64px 70px 1fr 110px", gap: 14, padding: "5px 10px", cursor: "pointer", fontSize: 14, alignItems: "baseline", background: active ? "rgba(180,255,58,0.14)" : "transparent", borderLeft: active ? `2px solid ${NEON}` : "2px solid transparent", animation: `arcRow .4s ${i * 0.06}s both` }}
                >
                  <span style={{ opacity: 0.7 }}>-rwxr-xr-x</span>
                  <span style={{ opacity: 0.8 }}>{it.size}</span>
                  <span style={{ opacity: 0.6 }}>{it.year}</span>
                  <span>
                    <span style={{ color: active ? "#DAFF85" : NEON }}>{active ? "▸ " : "  "}{it.file}</span>
                    <span style={{ opacity: 0.5, marginLeft: 12 }}>{it.kor} · {it.genre.toLowerCase()}</span>
                  </span>
                  <span style={{ color: STATUS_COLOR[it.status], opacity: active ? 1 : 0.8, fontSize: 12, letterSpacing: "0.06em" }}>● {it.status}</span>
                </div>
              );
            })}
            <div style={{ marginTop: 18, paddingTop: 12, borderTop: `1px dashed ${LINE}` }}>
              <span style={{ color: "#7FD0FF" }}>guest@room404</span>:<span style={{ color: "#DAFF85" }}>~/code/games</span>$ open ./{GAMES[sel].file}
              <span style={{ display: "inline-block", width: 9, height: 18, background: NEON, marginLeft: 4, verticalAlign: "-3px", animation: "arcBlink 1s steps(2) infinite" }} />
            </div>
          </div>
        )}
      </div>

      {/* ===== DETAIL — CRT 켜지듯 ===== */}
      {g && (
        <div style={{ position: "fixed", inset: 0, zIndex: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={() => setOpen(null)} style={{ position: "absolute", inset: 0, background: "rgba(3,6,3,0.78)", animation: "arcOnFade .5s ease both" }} />
          <div
            key={g.id}
            className="code-detail-panel"
            style={{ position: "relative", width: "78%", maxWidth: 760, background: "#070C07", border: `1px solid ${NEON}`, boxShadow: "0 0 0 1px rgba(180,255,58,0.25), 0 0 60px rgba(180,255,58,0.18)", transformOrigin: "center", animation: "arcOn .5s cubic-bezier(.2,.8,.2,1) both" }}
          >
            <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 2, background: "#DAFF85", boxShadow: "0 0 12px #B4FF3A", animation: "arcOnSweep .55s ease both", pointerEvents: "none", zIndex: 5 }} />

            <div style={{ animation: "arcOnFade .6s ease both" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: `1px solid ${LINE}`, background: "rgba(180,255,58,0.07)" }}>
                <span style={{ fontSize: 12, letterSpacing: "0.2em", fontWeight: 700 }}>DETAIL · {g.file}</span>
                <button onClick={() => setOpen(null)} className="font-mono" style={{ background: "transparent", border: `1px solid ${LINE}`, color: NEON, fontSize: 11, letterSpacing: "0.14em", padding: "3px 9px", cursor: "pointer" }}>ESC ✕</button>
              </div>

              <div className="code-detail-grid" style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: 22, padding: 22 }}>
                {/* left — preview + meta */}
                <div>
                  <div style={{ position: "relative", height: 150, border: `1px solid ${LINE}`, overflow: "hidden", background: "rgba(180,255,58,0.04)" }}>
                    <MiniScreen kind={g.kind} accent={NEON} />
                    <span style={{ position: "absolute", top: 8, left: 10, fontSize: 10, letterSpacing: "0.2em", color: DIM }}>RUN-PREVIEW</span>
                    <span style={{ position: "absolute", bottom: 8, right: 10, fontSize: 10, color: DIM }}>{g.stack}</span>
                    <CRTLayer strength={1} tint="#d6ffd6" band radius={0} />
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12.5, lineHeight: 1.95 }}>
                    {([["STATUS", g.status], ["SIZE", g.size], ["BUILT", g.year], ["CONTROLS", g.ctrl], ["PLAYS", g.plays.toLocaleString()]] as [string, string][]).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", gap: 12 }}>
                        <span style={{ width: 92, color: DIM }}>{k}</span>
                        <span style={{ color: k === "STATUS" ? STATUS_COLOR[g.status] : NEON }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* right — title + desc + run */}
                <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.18em", color: "#070C07", background: NEON, padding: "3px 8px", fontWeight: 700 }}>CH·{g.no}</span>
                    <span style={{ fontSize: 11, letterSpacing: "0.26em", color: DIM }}>{g.genre}</span>
                  </div>
                  <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.02, marginTop: 12 }}>{g.name}</div>
                  <div style={{ fontSize: 14, color: DIM, marginTop: 5 }}>{g.kor}</div>
                  <div style={{ height: 1, background: LINE, margin: "18px 0" }} />
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(180,255,58,0.85)", textWrap: "pretty" }}>{g.desc}</div>
                  <div style={{ marginTop: "auto", paddingTop: 22 }}>
                    <div style={{ fontSize: 10, color: DIM, marginBottom: 6, display: "flex", justifyContent: "space-between" }}><span>READY TO LAUNCH</span><span>{g.size} · OK</span></div>
                    <div style={{ height: 12, border: `1px solid ${LINE}`, padding: 2, marginBottom: 14 }}>
                      <div style={{ height: "100%", width: "100%", background: `repeating-linear-gradient(90deg, ${NEON} 0 6px, transparent 6px 9px)`, opacity: 0.85 }} />
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      {/* TODO: 실제 게임 라우트(/code/[id])가 생기면 router.push 로 연결 */}
                      <button className="font-mono" style={{ flex: 1, background: NEON, color: "#070C07", border: "none", padding: "11px 0", fontSize: 13, letterSpacing: "0.16em", fontWeight: 700, cursor: "pointer" }}>▸ ./{g.file}</button>
                      <button onClick={() => setOpen(null)} className="font-mono" style={{ background: "transparent", color: NEON, border: `1px solid ${LINE}`, padding: "11px 16px", fontSize: 13, letterSpacing: "0.14em", cursor: "pointer" }}>← BACK</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div>check console</div>;
        </div>
      )}

      <CRTLayer strength={1} tint="#d6ffd6" radius={0} fixed />

      {/* 나가기 슬라이드 오버레이 — paper 색이 왼쪽에서 들어오며 홈으로 넘어가는 모양 */}
      {transitioning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--paper)",
            zIndex: 90,
            animation: "slideInFromLeft .25s cubic-bezier(.6,.0,.2,1) forwards",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}