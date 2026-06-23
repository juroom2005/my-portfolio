"use client";

// src/components/code/games/farm/DebugPanel.tsx
//
// 우하단에 떠 있는 디버그 패널. 시간 점프 / 일시정지 토글 / 기타 디버그 액션.
// 기본은 접힘 상태로 시작 — "DEBUG" 버튼 클릭하면 펼침.

import { useState } from "react";
import type { FarmClock } from "./useFarmClock";
import { TICK_WAKE, TICK_OPEN, TICK_CLOSE } from "./dbTypes";

const PANEL = {
  bg: "#FFF8E0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  border: "#224889",
  borderSoft: "rgba(34,72,137,0.35)",
  hot: "#E8714D",
};

type Props = {
  clock: FarmClock;
};

export default function DebugPanel({ clock }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-mono"
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 80,
          background: PANEL.bg,
          border: `1.5px solid ${PANEL.border}`,
          color: PANEL.border,
          fontSize: 10,
          letterSpacing: "0.22em",
          fontWeight: 700,
          padding: "6px 12px",
          cursor: "pointer",
          borderRadius: 3,
          boxShadow: "0 6px 16px rgba(34,72,137,0.18)",
        }}
      >
        DEBUG ▸
      </button>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        right: 16,
        bottom: 16,
        zIndex: 80,
        background: PANEL.bg,
        border: `1.5px solid ${PANEL.border}`,
        borderRadius: 4,
        boxShadow: "0 12px 32px rgba(34,72,137,0.25)",
        padding: 12,
        width: 280,
        animation: "debugPanelPop .2s cubic-bezier(.2,.8,.2,1) both",
      }}
    >
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: `1px dashed ${PANEL.borderSoft}`,
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: 10,
            letterSpacing: "0.22em",
            fontWeight: 700,
            color: PANEL.border,
          }}
        >
          DEBUG · 시간 점프
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono"
          style={{
            background: "transparent",
            border: "none",
            color: PANEL.inkSoft,
            fontSize: 14,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
          }}
          title="접기"
          aria-label="접기"
        >
          ✕
        </button>
      </div>

      {/* 현재 시각 */}
      <div
        className="font-mono"
        style={{
          fontSize: 10,
          color: PANEL.inkSoft,
          marginBottom: 10,
          letterSpacing: "0.1em",
        }}
      >
        현재: DAY {String(clock.day).padStart(3, "0")} · {clock.hhmm} ·{" "}
        <span style={{ color: PANEL.border }}>{clock.phaseLabel}</span>
      </div>

      {/* 작은 점프 */}
      <Row label="짧게">
        <DBtn onClick={() => clock.jumpTicks(1)}>+1틱</DBtn>
        <DBtn onClick={() => clock.jumpTicks(6)}>+1시간</DBtn>
        <DBtn onClick={() => clock.jumpTicks(36)}>+6시간</DBtn>
      </Row>

      {/* 시점 이동 */}
      <Row label="시점으로">
        <DBtn onClick={() => clock.jumpToTick(TICK_WAKE)}>아침</DBtn>
        <DBtn onClick={() => clock.jumpToTick(TICK_OPEN)}>개점</DBtn>
        <DBtn onClick={() => clock.jumpToTick(TICK_CLOSE)}>폐점</DBtn>
        <DBtn onClick={() => clock.jumpToTick(0)}>자정</DBtn>
      </Row>

      {/* 일자 */}
      <Row label="일자">
        <DBtn onClick={() => clock.jumpDays(1)}>+1일</DBtn>
        <DBtn onClick={() => clock.jumpDays(7)}>+7일</DBtn>
        <DBtn onClick={() => clock.jumpDays(30)} variant="hot">
          +30일
        </DBtn>
      </Row>

      {/* 컨트롤 */}
      <Row label="컨트롤">
        <DBtn onClick={clock.togglePaused}>
          {clock.paused ? "▶ 재생" : "❚❚ 정지"}
        </DBtn>
      </Row>

      <style>{`
        @keyframes debugPanelPop {
          from { transform: translateY(6px) scale(.98); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── 행 ─────────────────────────────────────────────────────────────────
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 1fr",
        gap: 8,
        alignItems: "center",
        marginBottom: 6,
      }}
    >
      <span
        className="font-mono"
        style={{
          fontSize: 9,
          color: PANEL.inkSoft,
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

// ── 버튼 ───────────────────────────────────────────────────────────────
function DBtn({
  children,
  onClick,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "hot";
}) {
  const hot = variant === "hot";
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono"
      style={{
        background: "transparent",
        border: `1px solid ${hot ? PANEL.hot : PANEL.borderSoft}`,
        color: hot ? PANEL.hot : PANEL.ink,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "4px 8px",
        cursor: "pointer",
        borderRadius: 3,
        transition: "background .12s, color .12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = hot ? "rgba(232,113,77,0.12)" : "rgba(34,72,137,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}