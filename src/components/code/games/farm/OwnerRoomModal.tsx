"use client";

// src/components/code/games/farm/OwnerRoomModal.tsx
//
// 농장주 방. 침대를 클릭하면 정산 리포트가 펼쳐지고, 다시 한 번 잠들기 누르면
// commit + 다음 날 06:00 으로 점프.
//
// 두 가지 모드:
//   - voluntary  : 사용자가 직접 침대 클릭. 영업중이면 비활성.
//   - forced     : 02:00 강제 수면 트리거. 모달 자동 열림 + 정산 리포트 바로 펼쳐짐.
//
// 침대 자리는 일단 SVG 스케치. 도트 소스 받으면 그걸로 교체할 수 있게
// BedSpot 컴포넌트로 추출.

import { useEffect, useState } from "react";
import type { FarmClock } from "./useFarmClock";

export type SettlementSummary = {
  visits: number;
  births: number;
  /** 메모리 누적 방문료 (정산 시점에 farm_saves.money 로 commit 될 금액) */
  moneyDelta: number;
  /** 오늘 판매 수익 (이미 farm_saves 에 반영됨, 표시용) */
  sellsTotal: number;
  /** 오늘 송환 명성 (이미 farm_saves 에 반영됨, 표시용) */
  sireFame: number;
  roomsBought: number;
  roomsCost: number;
};

type Props = {
  clock: FarmClock;
  summary: SettlementSummary;
  /** 강제 수면(02:00 트리거)으로 자동 열린 경우 */
  forced?: boolean;
  /** 닫기 — voluntary 케이스에서만 의미. forced 면 정산 후만 닫힘. */
  onClose: () => void;
  /** 잠들기 확정 — 정산 commit + 06:00 점프 */
  onSleep: () => Promise<void> | void;
};

const PANEL = {
  bg: "#FFF8E0",
  paper: "#FAF3E0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  inkFaint: "#8B7E66",
  line: "rgba(61,47,31,0.18)",
  lineSolid: "rgba(61,47,31,0.5)",
  blue: "#224889",
  bluePale: "#E1EAFF",
  neon: "#8FE600",
  pink: "#D14D8A",
  warn: "#E8714D",
  night: "#3D2F1F",
} as const;

export default function OwnerRoomModal({
  clock,
  summary,
  forced = false,
  onClose,
  onSleep,
}: Props) {
  // forced 면 처음부터 정산 펼쳐진 상태로 시작
  const [showReport, setShowReport] = useState<boolean>(forced);
  const [busy, setBusy] = useState(false);

  const canSleep = clock.phase !== "open" && clock.phase !== "morning";

  // ESC — forced 면 무시
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (forced && !showReport) return; // 사실상 forced 는 항상 showReport
      if (busy) return;
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, forced, showReport, busy]);

  const handleSleep = async () => {
    setBusy(true);
    try {
      await onSleep();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      {/* 백드롭 — forced 면 더 짙게 */}
      <div
        onClick={forced ? undefined : onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: forced ? "rgba(0,0,0,0.55)" : "rgba(34,72,137,0.35)",
          backdropFilter: "blur(3px)",
          animation: "fadeIn .3s ease both",
        }}
      />

      <div
        style={{
          position: "relative",
          background: PANEL.bg,
          border: `2px solid ${PANEL.blue}`,
          borderRadius: 8,
          width: "100%",
          maxWidth: 460,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(34,72,137,0.4)",
          animation: "modalPop .35s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: "16px 22px 12px",
            background: forced ? PANEL.night : PANEL.bluePale,
            color: forced ? "#E4FFB0" : PANEL.ink,
            borderBottom: `2px solid ${PANEL.blue}`,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            transition: "background .5s ease",
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            {forced ? "강제 수면" : "내 방"}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.22em",
              fontWeight: 700,
              opacity: 0.7,
            }}
          >
            {forced ? "FORCED · 02:00" : "OWNER'S ROOM"}
          </span>
          <span
            className="font-mono"
            style={{
              marginLeft: "auto",
              fontSize: 11,
              letterSpacing: "0.08em",
              opacity: 0.8,
            }}
          >
            {clock.hhmm} · DAY {clock.day}
          </span>
        </header>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "18px 22px 22px" }}>
          <BedSpot
            canSleep={canSleep}
            forced={forced}
            showReport={showReport}
            onApproach={() => setShowReport(true)}
          />

          {showReport ? (
            <SettlementReport summary={summary} />
          ) : !canSleep ? (
            <NoticeBox
              tone="warn"
              text="영업 중에는 잘 수 없어요. 폐점(18:00) 이후 다시 와요."
            />
          ) : (
            <NoticeBox tone="info" text="침대를 눌러 하루를 마치고 잠들 수 있어요." />
          )}
        </div>

        {/* Footer */}
        {showReport && (
          <footer
            style={{
              padding: "12px 22px 16px",
              borderTop: `1px dashed ${PANEL.line}`,
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            {!forced && (
              <button
                type="button"
                onClick={busy ? undefined : onClose}
                disabled={busy}
                className="font-mono"
                style={{
                  background: "transparent",
                  border: `1px solid ${PANEL.line}`,
                  color: PANEL.inkSoft,
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  fontWeight: 700,
                  padding: "8px 14px",
                  cursor: busy ? "wait" : "pointer",
                  borderRadius: 3,
                }}
              >
                나중에
              </button>
            )}
            <button
              type="button"
              onClick={busy ? undefined : handleSleep}
              disabled={busy}
              className="font-mono"
              style={{
                background: PANEL.night,
                border: `1.5px solid ${PANEL.night}`,
                color: "#E4FFB0",
                fontSize: 11,
                letterSpacing: "0.18em",
                fontWeight: 700,
                padding: "9px 22px",
                cursor: busy ? "wait" : "pointer",
                borderRadius: 3,
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}
            >
              {busy ? "잠드는 중…" : forced ? "정산하고 일어나기" : "잠들기"}
            </button>
          </footer>
        )}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalPop {
          from { transform: scale(.94) translateY(10px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes bedGlow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(143,230,0,0.0)); }
          50%      { filter: drop-shadow(0 0 12px rgba(143,230,0,0.7)); }
        }
        @keyframes zSoft {
          0%   { opacity: 0; transform: translate(0, 4px) scale(0.8); }
          50%  { opacity: 1; transform: translate(-4px, -6px) scale(1); }
          100% { opacity: 0; transform: translate(-10px, -16px) scale(1.1); }
        }
      `}</style>
    </div>
  );
}

// ── 침대 영역 ───────────────────────────────────────────────────────────
//
// 도트 소스 받으면 이 컴포넌트만 교체하면 됨. 현재는 SVG 스케치.
function BedSpot({
  canSleep,
  forced,
  showReport,
  onApproach,
}: {
  canSleep: boolean;
  forced: boolean;
  showReport: boolean;
  onApproach: () => void;
}) {
  const clickable = canSleep && !showReport && !forced;
  return (
    <div
      onClick={clickable ? onApproach : undefined}
      style={{
        position: "relative",
        height: 130,
        margin: "0 auto 16px",
        background:
          "linear-gradient(180deg, rgba(34,72,137,0.05) 0%, rgba(34,72,137,0.10) 100%)",
        border: "1px dashed rgba(34,72,137,0.25)",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: clickable ? "pointer" : "default",
        overflow: "hidden",
        transition: "background .3s ease",
      }}
      title={clickable ? "침대로 가기" : undefined}
    >
      {/* 농장주 이모지 (도트 받기 전 폴백) */}
      <span
        style={{
          position: "absolute",
          left: "22%",
          top: "30%",
          fontSize: 32,
          filter: showReport ? "saturate(.6) brightness(.8)" : "none",
          transition: "filter .4s ease",
        }}
        aria-hidden
      >
        🧑‍🌾
      </span>

      {/* 침대 SVG — 단순한 도트풍 스케치 */}
      <svg
        viewBox="0 0 120 60"
        width="180"
        height="90"
        style={{
          display: "block",
          marginLeft: 30,
          animation: clickable ? "bedGlow 2.2s ease-in-out infinite" : "none",
        }}
      >
        {/* 매트리스 */}
        <rect x="6" y="20" width="108" height="28" rx="3" fill="#F5EBC4" stroke="#6B5942" strokeWidth="1.5" />
        {/* 베개 */}
        <rect x="12" y="14" width="32" height="14" rx="2" fill="#FFFFFF" stroke="#6B5942" strokeWidth="1.5" />
        {/* 이불 */}
        <rect x="48" y="22" width="62" height="24" rx="2" fill="#E1EAFF" stroke="#224889" strokeWidth="1.5" />
        {/* 다리 */}
        <rect x="8" y="48" width="6" height="8" fill="#6B5942" />
        <rect x="106" y="48" width="6" height="8" fill="#6B5942" />
        {/* zZz (잠 표시) */}
        {showReport && (
          <g style={{ animation: "zSoft 1.6s ease-out infinite" }}>
            <text x="92" y="14" fontSize="11" fontWeight="700" fill="#224889" fontFamily="monospace">
              z
            </text>
            <text x="98" y="9" fontSize="9" fontWeight="700" fill="#224889" fontFamily="monospace">
              z
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ── 정산 리포트 ─────────────────────────────────────────────────────────
function SettlementReport({ summary }: { summary: SettlementSummary }) {
  const totalGain = summary.moneyDelta + summary.sellsTotal - summary.roomsCost;

  return (
    <div
      style={{
        background: PANEL.paper,
        border: `1px solid ${PANEL.line}`,
        borderRadius: 6,
        padding: 14,
        animation: "fadeIn .35s ease both",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          paddingBottom: 6,
          marginBottom: 10,
          borderBottom: `1px dashed ${PANEL.line}`,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: PANEL.blue }}>
          오늘의 정산
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 9,
            color: PANEL.inkFaint,
            letterSpacing: "0.22em",
            fontWeight: 700,
          }}
        >
          DAILY REPORT
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <Row label="방문 손님" value={`${summary.visits}명`} />
        <Row label="방문료 수입" value={`+${summary.moneyDelta}₵`} accent={summary.moneyDelta > 0} />
        <Row label="출생한 새 식구" value={`${summary.births}명`} />
        <Row label="판매 수익" value={`+${summary.sellsTotal}₵`} accent={summary.sellsTotal > 0} />
         {summary.roomsBought > 0 && (
          <Row label={`방 확장 (${summary.roomsBought}칸)`} value={`−${summary.roomsCost}₵`} tone="warn" />
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${PANEL.line}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontSize: 12, color: PANEL.inkSoft, fontWeight: 600 }}>
          오늘 총 수입
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: totalGain > 0 ? "#3D5500" : PANEL.inkFaint,
            letterSpacing: "0.03em",
          }}
        >
          {totalGain > 0 ? "+" : ""}
          {totalGain}₵
        </span>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  accent,
  tone = "green",
}: {
  label: string;
  value: string;
  accent?: boolean;
  tone?: "green" | "pink" | "warn";
}) {
  const valueColor =
    tone === "warn"
      ? PANEL.warn
      : accent
        ? tone === "pink"
          ? PANEL.pink
          : "#3D5500"
        : PANEL.ink;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        padding: "2px 0",
        fontSize: 12,
      }}
    >
      <span style={{ color: PANEL.inkSoft }}>{label}</span>
      <span
        className="font-mono"
        style={{ color: valueColor, fontWeight: accent ? 700 : 600, letterSpacing: "0.03em" }}
      >
        {value}
      </span>
    </div>
  );
}

// ── 안내 박스 ───────────────────────────────────────────────────────────
function NoticeBox({ tone, text }: { tone: "info" | "warn"; text: string }) {
  const palette =
    tone === "warn"
      ? {
          bg: "rgba(232,113,77,0.08)",
          border: "rgba(232,113,77,0.45)",
          fg: PANEL.warn,
        }
      : {
          bg: "rgba(34,72,137,0.06)",
          border: "rgba(34,72,137,0.3)",
          fg: PANEL.blue,
        };
  return (
    <div
      style={{
        padding: "12px 14px",
        background: palette.bg,
        border: `1px dashed ${palette.border}`,
        borderRadius: 4,
        fontSize: 12,
        color: palette.fg,
        lineHeight: 1.5,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}