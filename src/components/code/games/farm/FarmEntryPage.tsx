"use client";

// src/components/code/games/farm/FarmEntryPage.tsx
//
// 농장 진입 화면 UI. 코드 아케이드와 동일한 톤(다크 + 형광 녹 + CRT).
// 사용자의 세이브 목록을 카드 그리드로 표시. 카드 클릭 → /[saveId] 농장 화면.
// 마지막 카드는 "+ 새 농장" 으로 /new 라우트로 이동.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import CRTLayer from "@/components/code/CRTLayer";
import "@/components/code/arcade.css";
import type { FarmSaveWithStats } from "@/lib/farm/saves";
import { deactivateSaveAction } from "@/app/code/games/farm/actions";

const NEON = "#B4FF3A";
const DIM = "rgba(180,255,58,0.55)";
const LINE = "rgba(180,255,58,0.3)";

type Props = {
  saves: FarmSaveWithStats[];
};

export default function FarmEntryPage({ saves }: Props) {
  const router = useRouter();
  const [clock, setClock] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const t = window.setInterval(() => {
      const d = new Date();
      setClock(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  const goBackToArcade = () => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(() => router.push("/code"), 200);
  };

  const goToNew = () => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(() => router.push("/code/games/farm/new"), 200);
  };

  const goToSave = (saveId: string) => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(() => router.push(`/code/games/farm/${saveId}`), 200);
  };

  const handleDelete = (saveId: string) => {
    startTransition(async () => {
      await deactivateSaveAction(saveId);
      setConfirmDelete(null);
    });
  };

  return (
    <div
      className="font-mono"
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
      <div
        style={{
          height: 34,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 14px",
          background: "#0B130B",
          borderBottom: `1px solid ${LINE}`,
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: NEON, opacity: 0.85 }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(180,255,58,0.35)" }} />
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: "rgba(180,255,58,0.35)" }} />
        <button
          type="button"
          onClick={goBackToArcade}
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
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(180,255,58,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          ← BACK
        </button>
        <span style={{ flex: 1, textAlign: "center", fontSize: 11, letterSpacing: "0.3em", opacity: 0.7 }}>
          guest@room404 — farm/saves
        </span>
        <span style={{ fontSize: 11, opacity: 0.5 }}>{clock}</span>
      </div>

      {/* content */}
      <div style={{ padding: "32px 36px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontSize: 14, opacity: 0.55, marginBottom: 4 }}>
          <span style={{ color: "#7FD0FF" }}>guest@room404</span>:
          <span style={{ color: "#DAFF85" }}>~/farm</span>$ ls -la saves/
        </div>
        <div style={{ fontSize: 13, opacity: 0.45, marginBottom: 28 }}>
          total {saves.length} · {saves.length === 0 ? "no saves yet" : `${saves.length} farm${saves.length > 1 ? "s" : ""}`}
        </div>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 18 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: 1,
              margin: 0,
            }}
          >
            YOUR FARMS · 내 농장
          </h1>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", color: DIM }}>
            CLICK CARD TO ENTER · ✕ TO DELETE
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {saves.map((save, i) => (
            <SaveCard
              key={save.id}
              save={save}
              onOpen={() => goToSave(save.id)}
              onAskDelete={() => setConfirmDelete(save.id)}
              animationDelay={i * 0.05}
            />
          ))}
          <NewFarmCard onClick={goToNew} animationDelay={saves.length * 0.05} />
        </div>
      </div>

      <CRTLayer strength={0.6} tint="#d6ffd6" radius={0} fixed />

      {/* exit overlay */}
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

      {/* delete confirm modal */}
      {confirmDelete && (
        <ConfirmModal
          save={saves.find((s) => s.id === confirmDelete)!}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => handleDelete(confirmDelete)}
        />
      )}
    </div>
  );
}

// ── 세이브 카드 ─────────────────────────────────────────────────────────

function SaveCard({
  save,
  onOpen,
  onAskDelete,
  animationDelay,
}: {
  save: FarmSaveWithStats;
  onOpen: () => void;
  onAskDelete: () => void;
  animationDelay: number;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: hover ? "rgba(180,255,58,0.06)" : "rgba(180,255,58,0.02)",
        border: `1px solid ${hover ? NEON : LINE}`,
        padding: 18,
        cursor: "pointer",
        transition: "transform .18s cubic-bezier(.2,.7,.3,1), border .15s, background .15s",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        animation: `arcRow .4s ${animationDelay}s both`,
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAskDelete();
        }}
        className="font-mono"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          background: "transparent",
          border: `1px solid ${LINE}`,
          color: DIM,
          fontSize: 9,
          width: 22,
          height: 22,
          cursor: "pointer",
          opacity: hover ? 1 : 0,
          transition: "opacity .15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#FF6B5B";
          e.currentTarget.style.borderColor = "#FF6B5B";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = DIM;
          e.currentTarget.style.borderColor = LINE;
        }}
        title="삭제"
      >
        ✕
      </button>

      <div style={{ fontSize: 10, letterSpacing: "0.2em", color: DIM, marginBottom: 6 }}>
        LVL {String(save.level).padStart(2, "0")} · {timeAgo(save.updated_at)}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1, marginBottom: 4 }}>{save.farm_name}</div>
      <div style={{ fontSize: 12, color: DIM, marginBottom: 18 }}>— {save.character_name}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11 }}>
        <Stat label="동물" value={`${save.animal_count}`} />
        <Stat label="돈" value={`₵${save.money}`} />
        <Stat label="명성" value={`${save.fame}`} />
        <Stat label="일차" value={`D${save.current_day}`} />
      </div>

      <div
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: `1px dashed ${LINE}`,
          fontSize: 10,
          letterSpacing: "0.15em",
          color: hover ? NEON : DIM,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          transition: "color .15s",
        }}
      >
        <span>ENTER ↵</span>
        <span style={{ transform: hover ? "translateX(2px)" : "translateX(0)", transition: "transform .15s" }}>→</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0" }}>
      <span style={{ color: DIM }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// ── 새 농장 카드 ────────────────────────────────────────────────────────

function NewFarmCard({ onClick, animationDelay }: { onClick: () => void; animationDelay: number }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "rgba(180,255,58,0.10)" : "transparent",
        border: `1.5px dashed ${hover ? NEON : LINE}`,
        padding: 18,
        cursor: "pointer",
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        transition: "all .18s cubic-bezier(.2,.7,.3,1)",
        transform: hover ? "translateY(-2px)" : "translateY(0)",
        animation: `arcRow .4s ${animationDelay}s both`,
      }}
    >
      <div
        style={{
          fontSize: 38,
          fontWeight: 300,
          opacity: hover ? 1 : 0.7,
          transition: "opacity .15s",
        }}
      >
        +
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em" }}>새 농장 시작</div>
      <div style={{ fontSize: 10, color: DIM, letterSpacing: "0.2em" }}>NEW SAVE</div>
    </div>
  );
}

// ── 삭제 확인 모달 ──────────────────────────────────────────────────────

function ConfirmModal({
  save,
  onCancel,
  onConfirm,
}: {
  save: FarmSaveWithStats;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={onCancel}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(3,6,3,0.78)",
          animation: "arcOnFade .3s ease both",
        }}
      />
      <div
        style={{
          position: "relative",
          background: "#070C07",
          border: `1px solid ${NEON}`,
          padding: 24,
          minWidth: 360,
          animation: "arcOn .4s cubic-bezier(.2,.8,.2,1) both",
          transformOrigin: "center",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.2em", color: DIM, marginBottom: 8 }}>
          CONFIRM · 삭제 확인
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{save.farm_name}</div>
        <div style={{ fontSize: 12, color: DIM, marginBottom: 16 }}>— {save.character_name} · LVL {save.level}</div>
        <div style={{ fontSize: 13, lineHeight: 1.6, color: "rgba(180,255,58,0.85)", marginBottom: 18 }}>
          이 농장을 삭제하시겠어요? 동물 {save.animal_count}마리도 함께 사라집니다.
          <br />
          <span style={{ color: DIM, fontSize: 11 }}>(soft delete — DB엔 보존됨)</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={onCancel}
            className="font-mono"
            style={{
              flex: 1,
              background: "transparent",
              border: `1px solid ${LINE}`,
              color: NEON,
              padding: "10px 0",
              fontSize: 12,
              letterSpacing: "0.18em",
              cursor: "pointer",
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="font-mono"
            style={{
              flex: 1,
              background: "#FF6B5B",
              color: "#0A0A0A",
              border: "none",
              padding: "10px 0",
              fontSize: 12,
              letterSpacing: "0.18em",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 시간 표시 ───────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString("ko-KR");
}