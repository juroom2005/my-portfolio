"use client";

// src/components/code/games/farm/FarmInteriorPage.tsx
//
// 농장 본 화면.
//   [상단 바: 시계 / 일자 / 돈 / 명성 / 레벨 / PAUSE / BACK]
//   ┌─────────────────────────────────────────┬───────────────┐
//   │           단면도 농장 집                  │   Nursery     │
//   │           (CodePen 지붕 + 트인 본체)      │   사이드 패널  │
//   └─────────────────────────────────────────┴───────────────┘

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { FarmSaveRow, RoomRow, AnimalRow } from "./dbTypes";
import { TICKS_PER_DAY, TICK_OPEN, TICK_CLOSE,TICK_WAKE, TICK_FORCE_SLEEP, nurseryCapacity } from "./dbTypes";
import AnimalCard from "./AnimalCard";
import CrossSectionHouse from "./CrossSectionHouse";
import AnimalDetailModal from "./AnimalDetailModal";
import DebugPanel from "./DebugPanel";
import WaitingRoom from "./WaitingRoom";
import VisitorMatchDialog from "./VisitorMatchDialog";
import { useFarmClock, type FarmClock } from "./useFarmClock";
import { useVisitorSystem } from "./useVisitorSystem";
import type { Visitor, ActiveVisit } from "./visitorSystem";
import { deriveSeed } from "./visitorSystem";
import { resolvePregnancy, type Pregnancy } from "./pregnancySystem";
import ConceptionBubble from "./ConceptionBubble";
import { savePregnancyAction, birthAction, relocateAnimalAction, sellAnimalAction, sendAnimalToSireAction, commitSettlementAction, renameAnimalAction } from "@/app/code/games/farm/[saveId]/actions";
import { getSpecies } from "./species";
import { getSocialRank } from "./species/humanProfile";
import OwnerRoomModal, { type SettlementSummary } from "./OwnerRoomModal";

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

type ConceptionBubbleState = {
  id: string;
  success: boolean;
  x: number;
  y: number;
  motherName: string | null;
  sireName?: string;
};

// 방 DOM 의 화면 중앙 좌표 (말풍선 띄울 위치)
function roomCenterCoord(roomId: string): { x: number; y: number } {
  if (typeof document === "undefined") return { x: 0, y: 0 };
  const el = document.querySelector(`[data-room-id="${roomId}"]`);
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + 8 };
}

// 동물 metadata 에서 진행 중인 임신 추출
function extractPregnancies(animals: AnimalRow[]): Pregnancy[] {
  const out: Pregnancy[] = [];
  for (const a of animals) {
    const preg = (a.metadata as Record<string, unknown> | null)?.pregnancy;
    if (preg && typeof preg === "object") {
      out.push(preg as Pregnancy);
    }
  }
  return out;
}



export default function FarmInteriorPage({ save, rooms, roomAnimals, nurseryAnimals }: Props) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalRow | null>(null);
  /** 손님 방문료 누적 — 페이지 머무는 동안만 (DB 영속은 다음 iteration) */
  const [moneyDelta, setMoneyDelta] = useState(0);
  /** 진행 중인 임신들 — animal.metadata.pregnancy 에서 초기화 */
  const [pregnancies, setPregnancies] = useState<Pregnancy[]>(() =>
    extractPregnancies(roomAnimals),
  );
  /** 화면에 떠 있는 수정 말풍선들 */
  const [bubbles, setBubbles] = useState<ConceptionBubbleState[]>([]);

  /** 오늘 정산용 누적 카운터 — 잠들 때 리포트로 보여주고 commit 후 리셋 */
  const [dailyCounters, setDailyCounters] = useState({
    births: 0,
    sellsTotal: 0,
    sireFame: 0,
  });

  /** 농장주 방 모달. false 면 닫힘, 'manual' 면 자유 진입, 'forced' 면 02:00 트리거 */
  const [ownerRoom, setOwnerRoom] = useState<false | "manual" | "forced">(false);

  const clock = useFarmClock({
    saveId: save.id,
    initialDay: save.current_day,
    initialTick: save.tick_of_day,
  });

  // 방문 종료 → 임신 판별 + 말풍선
  // (buck 수인 수컷 + 인간 ♂ 게스트 모두 처리. 혼혈 가능)
  const handleVisitEnded = (visit: ActiveVisit) => {
    const inRoom = roomAnimals.filter((a) => a.room_id === visit.roomId);

    // 이미 임신 중인 암컷이 방에 있으면 그 암컷은 제외 (중복 임신 방지)
    const alreadyPregnant = new Set(pregnancies.map((p) => p.motherId));
    const breedable = inRoom.filter((a) => !alreadyPregnant.has(a.id));
    if (breedable.length === 0) return;

    const seed = deriveSeed("preg", save.id, visit.visitor.id, String(visit.roomId));
    const outcome = resolvePregnancy({
      visitor: visit.visitor,
      roomAnimals: breedable,
      currentDay: clock.day,
      seed,
    });

    // 방 화면 좌표 조회
    const coord = roomCenterCoord(visit.roomId);

    if (outcome.pregnant) {
      setPregnancies((prev) => [...prev, outcome.pregnancy]);
      // DB 영속 — 암컷 metadata 에 저장 (새로고침해도 유지)
      void savePregnancyAction(outcome.pregnancy.motherId, outcome.pregnancy);
      setBubbles((prev) => [
        ...prev,
        {
          id: `${visit.visitor.id}-${Date.now()}`,
          success: true,
          x: coord.x,
          y: coord.y,
          motherName: outcome.pregnancy.motherName,
          sireName: outcome.pregnancy.sireName,
        },
      ]);
    } else if (outcome.reason === "roll failed") {
      // 교배 시도는 했으나 수태 실패 — 말풍선만
      // buck 은 같은 종 암컷, 인간 게스트는 아무 종 암컷
      const doe = visit.visitor.type === "buck"
        ? inRoom.find((a) => a.is_adult && a.sex === "F" && a.species === visit.visitor.species)
        : inRoom.find((a) => a.is_adult && a.sex === "F");
      setBubbles((prev) => [
        ...prev,
        {
          id: `${visit.visitor.id}-${Date.now()}`,
          success: false,
          x: coord.x,
          y: coord.y,
          motherName: doe?.name ?? null,
        },
      ]);
    }
    // no matching female 등은 조용히 넘어감 (애초에 매칭 막았어야)
  };

  const visitors = useVisitorSystem({
    saveId: save.id,
    clock,
    rooms,
    roomAnimals,
    fame: save.fame,
    farmLevel: save.level,
    onFeeReceived: (amount: number) => setMoneyDelta((d) => d + amount),
    onVisitEnded: handleVisitEnded,
  });

  // ── 출산 처리 ─────────────────────────────────────────────────────────
  //
  // dueDay 도달한 임신을 birthAction 으로 보육실에 INSERT.
  // 중복 호출 방지: 처리 중인 motherId 를 ref 로 추적.
  const birthingRef = useRef<Set<string>>(new Set());

  const handleBirth = async (p: Pregnancy) => {
    if (birthingRef.current.has(p.motherId)) return;
    birthingRef.current.add(p.motherId);

    // 낙관적 — 임신 패널에서 즉시 제거
    setPregnancies((prev) => prev.filter((x) => x.motherId !== p.motherId));

    // 자식마다 maturity_days 보강 (RPC 가 종 매니페스트를 모르므로)
    const offspringPayload = p.offspring.map((child) => {
      let maturityDays = 7;
      try {
        maturityDays = getSpecies(child.species).maturity_days;
      } catch {
        // unknown species 면 7일 폴백
      }
      return { ...child, maturity_days: maturityDays };
    });

    // 귀족만 사생아 라벨 부여 (평민은 null)
    const bastardOf =
      p.sireSocialRankId && p.sireSocialRankId !== "commoner" ? p.sireSocialRankId : null;

    try {
      await birthAction({
        saveId: save.id,
        motherId: p.motherId,
        offspring: offspringPayload,
        bornOnDay: clock.day,
        sireInfo: {
          name: p.sireName,
          grade: p.sireGrade,
          species: p.sireSpecies,
          socialRankId: p.sireSocialRankId ?? null,
        },
        bastardOf,
      });
      // 보육실/방 동물 다시 불러옴 — 새 새끼가 보육실에 등장
      setDailyCounters((d) => ({ ...d, births: d.births + offspringPayload.length }));
      router.refresh();
    } catch (e) {
      // 실패해도 임신 패널에 복원하지 않음 — 무한 재시도 방지.
      // DB 의 metadata.pregnancy 는 아직 남아있으므로 페이지 새로고침/재진입 시
      // 자동으로 다시 임신 패널에 잡힘 (그때 다시 시도).
      console.error("[handleBirth] error:", e);
    } finally {
      birthingRef.current.delete(p.motherId);
    }
  };

  // clock.day 변동 감지 — dueDay 도달한 임신 일괄 처리
  useEffect(() => {
    const due = pregnancies.filter(
      (p) => clock.day >= p.dueDay && !birthingRef.current.has(p.motherId),
    );
    for (const p of due) {
      void handleBirth(p);
    }
    // pregnancies / save.id 는 stable 한 참조 — handleBirth 안에서만 setPregnancies 호출
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock.day, pregnancies]);

  const displayMoney = save.money + moneyDelta;
  const occupiedRoomIds = new Set(visitors.activeVisits.keys());

  // ── 보육실 졸업 액션 ───────────────────────────────────────────────────
  //
  // 액션 성공 후 router.refresh — 동물 상태/돈/명성 다 다시 fetch.
  // 모달은 selectedAnimal 이 stale 한 row 가 되므로 닫기.

  const availableRoomsForRelocate = useMemo(() => {
    return rooms.filter((r) => {
      // 다른 동물이 있는 방은 제외
      const taken = roomAnimals.some((a) => a.room_id === r.id);
      if (taken) return false;
      // 방문객 활성 중인 방은 제외
      if (occupiedRoomIds.has(r.id)) return false;
      return true;
    });
  }, [rooms, roomAnimals, occupiedRoomIds]);

  const handleRelocate = async (animalId: string, roomId: string) => {
    try {
      await relocateAnimalAction({
        saveId: save.id,
        animalId,
        roomId,
        day: clock.day,
      });
      setSelectedAnimal(null);
      router.refresh();
    } catch (e) {
      console.error("[handleRelocate] error:", e);
    }
  };

  const handleSell = async (animalId: string, price: number) => {
    try {
      await sellAnimalAction({
        saveId: save.id,
        animalId,
        price,
        day: clock.day,
      });
      setSelectedAnimal(null);
      setDailyCounters((d) => ({ ...d, sellsTotal: d.sellsTotal + price }));
      router.refresh();
    } catch (e) {
      console.error("[handleSell] error:", e);
    }
  };

  const handleSendToSire = async (animalId: string, fameGain: number) => {
    try {
      await sendAnimalToSireAction({
        saveId: save.id,
        animalId,
        fameGain,
        day: clock.day,
      });
      setDailyCounters((d) => ({ ...d, sireFame: d.sireFame + fameGain }));
      router.refresh();
    } catch (e) {
      console.error("[handleSendToSire] error:", e);
    }
  };

  const handleRename = async (animalId: string, name: string) => {
    try {
      await renameAnimalAction({ saveId: save.id, animalId, name });
      // 모달이 닫히지 않게 selectedAnimal 의 name 만 낙관적 갱신
      setSelectedAnimal((prev) =>
        prev && prev.id === animalId ? { ...prev, name: name.trim() || null } : prev,
      );
      router.refresh();
    } catch (e) {
      console.error("[handleRename] error:", e);
    }
  };

  // ── 정산 / 잠들기 ─────────────────────────────────────────────────────
//
// 정산 day = 잠든 시점이 자정 전(evening)이면 clock.day,
//          자정 후(night)면 clock.day - 1 (자정에 +1된 걸 되돌림).
// 잠들면 farm_saves.current_day = settlementDay + 1, tick_of_day = 36 (06:00).
//
// 강제 수면: night 페이즈 + tick >= TICK_FORCE_SLEEP 도달 시 자동으로
// OwnerRoomModal 을 forced 모드로 표시. 사용자는 그 안의 정산 버튼만 가능.

const settlementDay = clock.tick < TICK_WAKE ? clock.day - 1 : clock.day;

const handleSleep = async () => {
  const summary = {
    visits: visitors.visitsToday,
    births: dailyCounters.births,
    sellsTotal: dailyCounters.sellsTotal,
    sireFame: dailyCounters.sireFame,
  };
  try {
    await commitSettlementAction({
      saveId: save.id,
      settlementDay,
      moneyDelta,
      summary,
    });
    // 정산 commit 후 메모리 카운터 리셋. router.refresh 가 save 재취득 →
    // useFarmClock 의 initialDay/initialTick 가 새 값 → 06:00 부터 다시 시작.
    setMoneyDelta(0);
    setDailyCounters({ births: 0, sellsTotal: 0, sireFame: 0 });
    setOwnerRoom(false);
    clock.setTime(settlementDay + 1, TICK_WAKE);
    router.refresh();
  } catch (e) {
    console.error("[handleSleep] error:", e);
  }
};

// 02:00 도달 → 강제 수면 모달 자동 표시
useEffect(() => {
  if (ownerRoom) return;
  if (clock.phase !== "night") return;
  if (clock.tick < TICK_FORCE_SLEEP) return;
  setOwnerRoom("forced");
}, [clock.phase, clock.tick, ownerRoom]);

  /** 대기실에서 클릭해 펼친 손님 (null 이면 카드 닫힘) */
  const [openVisitor, setOpenVisitor] = useState<Visitor | null>(null);

  // 펼쳐둔 손님이 큐에서 사라지면 (매칭/돌려보냄) 카드도 닫기
  useEffect(() => {
    if (openVisitor && !visitors.pendingArrivals.some((v) => v.id === openVisitor.id)) {
      setOpenVisitor(null);
    }
  }, [visitors.pendingArrivals, openVisitor]);

  // 손님 카드 열면 동물 모달은 닫기 (겹침 방지)
  useEffect(() => {
    if (openVisitor) setSelectedAnimal(null);
  }, [openVisitor?.id]);

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
      <TopBar
        save={{ ...save, money: displayMoney }}
        clock={clock}
        onBack={goBack}
        onOpenOwnerRoom={() => setOwnerRoom("manual")}
      />

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
        {/* 좌측: 단면도 집 + 대기실 */}
        <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
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
              activeVisits={visitors.activeVisits}
            />
          </div>

          <WaitingRoom
            visitors={visitors.pendingArrivals}
            selectedId={openVisitor?.id ?? null}
            onSelect={setOpenVisitor}
          />
        </section>

        {/* 우측: 임신 + 보육실 */}
        <aside style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {pregnancies.length > 0 && (
            <div>
              <SectionHeader
                title="임신 중"
                en="EXPECTING"
                subline={`${pregnancies.length}`}
              />
              <PregnancyPanel pregnancies={pregnancies} currentDay={clock.day} />
            </div>
          )}

          <div>
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
          </div>
        </aside>
      </main>

      {/* 동물 상세 모달 */}
      {selectedAnimal && (
        <AnimalDetailModal
          animal={selectedAnimal}
          currentDay={clock.day}
          currentTick={clock.tick}
          onClose={() => setSelectedAnimal(null)}
          onRename={handleRename}
          animalsLookup={[...roomAnimals, ...nurseryAnimals]}
          actions={{
            availableRooms: availableRoomsForRelocate,
            onRelocate: handleRelocate,
            onSell: handleSell,
            onSendToSire: handleSendToSire,
          }}
        />
      )}

      {/* 농장주 방 모달 */}
        {ownerRoom && (
          <OwnerRoomModal
            clock={clock}
            forced={ownerRoom === "forced"}
            summary={{
              visits: visitors.visitsToday,
              births: dailyCounters.births,
              moneyDelta,
              sellsTotal: dailyCounters.sellsTotal,
              sireFame: dailyCounters.sireFame,
            }}
            onClose={() => setOwnerRoom(false)}
            onSleep={handleSleep}
          />
        )}

      {/* 손님 매칭 카드 (대기실에서 선택 시) */}
      {openVisitor && (
        <VisitorMatchDialog
          visitor={openVisitor}
          rooms={rooms}
          roomAnimals={roomAnimals}
          occupiedRoomIds={occupiedRoomIds}
          fame={save.fame}
          farmLevel={save.level}
          currentTick={clock.tick}
          onAccept={(roomId) => visitors.acceptToRoom(openVisitor.id, roomId)}
          onClose={() => setOpenVisitor(null)}
          onDecline={() => visitors.decline(openVisitor.id)}
        />
      )}

      {/* 디버그 패널 (시간 점프) */}
      <DebugPanel clock={clock} />

      {/* 수정 말풍선들 */}
      {bubbles.map((b) => (
        <ConceptionBubble
          key={b.id}
          success={b.success}
          x={b.x}
          y={b.y}
          motherName={b.motherName}
          sireName={b.sireName}
          onDone={() => setBubbles((prev) => prev.filter((x) => x.id !== b.id))}
        />
      ))}

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
  onOpenOwnerRoom,
}: {
  save: FarmSaveRow;
  clock: FarmClock;
  onBack: () => void;
  onOpenOwnerRoom: () => void;
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
      <button
        type="button"
        onClick={onOpenOwnerRoom}
        className="font-mono"
        title={clock.phase === "open" ? "영업 중에는 잘 수 없어요" : "내 방으로 가기"}
        style={{
          background: clock.phase !== "open" && clock.phase !== "morning"
            ? "rgba(34,72,137,0.12)"
            : "transparent",
          border: `1px solid ${
            clock.phase !== "open" && clock.phase !== "morning"
              ? "rgba(34,72,137,0.55)"
              : FARM.lineSolid
          }`,
          color: FARM.ink,
          fontSize: 13,
          padding: "5px 10px",
          cursor: "pointer",
          transition: "all .2s",
          animation:
            clock.phase === "evening" || clock.phase === "night"
              ? "ownerBedBlink 2s ease-in-out infinite"
              : "none",
        }}
      >
        🛏️
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


// ── 임신 패널 ───────────────────────────────────────────────────────────
function PregnancyPanel({
  pregnancies,
  currentDay,
}: {
  pregnancies: Pregnancy[];
  currentDay: number;
}) {
  return (
    <div
      style={{
        background: "#FFF1F4",
        border: "1px solid rgba(255,143,168,0.45)",
        borderRadius: 6,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {pregnancies.map((p, i) => {
        const daysLeft = Math.max(0, p.dueDay - currentDay);
        // 귀족 친부면 사생아 라벨 미리 노출
        const bastardLabel =
          p.sireSocialRankId && p.sireSocialRankId !== "commoner"
            ? (() => {
                try {
                  return getSocialRank(p.sireSocialRankId).bastardLabel;
                } catch {
                  return null;
                }
              })()
            : null;

        const sireSpeciesLabel = (() => {
          try {
            return getSpecies(p.sireSpecies).label_ko;
          } catch {
            return p.sireSpecies;
          }
        })();

        return (
          <div
            key={`${p.motherId}-${i}`}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 10,
              alignItems: "center",
              padding: "8px 10px",
              background: "#FFFFFF",
              border: "1px solid rgba(255,143,168,0.35)",
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 20 }} aria-hidden>
              🤰
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#3D2F1F" }}>
                {p.motherName?.trim() || "이름 없음"} ♀
              </div>
              <div className="font-mono" style={{ fontSize: 9, color: "#8B7E66", marginTop: 1 }}>
                친부: {p.sireName} ♂ ({p.sireGrade}) · {sireSpeciesLabel}
              </div>
              {bastardLabel && (
                <div
                  style={{
                    marginTop: 4,
                    display: "inline-block",
                    fontSize: 9,
                    padding: "1px 6px",
                    background: "rgba(150,90,200,0.15)",
                    color: "#6A3D9A",
                    border: "1px solid rgba(150,90,200,0.45)",
                    borderRadius: 3,
                    letterSpacing: "0.03em",
                    fontWeight: 700,
                  }}
                  title="태어날 새끼에게 자동 부여될 사회적 특성"
                >
                  👑 {bastardLabel}
                </div>
              )}
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 10,
                color: daysLeft === 0 ? "#FFFFFF" : "#C2185B",
                background: daysLeft === 0 ? "#C2185B" : "transparent",
                padding: daysLeft === 0 ? "2px 6px" : 0,
                borderRadius: daysLeft === 0 ? 3 : 0,
                fontWeight: 700,
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {daysLeft === 0 ? "출산중…" : `D-${daysLeft}`}
            </div>
          </div>
        );
      })}
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