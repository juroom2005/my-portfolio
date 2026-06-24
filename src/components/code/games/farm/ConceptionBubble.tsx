"use client";

// src/components/code/games/farm/ConceptionBubble.tsx
//
// 임신 판별 순간 방 위에 뜨는 말풍선.
//   success: 정자가 난자로 들어가는 SVG → 하트 → "임신!" 페이드아웃
//   fail:    정자가 난자에 튕겨나가는 SVG → "…" 페이드아웃
//
// 약 2.4초 재생 후 onDone 호출 → 부모가 제거.

import { useEffect } from "react";

type Props = {
  success: boolean;
  /** 방 중앙 기준 화면 좌표 (px) */
  x: number;
  y: number;
  motherName: string | null;
  sireName?: string;
  onDone: () => void;
};

export default function ConceptionBubble({
  success,
  x,
  y,
  motherName,
  sireName,
  onDone,
}: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2800);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        left: x,
        top: y,
        transform: "translate(-50%, -100%)",
        zIndex: 88,
        pointerEvents: "none",
        animation: "concPop 2.8s both",
      }}
    >
      <div
        style={{
          position: "relative",
          background: success ? "#FFF1F4" : "#F3ECD6",
          border: `2px solid ${success ? "#FF8FA8" : "#C9A876"}`,
          borderRadius: 14,
          padding: "10px 14px 8px",
          minWidth: 132,
          boxShadow: "0 8px 20px rgba(34,72,137,0.2)",
          textAlign: "center",
        }}
      >
        {/* SVG */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>
          {success ? <FertilizeSuccess /> : <FertilizeFail />}
        </div>

        {/* 텍스트 */}
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: success ? "#C2185B" : "#6B5942",
          }}
        >
          {success ? "임신했어요!" : "이번엔 소식이…"}
        </div>
        {success && (
          <div className="font-mono" style={{ fontSize: 9, color: "#8B7E66", marginTop: 2 }}>
            {(motherName ?? "이름 없음")} ♀ × {sireName ?? "buck"} ♂
          </div>
        )}

        {/* 말풍선 꼬리 */}
        <div
          style={{
            position: "absolute",
            bottom: -9,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: `9px solid ${success ? "#FF8FA8" : "#C9A876"}`,
          }}
        />
      </div>

      <style>{`
        @keyframes concPop {
          0%   { transform: translate(-50%, -84%) scale(.4); opacity: 0; }
          10%  { transform: translate(-50%, -104%) scale(1.18); opacity: 1; }
          16%  { transform: translate(-50%, -98%) scale(.94); }
          22%  { transform: translate(-50%, -101%) scale(1.04); }
          28%  { transform: translate(-50%, -100%) scale(1); }
          84%  { transform: translate(-50%, -100%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -124%) scale(.92); opacity: 0; }
        }
        /* 정자: 빠르게 다가왔다 멈칫 → 쏙 빨려들어감 */
        @keyframes concSperm {
          0%   { transform: translate(22px, -16px) rotate(-28deg); opacity: 0; }
          18%  { opacity: 1; }
          42%  { transform: translate(6px, -4px) rotate(-28deg); }
          52%  { transform: translate(9px, -6px) rotate(-28deg); }
          70%  { transform: translate(0, 0) rotate(-28deg) scale(1); opacity: 1; }
          82%  { transform: translate(-1px, 1px) rotate(-28deg) scale(.5); opacity: .7; }
          100% { transform: translate(-2px, 2px) rotate(-28deg) scale(.3); opacity: 0; }
        }
        /* 실패 정자: 부딪히고 통 튕겨나감 */
        @keyframes concSpermFail {
          0%   { transform: translate(22px, -16px) rotate(-28deg); opacity: 0; }
          22%  { opacity: 1; }
          46%  { transform: translate(3px, -1px) rotate(-28deg); }
          54%  { transform: translate(7px, -3px) rotate(-20deg); }
          60%  { transform: translate(2px, -1px) rotate(-26deg); }
          78%  { transform: translate(18px, -12px) rotate(-4deg); opacity: 1; }
          100% { transform: translate(30px, -22px) rotate(12deg); opacity: 0; }
        }
        /* 수정 글로우: 두 번 펄스 */
        @keyframes concGlow {
          0%, 64%  { opacity: 0; transform: scale(0.5); }
          70%      { opacity: 1; transform: scale(1.25); }
          78%      { opacity: .4; transform: scale(1.0); }
          85%      { opacity: .9; transform: scale(1.3); }
          100%     { opacity: 0; transform: scale(1.55); }
        }
        /* 핵: 들어온 뒤 부풀었다 정착 + 색 변화 */
        @keyframes concNucleus {
          0%, 64% { fill: #E8A93F; transform: scale(1); }
          72%     { fill: #FF6B9D; transform: scale(1.35); }
          80%     { transform: scale(.92); }
          88%     { transform: scale(1.08); }
          100%    { fill: #FF6B9D; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ── 성공 SVG: 정자가 난자 핵으로 ──────────────────────────────────────
function FertilizeSuccess() {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
      {/* 난자 외막 */}
      <circle cx="26" cy="24" r="20" fill="#FFFFFF" stroke="#3D2F1F" strokeWidth="1.5" />
      <circle cx="26" cy="24" r="15" fill="#D8D8D8" stroke="#3D2F1F" strokeWidth="1" />
      {/* 핵 (성공 시 분홍으로) */}
      <circle
        cx="26"
        cy="24"
        r="6.5"
        style={{ transformOrigin: "26px 24px", animation: "concNucleus 2.8s ease-out both" }}
      />
      {/* 수정 글로우 */}
      <circle
        cx="26"
        cy="24"
        r="9"
        fill="none"
        stroke="#FF6B9D"
        strokeWidth="2"
        style={{ transformOrigin: "26px 24px", animation: "concGlow 2.8s ease-out both" }}
      />
      {/* 정자 */}
      <g style={{ transformOrigin: "44px 14px", animation: "concSperm 2.8s ease-out both" }}>
        <circle cx="44" cy="14" r="4" fill="#FFF" stroke="#3D2F1F" strokeWidth="1.5" />
        <path
          d="M48 14 Q54 10 56 16 Q58 22 62 18"
          fill="none"
          stroke="#3D2F1F"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

// ── 실패 SVG: 정자가 튕겨나감 ─────────────────────────────────────────
function FertilizeFail() {
  return (
    <svg width="64" height="48" viewBox="0 0 64 48" fill="none">
      <circle cx="26" cy="24" r="20" fill="#FFFFFF" stroke="#3D2F1F" strokeWidth="1.5" />
      <circle cx="26" cy="24" r="15" fill="#D8D8D8" stroke="#3D2F1F" strokeWidth="1" />
      <circle cx="26" cy="24" r="6.5" fill="#B5A98C" />
      <g style={{ transformOrigin: "44px 14px", animation: "concSpermFail 2.8s ease-out both" }}>
        <circle cx="44" cy="14" r="4" fill="#FFF" stroke="#3D2F1F" strokeWidth="1.5" />
        <path
          d="M48 14 Q54 10 56 16 Q58 22 62 18"
          fill="none"
          stroke="#3D2F1F"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}