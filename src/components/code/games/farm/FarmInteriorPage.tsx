"use client";

// src/components/code/games/farm/FarmInteriorPage.tsx
//
// 농장 본 화면.
//   [상단 바: 시계 / 일자 / 돈 / 명성 / 레벨 / PAUSE / BACK]
//   ┌─────────────────────────────────────────┬───────────────┐
//   │           단면도 농장 집                  │   Nursery     │
//   │           (CodePen 지붕 + 트인 본체)      │   사이드 패널  │
//   └─────────────────────────────────────────┴───────────────┘

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FarmSaveRow, RoomRow, AnimalRow } from "./dbTypes";
import { TICKS_PER_DAY, TICK_OPEN, TICK_CLOSE, nurseryCapacity } from "./dbTypes";
import AnimalCard from "./AnimalCard";
import CrossSectionHouse from "./CrossSectionHouse";
import AnimalDetailModal from "./AnimalDetailModal";
import DebugPanel from "./DebugPanel";
import { useFarmClock, type FarmClock } from "./useFarmClock";

// ── 농장 톤 팔레트 ──────────────────────────────────────────────────────
const FARM = {
  bg: "#FAF3E0",
  bgWarm: "#F5EBC4",
  paper: "#FFF8E0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  inkFaint: "#8B7E66",
  line: "rgba(61,47,31,0.18)",
  lineSolid: "rgba(61,47,31,0.5)",
  neon: "#B4FF3A",
  neonDeep: "#8FE600",
  neonSoft: "#E4FFB0",
  warn: "#E8714D",
  night: "#3D2F1F",
} as const;

type Props = {
  save: FarmSaveRow;
  rooms: RoomRow[];
  roomAnimals: AnimalRow[];
  nurseryAnimals: AnimalRow[];
};

export default function FarmInteriorPage({ save, rooms, roomAnimals, nurseryAnimals }: Props) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalRow | null>(null);

  const clock = useFarmClock({
    saveId: save.id,
    initialDay: save.current_day,
    initialTick: save.tick_of_day,
  });

  const goBack = () => {
    if (transitioning) return;
    setTransitioning(true);
    window.setTimeout(() => router.push("/code/games/farm"), 250);
  };

  const nurseryCap = nurseryCapacity(save.level);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: FARM.bg,
        color: FARM.ink,
        fontFamily: "var(--font-sans)",
        animation: "slideInFromRight .4s cubic-bezier(.6,.0,.2,1) both",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopBar save={save} clock={clock} onBack={goBack} />

      <main
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 20,
          padding: "24px 28px 32px",
          maxWidth: 1400,
          width: "100%",
          margin: "0 auto",
          alignItems: "start",
          boxSizing: "border-box",
        }}
      >
        {/* 좌측: 단면도 집 */}
        <section>
          <SectionHeader
            title="농장"
            en="FARMHOUSE"
            subline={`${clock.phaseLabel} · ${clock.hhmm}`}
          />
          <CrossSectionHouse
            level={save.level}
            rooms={rooms}
            roomAnimals={roomAnimals}
            phase={clock.phase}
            currentDay={clock.day}
            onAnimalClick={setSelectedAnimal}
          />
        </section>

        {/* 우측: 보육실 */}
        <aside>
          <SectionHeader
            title="보육실"
            en="NURSERY"
            subline={`${nurseryAnimals.length} / ${nurseryCap}`}
          />
          <NurseryPanel
            animals={nurseryAnimals}
            capacity={nurseryCap}
            currentDay={clock.day}
            onAnimalClick={setSelectedAnimal}
          />
        </aside>
      </main>

      {/* 동물 상세 모달 */}
      {selectedAnimal && (
        <AnimalDetailModal
          animal={selectedAnimal}
          currentDay={clock.day}
          onClose={() => setSelectedAnimal(null)}
        />
      )}

      {/* 디버그 패널 (시간 점프) */}
      <DebugPanel clock={clock} />

      {transitioning && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#060A06",
            zIndex: 90,
            animation: "slideInFromLeft .25s cubic-bezier(.6,.0,.2,1) forwards",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ── 상단 바 ─────────────────────────────────────────────────────────────
function TopBar({
  save,
  clock,
  onBack,
}: {
  save: FarmSaveRow;
  clock: FarmClock;
  onBack: () => void;
}) {
  const isOpen = clock.tick >= TICK_OPEN && clock.tick < TICK_CLOSE;
  return (
    <header
      style={{
        padding: "14px 28px",
        borderBottom: `1px solid ${FARM.line}`,
        background: FARM.bgWarm,
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="font-mono"
        style={{
          background: "transparent",
          border: `1px solid ${FARM.lineSolid}`,
          color: FARM.ink,
          fontSize: 10,
          letterSpacing: "0.22em",
          fontWeight: 700,
          padding: "5px 12px",
          cursor: "pointer",
        }}
      >
        ← BACK
      </button>

      <div style={{ minWidth: 200 }}>
        <div style={{ fontSize: 18, fontWeight: 700, lineHeight: 1, marginBottom: 2 }}>
          {save.farm_name}
        </div>
        <div
          className="font-mono"
          style={{ fontSize: 10, color: FARM.inkSoft, letterSpacing: "0.05em" }}
        >
          — {save.character_name}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          padding: "8px 16px",
          background: clock.phase === "night" ? FARM.night : FARM.paper,
          border: `1px solid ${clock.phase === "night" ? FARM.night : FARM.line}`,
          borderRadius: 3,
          transition: "background .8s ease, border-color .8s ease",
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.05em",
            color: clock.phase === "night" ? FARM.neonSoft : FARM.ink,
            transition: "color .8s ease",
          }}
        >
          {clock.hhmm}
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: clock.phase === "night" ? "rgba(228,255,176,0.7)" : FARM.inkSoft,
            letterSpacing: "0.15em",
          }}
        >
          DAY {String(clock.day).padStart(3, "0")} · {clock.phaseLabel}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 120 }}>
        <DayProgress tick={clock.tick} />
      </div>

      <div
        title={isOpen ? "영업중" : "영업 외 시간"}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: FARM.inkSoft,
          letterSpacing: "0.1em",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: isOpen ? FARM.neonDeep : "rgba(61,47,31,0.25)",
            boxShadow: isOpen ? "0 0 6px rgba(143,230,0,0.6)" : "none",
            transition: "all .4s ease",
          }}
        />
        {isOpen ? "OPEN" : "CLOSED"}
      </div>

      <div style={{ display: "flex", gap: 14 }}>
        <Stat label="LVL" value={String(save.level)} />
        <Stat label="₵" value={String(save.money)} />
        <Stat label="명성" value={String(save.fame)} />
      </div>

      <button
        type="button"
        onClick={clock.togglePaused}
        className="font-mono"
        style={{
          background: clock.paused ? FARM.neon : "transparent",
          border: `1px solid ${clock.paused ? FARM.neonDeep : FARM.lineSolid}`,
          color: FARM.ink,
          fontSize: 10,
          letterSpacing: "0.22em",
          fontWeight: 700,
          padding: "6px 14px",
          cursor: "pointer",
          transition: "all .15s",
        }}
        title={clock.paused ? "시간을 다시 흐르게" : "시간을 멈춤"}
      >
        {clock.paused ? "▶ PLAY" : "❚❚ PAUSE"}
      </button>
    </header>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <span
        className="font-mono"
        style={{ fontSize: 9, color: FARM.inkFaint, letterSpacing: "0.2em" }}
      >
        {label}
      </span>
      <span style={{ fontSize: 15, fontWeight: 700, color: FARM.ink, lineHeight: 1.1 }}>
        {value}
      </span>
    </div>
  );
}

// ── 하루 진행률 바 ──────────────────────────────────────────────────────
function DayProgress({ tick }: { tick: number }) {
  const pct = (tick / TICKS_PER_DAY) * 100;
  const openPctStart = (TICK_OPEN / TICKS_PER_DAY) * 100;
  const openPctEnd = (TICK_CLOSE / TICKS_PER_DAY) * 100;
  return (
    <div style={{ position: "relative", height: 18, padding: "5px 0" }}>
      <div
        style={{
          position: "relative",
          height: 8,
          background: FARM.paper,
          border: `1px solid ${FARM.line}`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: `${openPctStart}%`,
            width: `${openPctEnd - openPctStart}%`,
            top: 0,
            bottom: 0,
            background: "rgba(143,230,0,0.18)",
            borderLeft: "1px dashed rgba(143,230,0,0.55)",
            borderRight: "1px dashed rgba(143,230,0,0.55)",
          }}
        />
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: FARM.neonDeep,
            transition: "width .5s linear",
          }}
        />
      </div>
    </div>
  );
}


// ── 보육실 패널 ─────────────────────────────────────────────────────────
function NurseryPanel({
  animals,
  capacity,
  currentDay,
  onAnimalClick,
}: {
  animals: AnimalRow[];
  capacity: number;
  currentDay: number;
  onAnimalClick?: (animal: AnimalRow) => void;
}) {
  return (
    <div
      style={{
        background: FARM.bgWarm,
        border: `1px solid ${FARM.line}`,
        borderRadius: 6,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        position: "sticky",
        top: 16,
        maxHeight: "calc(100dvh - 120px)",
        overflowY: "auto",
      }}
    >
      {animals.length === 0 ? (
        <div
          style={{
            padding: "40px 12px",
            textAlign: "center",
            color: FARM.inkFaint,
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          보육실이 비어있어요.
          <br />
          새 식구가 태어나면 여기에 모입니다.
        </div>
      ) : (
        animals.map((a: AnimalRow) => (
          <AnimalCard
            key={a.id}
            animal={a}
            currentDay={currentDay}
            variant="compact"
            onClick={onAnimalClick ? () => onAnimalClick(a) : undefined}
          />
        ))
      )}

      {animals.length < capacity && animals.length > 0 && (
        <div
          className="font-mono"
          style={{
            padding: "8px 12px",
            border: `1px dashed ${FARM.line}`,
            color: FARM.inkFaint,
            fontSize: 10,
            letterSpacing: "0.1em",
            textAlign: "center",
          }}
        >
          빈 슬롯 {capacity - animals.length}
        </div>
      )}
    </div>
  );
}

// ── 섹션 헤더 / 캡션 ────────────────────────────────────────────────────
function SectionHeader({ title, en, subline }: { title: string; en: string; subline?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingBottom: 8,
        borderBottom: `1px dashed ${FARM.line}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: FARM.ink }}>{title}</h2>
        <span
          className="font-mono"
          style={{ fontSize: 10, color: FARM.inkFaint, letterSpacing: "0.22em", fontWeight: 700 }}
        >
          {en}
        </span>
      </div>
      {subline && (
        <span
          className="font-mono"
          style={{ fontSize: 10, color: FARM.inkSoft, letterSpacing: "0.1em" }}
        >
          {subline}
        </span>
      )}
    </div>
  );
}