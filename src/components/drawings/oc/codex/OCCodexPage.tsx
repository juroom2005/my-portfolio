"use client";

// src/components/drawings/oc/codex/OCCodexPage.tsx

import { useEffect, useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import DiamondCursor from "../../../landing/DiamondCursor";
import { OC_CAST, RARITY_DOT, type OCChar } from "./ocCodexData";
import { CodexPortrait, StatMeter, BlueprintFrame, CRTCodex } from "./CodexPieces";
import CodexStyle from "./CodexStyle";

function Roster({ cast, activeId, onPick }: { cast: OCChar[]; activeId: string; onPick: (id: string) => void }) {
  return (
    <aside className="occ-rail">
      <div className="occ-rail-head">
        <div className="occ-mono" style={{ fontSize: 9.5, letterSpacing: "0.34em", color: "rgba(237,235,226,0.42)" }}>THE CAST</div>
        <div className="occ-serif" style={{ fontSize: 28, lineHeight: 1, marginTop: 8 }}>Dramatis<span style={{ fontStyle: "italic" }}> Personæ</span></div>
        <div className="occ-grotesk" style={{ fontSize: 11, color: "rgba(237,235,226,0.42)", marginTop: 8, fontWeight: 500 }}>등장인물 · {cast.length} / 12 등재</div>
      </div>
      <div className="occ-rail-list">
        {cast.map((o) => {
          const active = o.id === activeId;
          return (
            <button key={o.id} className="occ-rail-item" onClick={() => onPick(o.id)} style={{ paddingLeft: active ? 18 : 12 }}>
              {active && <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 2, background: o.accent }} />}
              <span className="occ-mono" style={{ fontSize: 10, color: active ? o.accent : "rgba(237,235,226,0.34)", width: 16, flexShrink: 0 }}>{o.no}</span>
              <div style={{ width: 40, height: 40, flexShrink: 0, position: "relative", overflow: "hidden", background: active ? o.accent : "rgba(237,235,226,0.05)", border: `1px solid ${active ? o.accent : "rgba(237,235,226,0.14)"}` }}>
                <svg viewBox="0 0 40 40" width="40" height="40" style={{ display: "block" }}>
                  <circle cx="20" cy="15" r="8.5" fill={active ? o.ink : o.accent} opacity={active ? 1 : 0.85} />
                  <path d="M 4 40 Q 9 25 20 25 Q 31 25 36 40 Z" fill={active ? o.ink : o.accent} opacity={active ? 1 : 0.85} />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="occ-kr" style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.05, color: active ? "#F4F2EA" : "#D8D6CC" }}>{o.kor}</div>
                <div className="occ-mono" style={{ fontSize: 8.5, letterSpacing: "0.22em", marginTop: 3, color: active ? o.accent : "rgba(237,235,226,0.36)", whiteSpace: "nowrap" }}>{o.name} · {o.role}</div>
              </div>
              <div style={{ display: "flex", gap: 2, flexShrink: 0, alignItems: "center" }}>
                {o.rarity === "+"
                  ? <span className="occ-mono" style={{ fontSize: 12, color: o.accent }}>+</span>
                  : Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: i < RARITY_DOT[o.rarity] ? o.accent : "rgba(237,235,226,0.16)" }} />
                  ))}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

function Stage({ oc }: { oc: OCChar }) {
  const meterEntries = Object.entries(oc.stats);
  return (
    <div className="occ-stage" key={oc.id}>
      <div style={{ position: "absolute", inset: 22, border: "1px solid rgba(237,235,226,0.06)", pointerEvents: "none" }} />
      {/* index column */}
      <div className="occ-idx occ-anim" style={{ gridArea: "idx" }}>
        <div className="occ-serif" style={{ fontSize: "clamp(30px,4vw,44px)", lineHeight: 1, color: oc.accent }}>{oc.no}</div>
        <div className="occ-mono occ-idx-vert" style={{ fontSize: 10, letterSpacing: "0.42em", color: "rgba(237,235,226,0.5)" }}>{oc.pinyin}</div>
        <div className="occ-mono occ-idx-vert" style={{ fontSize: 8.5, letterSpacing: "0.24em", color: "rgba(237,235,226,0.3)" }}>INDEX·404</div>
      </div>
      {/* portrait plate */}
      <div className="occ-plate-zone occ-anim" style={{ gridArea: "plate", animationDelay: "60ms" }}>
        <div className="occ-plate">
          <div className="occ-serif" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "min(320px,46vw)", lineHeight: 1, color: oc.accent, opacity: 0.07, fontStyle: "italic", pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>{oc.name[0]}</div>
          <div className="occ-plate-paper" style={{ background: oc.paper }}>
            <div style={{ flex: 1, position: "relative", overflow: "hidden" }}><CodexPortrait oc={oc} /></div>
            <div style={{ borderTop: "1px solid rgba(10,10,10,0.18)", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "baseline", color: oc.ink }}>
              <span className="occ-kr" style={{ fontSize: 18, fontWeight: 600 }}>{oc.kor}</span>
              <span className="occ-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6 }}>PLATE·{oc.no}</span>
            </div>
          </div>
        </div>
      </div>
      {/* detail */}
      <div className="occ-detail" style={{ gridArea: "detail" }}>
        <div className="occ-anim" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, animationDelay: "120ms" }}>
          <span className="occ-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: oc.ink, background: oc.accent, padding: "4px 9px", fontWeight: 700 }}>{oc.rarity}</span>
          <span className="occ-mono" style={{ fontSize: 10, letterSpacing: "0.28em", color: "rgba(237,235,226,0.6)" }}>{oc.role}</span>
          <span style={{ flex: 1, height: 1, background: "rgba(237,235,226,0.12)" }} />
          <span className="occ-mono" style={{ fontSize: 10, letterSpacing: "0.22em", color: "rgba(237,235,226,0.4)" }}>{oc.cn}</span>
        </div>
        <div className="occ-anim" style={{ animationDelay: "160ms" }}>
          <div className="occ-kr" style={{ fontSize: "clamp(48px,8vw,96px)", fontWeight: 600, lineHeight: 0.92, color: "#F4F2EA" }}>{oc.kor}</div>
          <div className="occ-serif" style={{ fontSize: "clamp(26px,4vw,40px)", fontStyle: "italic", lineHeight: 1, color: oc.accent, marginTop: 4 }}>{oc.name}</div>
        </div>
        <div className="occ-anim" style={{ marginTop: 26, display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", animationDelay: "200ms" }}>
          <span className="occ-mono" style={{ fontSize: 9.5, letterSpacing: "0.26em", color: "rgba(237,235,226,0.4)" }}>能力</span>
          <span className="occ-serif" style={{ fontSize: "clamp(20px,2.6vw,26px)", color: "#EDEBE2" }}>{oc.ability}</span>
          <span className="occ-kr" style={{ fontSize: 14, color: "rgba(237,235,226,0.5)" }}>{oc.abilityCn}</span>
        </div>
        <div className="occ-anim" style={{ height: 1, background: "rgba(237,235,226,0.12)", margin: "22px 0 20px", animationDelay: "220ms" }} />
        <div className="occ-anim occ-serif" style={{ fontSize: "clamp(18px,2.6vw,27px)", fontStyle: "italic", lineHeight: 1.32, color: "#EDEBE2", maxWidth: 520, textWrap: "pretty", animationDelay: "240ms" }}>“{oc.quote}”</div>
        <div className="occ-anim" style={{ marginTop: "auto", paddingTop: 22, animationDelay: "280ms" }}>
          <div className="occ-mono" style={{ fontSize: 9, letterSpacing: "0.3em", color: "rgba(237,235,226,0.4)", marginBottom: 10 }}>관련 사건 · DOSSIER</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(oc.events.length ? oc.events : ["— 등록된 사건 없음 —"]).map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span className="occ-mono" style={{ fontSize: 9, color: oc.accent, width: 18 }}>{String(i + 1).padStart(2, "0")}</span>
                <span className="occ-grotesk" style={{ fontSize: 13.5, fontWeight: 500, color: "rgba(237,235,226,0.82)" }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* foot */}
      <div className="occ-foot" style={{ gridArea: "foot" }}>
        <div className="occ-foot-tag occ-anim" style={{ animationDelay: "200ms" }}>
          <div className="occ-serif" style={{ fontSize: "clamp(18px,2.2vw,23px)", fontStyle: "italic", lineHeight: 1.05, color: oc.accent }}>{oc.tag}</div>
          <div className="occ-grotesk" style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(237,235,226,0.55)" }}>소속 · {oc.affil}</div>
        </div>
        <div className="occ-foot-stats occ-anim" style={{ animationDelay: "260ms" }}>
          {meterEntries.length ? (
            <Fragment>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="occ-mono" style={{ fontSize: 9, letterSpacing: "0.32em", color: "rgba(237,235,226,0.42)" }}>STATUS · 능력치</span>
                <span style={{ flex: 1, height: 1, background: "rgba(237,235,226,0.10)" }} />
                <span className="occ-mono" style={{ fontSize: 9, letterSpacing: "0.22em", color: oc.accent }}>AVG {Math.round(meterEntries.reduce((s, [, v]) => s + v, 0) / meterEntries.length)}</span>
              </div>
              <div className="occ-stat-grid">
                {meterEntries.slice(0, 6).map(([k, v]) => (<StatMeter key={k} label={k} value={v} accent={oc.accent} />))}
              </div>
            </Fragment>
          ) : (
            <div className="occ-mono" style={{ fontSize: 11, letterSpacing: "0.26em", color: "rgba(237,235,226,0.36)" }}>{oc.locked ? "— STATUS CLASSIFIED · 열람 권한 필요 —" : "— 새 캐릭터 등록 대기 —"}</div>
          )}
        </div>
      </div>
      <div className="occ-anim" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: oc.accent, zIndex: 6, animationDelay: "300ms" }} />
    </div>
  );
}

function Dossier({ oc }: { oc: OCChar }) {
  const rows: [string, string][] = [
    ["코드네임 · 守秘人", oc.name],
    ["소속 · 所属部门", oc.affil],
    ["능력 · 能力", `${oc.ability} · ${oc.abilityCn}`],
    ["관련사건 · 参与事件", oc.events.join(" · ") || "— — —"],
    ["조사횟수 · 调查次数", oc.locked ? "###次" : `${33 + oc.name.length}次`],
    ["교정시간 · 校正时长", oc.locked ? "###小时" : "114小时 06分"],
  ];
  return (
    <div className="occ-dossier">
      <div className="occ-dossier-head">
        <div>
          <div className="occ-mono" style={{ fontSize: 10, letterSpacing: "0.32em", color: "rgba(237,235,226,0.42)" }}>个人履历 · DOSSIER #{oc.no}</div>
          <div className="occ-serif" style={{ fontSize: "clamp(34px,6vw,56px)", lineHeight: 0.95, marginTop: 6 }}>Personal <span style={{ fontStyle: "italic", color: oc.accent }}>Record</span></div>
        </div>
        <div className="occ-mono" style={{ fontSize: 10, letterSpacing: "0.24em", color: "rgba(237,235,226,0.42)", textAlign: "right", lineHeight: 1.8 }}>ECHONOX 24/36<br />LAST OPENED —</div>
      </div>
      <div className="occ-dossier-card">
        <div>
          <div style={{ background: oc.paper, padding: 10, paddingBottom: 38, position: "relative", boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}>
            <div style={{ aspectRatio: "4/5", background: "#1a1b16", overflow: "hidden", position: "relative" }}><CodexPortrait oc={oc} /></div>
            <div className="occ-kr" style={{ position: "absolute", bottom: 10, left: 12, fontSize: 16, color: oc.ink, fontWeight: 600 }}>{oc.kor}{oc.locked ? "?" : ""} <span style={{ fontSize: 11, opacity: 0.55, textDecoration: "line-through", marginLeft: 4 }}>24-36</span></div>
            <span style={{ position: "absolute", top: -8, left: "38%", width: 52, height: 16, background: oc.accent, opacity: 0.55, transform: "rotate(-3deg)" }} />
          </div>
        </div>
        <div>
          <div className="occ-serif" style={{ fontSize: 22, fontStyle: "italic", marginBottom: 16, color: oc.accent }}>You are <span style={{ textDecoration: "underline", textUnderlineOffset: 4 }}>{oc.name}</span> from now on.</div>
          <div className="occ-record">
            {rows.map(([k, v], i) => (
              <Fragment key={i}>
                <div className="occ-mono" style={{ padding: "10px 12px", fontSize: 10.5, color: "rgba(237,235,226,0.55)", borderTop: "1px solid rgba(237,235,226,0.08)" }}>{k}</div>
                <div className="occ-grotesk" style={{ padding: "10px 12px", fontSize: 13.5, fontWeight: 500, borderTop: "1px solid rgba(237,235,226,0.08)", color: i === 2 ? oc.accent : "#EDEBE2" }}>{v}</div>
              </Fragment>
            ))}
          </div>
          {!oc.locked && !oc.addSlot && (
            <div style={{ marginTop: 22 }}>
              <div className="occ-mono" style={{ fontSize: 9.5, letterSpacing: "0.3em", color: "rgba(237,235,226,0.42)", marginBottom: 12 }}>STATUS · 능력치</div>
              <div className="occ-dossier-stats">{Object.entries(oc.stats).map(([k, v]) => (<StatMeter key={k} label={k} value={v} accent={oc.accent} segments={18} big />))}</div>
            </div>
          )}
          <div className="occ-mono" style={{ marginTop: 22, paddingTop: 14, borderTop: "1px dashed rgba(237,235,226,0.18)", fontSize: 9.5, letterSpacing: "0.22em", color: "rgba(237,235,226,0.36)", fontStyle: "italic" }}>{oc.locked ? "— Access required to view contradiction —" : "Irreconcilable self-contradiction."}</div>
        </div>
      </div>
    </div>
  );
}

export default function OCCodexPage({ initialId = "shan" }: { initialId?: string }) {
  const router = useRouter();
  const cast = OC_CAST;
  const activeId = cast.some((c) => c.id === initialId) ? initialId : cast[0].id;
  const oc = cast.find((c) => c.id === activeId) ?? cast[0];


  const [mouse, setMouse] = useState({ x: -1000, y: -1000 });
  const [transitioning, setTransitioning] = useState(false);
  const [railOpen, setRailOpen] = useState(true);

  const goBack = () => {
    setTransitioning(true);
    setTimeout(() => router.push("/drawings/oc"), 200);
  };

  // 마우스 무브 리스너
  useEffect(() => {
    const onMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const pick = (id: string) => {
    router.replace(`/drawings/oc/${id}`, { scroll: false });
  };

  // keyboard nav ↑↓ — updates the route (which re-renders with new active id)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = cast.findIndex((c) => c.id === activeId);
      if (e.key === "ArrowDown") { e.preventDefault(); pick(cast[(i + 1) % cast.length].id); }
      if (e.key === "ArrowUp") { e.preventDefault(); pick(cast[(i - 1 + cast.length) % cast.length].id); }
      if (e.key === "Escape") { e.preventDefault(); goBack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
  <div
    className="occ-root"
    style={{
      cursor: "none",
      animation: "slideInFromRight .4s cubic-bezier(.6,.0,.2,1) both",
    }}
  >
    <CodexStyle />
    <BlueprintFrame accent={oc.accent} />
    <DiamondCursor x={mouse.x} y={mouse.y} />

    <div className="occ-topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0, overflow: "hidden", flex: 1 }}>
        <button
          type="button"
          onClick={goBack}
          className="occ-mono"
          style={{
            border: `1px solid ${oc.accent}88`,
            background: "transparent",
            color: oc.accent,
            padding: "4px 10px",
            fontSize: 10,
            letterSpacing: "0.25em",
            fontWeight: 700,
            cursor: "none",
            flexShrink: 0,
            transition: "all .15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = oc.accent;
            e.currentTarget.style.color = "#0A0A0A";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = oc.accent;
          }}
        >
          ← 전광판
        </button>
        <div className="occ-mono" style={{ fontSize: 10, letterSpacing: "0.28em", display: "flex", alignItems: "center", gap: 9, minWidth: 0, overflow: "hidden" }}>
          <span style={{ color: "rgba(237,235,226,0.42)" }}>INDEX·404</span><span style={{ color: "rgba(237,235,226,0.28)" }}>/</span>
          <span style={{ color: "rgba(237,235,226,0.62)" }}>그림</span><span style={{ color: "rgba(237,235,226,0.28)" }}>/</span>
          <span style={{ color: oc.accent, whiteSpace: "nowrap" }}>OC 설정도감</span>
        </div>
      </div>
      <div className="occ-mono occ-topbar-hint" style={{ fontSize: 9, letterSpacing: "0.24em", color: "rgba(237,235,226,0.42)", display: "flex", gap: 16 }}>
        <span>↑↓ 이동</span><span>ESC ← 뒤로</span><span>스크롤 ↓ 도시에</span>
      </div>
    </div>

    <div className="occ-body">
      <div
        style={{
          width: railOpen ? 260 : 0,
          flexShrink: 0,
          transition: "width .35s cubic-bezier(.4,.0,.2,1)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Roster cast={cast} activeId={activeId} onPick={pick} />
      </div>

      {/* 서랍 토글 핸들 */}
      <button
        type="button"
        onClick={() => setRailOpen((v) => !v)}
        className="occ-mono"
        style={{
          width: 22,
          flexShrink: 0,
          background: "#0B0C0A",
          border: "none",
          borderRight: "1px solid rgba(237,235,226,0.10)",
          color: railOpen ? "rgba(237,235,226,0.4)" : oc.accent,
          cursor: "none",
          fontSize: 11,
          letterSpacing: "0.2em",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          padding: "8px 0",
          transition: "color .2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = oc.accent)}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = railOpen ? "rgba(237,235,226,0.4)" : oc.accent;
        }}
      >
        {railOpen ? "◀ CAST" : "▶ CAST"}
      </button>

      <div className="occ-main">
        <div className="occ-snap"><Stage oc={oc} /></div>
        <div className="occ-snap-end"><Dossier oc={oc} /></div>
      </div>
    </div>
    <CRTCodex />

    {transitioning && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--paper)",
          zIndex: 80,
          animation: "slideInFromLeft .2s cubic-bezier(.6,.0,.2,1) forwards",
          pointerEvents: "none",
        }}
      />
    )}
  </div>
);
}
