"use client";

// src/components/code/games/farm/AnimalDetailModal.tsx
//
// 동물 상세 정보 모달. 카드 클릭 시 열림.
// 노출 정보:
//   header        — 아이콘 / 이름 / 성별 / 종 / 등급
//   상태         — status / 위치 / 나이 / 성체여부 / 세대
//   능력치 5종    — 막대 그래프 + 숫자
//   외형 유전자   — 표현형 + 유전자형
//   희귀 유전자   — 발현/보인자 상태 + grade bonus
//   특성         — 활성 / 잠재 / 보인자 세 그룹
//   혈통 / 기타  — generation, mother_id, father_id, inbreeding_f, is_sterile

import { useEffect, useMemo, useState } from "react";
import type { AnimalRow, RoomRow } from "./dbTypes";
import {
  describeAnimal,
  describeGenesWithGenotype,
  describeRareGenesWithGenotype,
  describeExpressedTraits,
  describeCarrierTraits,
  gradeColor,
  statTier,
  type DetailedTraitInfo,
} from "./phenotype";
import {
  formatBreedLabel,
  getBreedTier,
  getOrInferAncestry,
  TIER_COLOR,
  TIER_LABEL,
  type BreedTier,
} from "./ancestry";
import { getSpecies } from "./species";
import { getSocialRank } from "./species/humanProfile";
import {
  calcSellPrice,
  calcSireSendFame,
  canSendToSire,
  isReadyToGraduate,
} from "./pricing";

const FARM = {
  bg: "#FFF8E0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  inkFaint: "#8B7E66",
  line: "rgba(61,47,31,0.18)",
  lineSolid: "rgba(61,47,31,0.5)",
  blue: "#224889",
  bluePale: "#E1EAFF",
  pink: "#D14D8A",
  blueAccent: "#3D7BD1",
  warn: "#E8714D",
  rareGold: "#C99A2E",
  statBg: "rgba(61,47,31,0.08)",
  statFill: "#8FE600",
} as const;

type Props = {
  animal: AnimalRow;
  currentDay: number;
  onClose: () => void;
  /** 보육실 졸업 액션용. 없으면 액션 패널 안 그림. */
  actions?: {
    /** 빈 방 후보 (animal=null 인 방) */
    availableRooms: RoomRow[];
    onRelocate: (animalId: string, roomId: string) => Promise<void> | void;
    onSell: (animalId: string, price: number) => Promise<void> | void;
    onSendToSire: (animalId: string, fameGain: number) => Promise<void> | void;
  };
   onRename?: (animalId: string, name: string) => Promise<void> | void;
   animalsLookup?: AnimalRow[];

};

export default function AnimalDetailModal({ animal, currentDay, onClose, actions, onRename, animalsLookup }: Props) {
  const d = useMemo(() => describeAnimal(animal), [animal]);
  const grade = gradeColor(animal.grade);
  const genes = useMemo(() => describeGenesWithGenotype(animal), [animal]);
  const rares = useMemo(() => describeRareGenesWithGenotype(animal), [animal]);
  const expressedTraits = useMemo(() => describeExpressedTraits(animal), [animal]);
  const carrierTraits = useMemo(() => describeCarrierTraits(animal), [animal]);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(animal.name ?? "");
  const [savingName, setSavingName] = useState(false);

  const parentLabel = useMemo(() => {
    const byId = new Map((animalsLookup ?? []).map((a) => [a.id, a]));
    return (id: string | null): string => {
      if (!id) return "—";
      const found = byId.get(id);
      const nm = found?.name?.trim();
      return nm || shortId(id);
    };
  }, [animalsLookup]);

  // 혈통 (순종이면 배지/섹션 안 그림)
  const ancestry = useMemo(() => getOrInferAncestry(animal), [animal]);
  const breedTier = useMemo(() => getBreedTier(ancestry, animal.species), [ancestry, animal.species]);
  const breedLabel = useMemo(
    () => formatBreedLabel(ancestry, animal.species),
    [ancestry, animal.species],
  );

    // 다른 동물 모달로 바뀌면 편집 상태 초기화
  useEffect(() => {
    setEditingName(false);
    setNameDraft(animal.name ?? "");
  }, [animal.id, animal.name]);

  const commitName = async () => {
    if (!onRename) return;
    setSavingName(true);
    try {
      await onRename(animal.id, nameDraft);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  };

  // 사생아 구체 라벨 + 친부 정보 (출산 시 metadata 에 저장됨)
  const bastardOverride = useMemo(() => getBastardOverride(animal), [animal]);
  const sireInfo = useMemo(() => extractSireInfo(animal), [animal]);

  // active_traits 라벨 교체
  const expressedDisplay = useMemo(() => {
    if (!bastardOverride) return expressedTraits;
    return expressedTraits.map((t) =>
      t.id === "noble_bastard" ? { ...t, label: bastardOverride } : t,
    );
  }, [expressedTraits, bastardOverride]);

  const activeTraits = expressedDisplay.filter((t) => t.active);
  const latentTraits = expressedDisplay.filter((t) => !t.active);

  const age = d.ageInDays(currentDay);
  const toAdult = d.daysToAdult(currentDay);

  // ESC 로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        
      }}
    >
      {/* 백드롭 */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(34,72,137,0.45)",
          animation: "fadeIn .25s ease both",
          backdropFilter: "blur(2px)",
        }}
      />

      {/* 패널 */}
      <div
        style={{
          position: "relative",
          background: FARM.bg,
          border: `2px solid ${FARM.blue}`,
          borderRadius: 8,
          width: "100%",
          maxWidth: 560,
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(34,72,137,0.35)",
          animation: "modalPop .3s cubic-bezier(.2,.8,.2,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header
          style={{
            padding: "20px 22px 16px",
            background: FARM.bluePale,
            borderBottom: `2px solid ${FARM.blue}`,
            display: "grid",
            gridTemplateColumns: "auto 1fr auto auto",
            gap: 14,
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: 44, lineHeight: 1 }} aria-hidden>
            {d.icon}
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: FARM.ink,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {editingName ? (
                <input
                  autoFocus
                  value={nameDraft}
                  maxLength={40}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void commitName();
                    if (e.key === "Escape") {
                      setEditingName(false);
                      setNameDraft(animal.name ?? "");
                    }
                  }}
                  disabled={savingName}
                  placeholder="이름 입력"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: FARM.ink,
                    background: "#FFFFFF",
                    border: `1.5px solid ${FARM.blue}`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    maxWidth: 180,
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <span
                  onClick={onRename ? () => setEditingName(true) : undefined}
                  title={onRename ? "클릭해서 이름 변경" : undefined}
                  style={{ cursor: onRename ? "text" : "default" }}
                >
                  {animal.name?.trim() || (
                    <em style={{ color: FARM.inkFaint, fontStyle: "normal" }}>이름 없음</em>
                  )}
                  {onRename && (
                    <span style={{ fontSize: 12, marginLeft: 6, opacity: 0.5 }}>✎</span>
                  )}
                </span>
              )}
              {editingName && (
                <button
                  type="button"
                  onClick={() => void commitName()}
                  disabled={savingName}
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    padding: "4px 10px",
                    background: FARM.blue,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 3,
                    cursor: savingName ? "wait" : "pointer",
                  }}
                >
                  {savingName ? "…" : "저장"}
                </button>
              )}
              <span
                style={{
                  fontSize: 16,
                  color: animal.sex === "F" ? FARM.pink : FARM.blueAccent,
                  fontWeight: 700,
                }}
              >
                {d.sexSymbol}
              </span>
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 11,
                color: FARM.inkSoft,
                letterSpacing: "0.05em",
                marginTop: 3,
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span>
                {d.speciesLabel} · GEN {animal.generation}
              </span>
              {breedTier !== "pure" && <BreedBadge tier={breedTier} label={breedLabel} />}
            </div>
          </div>
          <div
            className="font-mono"
            style={{
              background: grade.bg,
              color: grade.fg,
              border: `1.5px solid ${grade.border}`,
              padding: "6px 12px",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.05em",
              minWidth: 44,
              textAlign: "center",
              borderRadius: 4,
            }}
          >
            {animal.grade ?? "—"}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-mono"
            style={{
              background: "transparent",
              border: `1px solid ${FARM.lineSolid}`,
              color: FARM.ink,
              fontSize: 14,
              width: 28,
              height: 28,
              cursor: "pointer",
              borderRadius: 3,
            }}
            title="닫기 (Esc)"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        {/* Body (scrollable) */}
        <div style={{ overflowY: "auto", padding: "16px 22px 22px" }}>
          {/* 보육실 졸업 액션 — 성체 도달 + 보육실 + actions 있을 때만 */}
          {actions && isReadyToGraduate(animal, currentDay) && (
            <NurseryActions
              animal={animal}
              availableRooms={actions.availableRooms}
              onRelocate={actions.onRelocate}
              onSell={actions.onSell}
              onSendToSire={actions.onSendToSire}
            />
          )}

          {/* 상태 */}
          <Section title="상태" en="STATUS">
            <KVGrid>
              <KV k="상태" v={statusLabel(animal.status)} />
              <KV k="위치" v={locationLabel(animal)} />
              <KV k="나이" v={`D${age}${animal.is_adult ? " · 성체" : ` · 아기 (성체까지 ${toAdult}일)`}`} />
              <KV k="출생일" v={`D${animal.born_on_day}`} />
              {animal.is_sterile && (
                <KV
                  k="번식"
                  v={
                    <span style={{ color: FARM.warn, fontWeight: 700 }}>불임 (생식 불가)</span>
                  }
                />
              )}
            </KVGrid>
          </Section>

          {/* 능력치 */}
          <Section title="능력치" en="STATS">
            <StatBar statKey="beauty" label="외모" value={animal.beauty} />
            <StatBar statKey="stamina" label="체력" value={animal.stamina} />
            <StatBar statKey="temperament" label="기질" value={animal.temperament} />
            <StatBar statKey="health" label="건강" value={animal.health} />
            <StatBar statKey="fertility" label="번식력" value={animal.fertility} />
          </Section>

          {/* 외형 유전자 */}
          <Section title="외형 유전자" en="GENES">
            <KVGrid>
              {genes.map((g) => (
                <KV
                  key={g.id}
                  k={g.label}
                  v={
                    <span>
                      {g.phenotype}{" "}
                      <span
                        className="font-mono"
                        style={{ color: FARM.inkFaint, fontSize: 10, letterSpacing: "0.05em" }}
                      >
                        [{g.genotype}]
                      </span>
                    </span>
                  }
                />
              ))}
            </KVGrid>
          </Section>

          {/* 희귀 유전자 */}
          <Section title="희귀 유전자" en="RARE GENES">
            {rares.length === 0 ? (
              <Empty text="이 종에는 희귀 유전자가 없어요." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {rares.map((r) => (
                  <RareRow key={r.id} {...r} />
                ))}
              </div>
            )}
          </Section>

          {/* 특성 */}
          <Section title="특성" en="TRAITS">
            <TraitGroup
              label="활성"
              hint={`등급 ${animal.grade ?? "?"} 슬롯에 들어와 효과 발휘 중`}
              traits={activeTraits}
              emptyText="활성 특성 없음"
            />
            {latentTraits.length > 0 && (
              <TraitGroup
                label="잠재"
                hint="발현은 됐지만 슬롯 부족 — 등급이 오르면 깨어남"
                traits={latentTraits}
                emptyText=""
                muted
              />
            )}
            {carrierTraits.length > 0 && (
              <TraitGroup
                label="보인자"
                hint="이형접합 — 본인은 발현 안 하지만 자식에게 전달 가능"
                traits={carrierTraits}
                emptyText=""
                muted
              />
            )}
          </Section>

          {/* 혈통 */}
          <Section title="혈통" en="LINEAGE">
            {/* 혈통 구성 (ancestry 비율) — 순종도 노출 (1.0 한 줄) */}
            <AncestryBreakdown ancestry={ancestry} majorSpecies={animal.species} />

            <KVGrid>
              <KV k="세대" v={`GEN ${animal.generation}`} />
              <KV
                k="근친계수 F"
                v={
                  <span
                    style={{
                      color: animal.inbreeding_f >= 0.25 ? FARM.warn : FARM.ink,
                      fontWeight: animal.inbreeding_f >= 0.25 ? 700 : 400,
                    }}
                  >
                    {animal.inbreeding_f.toFixed(4)}
                    {animal.inbreeding_f >= 0.25 && " ⚠"}
                  </span>
                }
              />
              <KV k="친모" v={parentLabel(animal.mother_id)} />
              <KV k="친부" v={parentLabel(animal.father_id)} />
            </KVGrid>

            {/* 친부 정보 — 출산 시 metadata.sire_info 에 저장된 경우 노출 */}
            {sireInfo && <SireInfoBlock info={sireInfo} />}
          </Section>

          {/* DEBUG */}
          <Section title="디버그" en="DEBUG">
            <KVGrid>
              <KV k="ID" v={<code style={{ fontSize: 10 }}>{animal.id}</code>} />
              <KV k="save_id" v={<code style={{ fontSize: 10 }}>{shortId(animal.save_id)}</code>} />
              {animal.birth_visit_id && (
                <KV
                  k="birth_visit_id"
                  v={<code style={{ fontSize: 10 }}>{shortId(animal.birth_visit_id)}</code>}
                />
              )}
            </KVGrid>
          </Section>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes modalPop {
          from { transform: scale(.96) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes statShimmer { 0% { background-position: 0% 0 } 100% { background-position: -200% 0 } }
      `}</style>
    </div>
  );
}

// ── Section ────────────────────────────────────────────────────────────
function Section({ title, en, children }: { title: string; en: string; children: React.ReactNode }) {
  return (
    <section style={{ marginTop: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          paddingBottom: 4,
          marginBottom: 8,
          borderBottom: `1px dashed ${FARM.line}`,
        }}
      >
        <h3 style={{ fontSize: 12, fontWeight: 700, color: FARM.blue, margin: 0 }}>{title}</h3>
        <span
          className="font-mono"
          style={{ fontSize: 9, color: FARM.inkFaint, letterSpacing: "0.22em", fontWeight: 700 }}
        >
          {en}
        </span>
      </div>
      {children}
    </section>
  );
}

// ── Key-Value grid ─────────────────────────────────────────────────────
function KVGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px 16px",
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, minWidth: 0 }}>
      <span style={{ color: FARM.inkSoft }}>{k}</span>
      <span style={{ color: FARM.ink, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis" }}>
        {v}
      </span>
    </div>
  );
}

// ── 능력치 막대 (구간 라벨 + 색) ───────────────────────────────────────
const GOLD_INK = "#7a5b00";

function StatBar({ statKey, label, value }: { statKey: string; label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const tier = statTier(statKey, value);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "56px 1fr 86px 30px",
        gap: 8,
        alignItems: "center",
        padding: "3px 0",
        fontSize: 11,
      }}
    >
      <span style={{ color: FARM.inkSoft }}>{label}</span>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${FARM.line}`,
          ...(tier.perfect
            ? {
                background: "linear-gradient(90deg,#EF9F27,#C99A2E,#F5D76E,#C99A2E)",
                backgroundSize: "200% 100%",
                animation: "statShimmer 2.2s linear infinite",
              }
            : { background: FARM.statBg }),
        }}
      >
        {!tier.perfect && (
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: tier.color,
              transition: "width .4s ease",
            }}
          />
        )}
      </div>
      <span
        style={{
          justifySelf: "start",
          fontSize: 10,
          fontWeight: 700,
          color: tier.color,
          background: tier.bg,
          border: `1px solid ${tier.color}55`,
          padding: "1px 7px",
          borderRadius: 3,
          whiteSpace: "nowrap",
        }}
      >
        {tier.perfect ? `★ ${tier.label}` : tier.label}
      </span>
      <span
        className="font-mono"
        style={{
          textAlign: "right",
          fontWeight: 700,
          color: tier.perfect ? GOLD_INK : FARM.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ── 희귀 유전자 한 줄 ──────────────────────────────────────────────────
function RareRow({
  label,
  rarityLabel,
  gradeBonus,
  status,
  genotype,
}: {
  label: string;
  rarityLabel: string;
  gradeBonus: number;
  status: "expressed" | "carrier" | "none";
  genotype: string;
}) {
  const statusLabel =
    status === "expressed" ? "발현" : status === "carrier" ? "보인자" : "없음";
  const statusColor =
    status === "expressed" ? FARM.rareGold : status === "carrier" ? FARM.blueAccent : FARM.inkFaint;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto auto auto",
        gap: 10,
        alignItems: "center",
        padding: "6px 10px",
        background:
          status === "expressed"
            ? "rgba(201,154,46,0.10)"
            : status === "carrier"
              ? "rgba(61,123,209,0.08)"
              : "rgba(61,47,31,0.04)",
        border: `1px solid ${status === "expressed" ? "rgba(201,154,46,0.35)" : FARM.line}`,
        borderRadius: 4,
        fontSize: 11,
      }}
    >
      <span style={{ fontWeight: 700, color: FARM.ink }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 9, color: FARM.inkFaint, letterSpacing: "0.1em" }}>
        {rarityLabel} · +{gradeBonus}
      </span>
      <span className="font-mono" style={{ fontSize: 10, color: FARM.inkFaint }}>
        [{genotype}]
      </span>
      <span style={{ color: statusColor, fontWeight: 700 }}>{statusLabel}</span>
    </div>
  );
}

// ── 특성 그룹 ──────────────────────────────────────────────────────────
function TraitGroup({
  label,
  hint,
  traits,
  emptyText,
  muted,
}: {
  label: string;
  hint: string;
  traits: DetailedTraitInfo[];
  emptyText: string;
  muted?: boolean;
}) {
  return (
    <div style={{ marginBottom: 10, opacity: muted ? 0.85 : 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: FARM.ink }}>{label}</span>
        <span style={{ fontSize: 10, color: FARM.inkFaint }}>— {hint}</span>
      </div>
      {traits.length === 0 ? (
        emptyText && <Empty text={emptyText} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {traits.map((t) => (
            <TraitRow key={t.id + (t.carrier ? "-c" : "")} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TraitRow({ t }: { t: DetailedTraitInfo }) {
  const palette =
    t.tone === "penalty"
      ? { bg: "rgba(232,113,77,0.12)", fg: FARM.warn, border: "rgba(232,113,77,0.4)" }
      : t.tone === "rare"
        ? { bg: "rgba(201,154,46,0.14)", fg: FARM.rareGold, border: "rgba(201,154,46,0.4)" }
        : { bg: "rgba(143,230,0,0.14)", fg: "#3D5500", border: "rgba(143,230,0,0.4)" };
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        gap: 8,
        padding: "5px 10px",
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: 4,
        fontSize: 11,
      }}
    >
      <span style={{ fontWeight: 700, color: palette.fg }}>{t.label}</span>
      {t.description && <span style={{ color: FARM.inkSoft, fontSize: 10 }}>{t.description}</span>}
    </div>
  );
}

// ── Empty ──────────────────────────────────────────────────────────────
function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        fontSize: 11,
        color: FARM.inkFaint,
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  );
}

// ── 헬퍼 ───────────────────────────────────────────────────────────────
function statusLabel(s: AnimalRow["status"]): string {
  return (
    {
      nursery: "보육실",
      room: "방",
      visitor_buck: "방문 수컷",
      sent_to_owner: "주인 인도됨",
      sold: "판매됨",
      archived: "보관",
    }[s] ?? s
  );
}

function locationLabel(a: AnimalRow): string {
  if (a.status === "nursery") return `보육실${a.nursery_slot != null ? ` #${a.nursery_slot}` : ""}`;
  if (a.status === "room" && a.room_id) return `방 ${shortId(a.room_id)}`;
  return "—";
}

function shortId(id: string | null): string {
  if (!id) return "—";
  return id.slice(0, 8);
}

// ═══════════════════════════════════════════════════════════════════════
// 혈통 표시 헬퍼
// ═══════════════════════════════════════════════════════════════════════

function BreedBadge({ tier, label }: { tier: BreedTier; label: string }) {
  const palette = TIER_COLOR[tier];
  return (
    <span
      className="font-mono"
      style={{
        background: palette.bg,
        color: palette.fg,
        border: `1px solid ${palette.border}`,
        padding: "1px 7px",
        fontSize: 10,
        borderRadius: 3,
        letterSpacing: "0.04em",
        fontWeight: 700,
        whiteSpace: "nowrap",
        lineHeight: 1.3,
      }}
    >
      {label}
    </span>
  );
}

/**
 * ancestry 비율을 막대 + 라벨로 노출.
 * "토끼수인 75% · 인간 25%" 같은 형태.
 */
function AncestryBreakdown({
  ancestry,
  majorSpecies,
}: {
  ancestry: Record<string, number>;
  majorSpecies: string;
}) {
  const entries = Object.entries(ancestry)
    .sort((a, b) => b[1] - a[1])
    .map(([sp, ratio]) => ({
      species: sp,
      ratio,
      label: safeSpeciesLabel(sp),
      isMajor: sp === majorSpecies,
    }));

  return (
    <div
      style={{
        background: "rgba(61,47,31,0.03)",
        border: `1px dashed ${FARM.line}`,
        borderRadius: 4,
        padding: "8px 10px",
        marginBottom: 10,
        display: "flex",
        flexDirection: "column",
        gap: 5,
      }}
    >
      {entries.map((e) => (
        <div
          key={e.species}
          style={{
            display: "grid",
            gridTemplateColumns: "70px 1fr 46px",
            gap: 8,
            alignItems: "center",
            fontSize: 11,
          }}
        >
          <span style={{ color: e.isMajor ? FARM.ink : FARM.inkSoft, fontWeight: e.isMajor ? 700 : 400 }}>
            {e.label}
          </span>
          <div
            style={{
              height: 6,
              background: "rgba(61,47,31,0.08)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.round(e.ratio * 100)}%`,
                background: e.isMajor ? "#8FE600" : "rgba(150,90,200,0.55)",
              }}
            />
          </div>
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: FARM.inkSoft,
              textAlign: "right",
              fontWeight: 700,
            }}
          >
            {formatRatio(e.ratio)}
          </span>
        </div>
      ))}
    </div>
  );
}

function safeSpeciesLabel(speciesId: string): string {
  try {
    return getSpecies(speciesId).label_ko;
  } catch {
    return speciesId;
  }
}

function formatRatio(r: number): string {
  // 1.0 → "100%", 0.875 → "87.5%", 0.125 → "12.5%"
  const pct = r * 100;
  if (Math.abs(pct - Math.round(pct)) < 0.01) return `${Math.round(pct)}%`;
  return `${pct.toFixed(1)}%`;
}

// ═══════════════════════════════════════════════════════════════════════
// 친부 정보 (출산 시 자식 metadata.sire_info 에 저장)
// ═══════════════════════════════════════════════════════════════════════

type SireInfo = {
  name: string;
  grade?: string;
  species?: string;
  socialRankId?: string;
};

function extractSireInfo(animal: AnimalRow): SireInfo | null {
  const meta = animal.metadata as Record<string, unknown> | null;
  const raw = meta?.sire_info;
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== "string") return null;
  return {
    name: obj.name,
    grade: typeof obj.grade === "string" ? obj.grade : undefined,
    species: typeof obj.species === "string" ? obj.species : undefined,
    socialRankId:
      typeof obj.socialRankId === "string" ? obj.socialRankId : undefined,
  };
}

function SireInfoBlock({ info }: { info: SireInfo }) {
  const rankLabel = info.socialRankId
    ? (() => {
        try {
          return getSocialRank(info.socialRankId!).label_ko;
        } catch {
          return null;
        }
      })()
    : null;
  return (
    <div
      style={{
        marginTop: 10,
        padding: "8px 10px",
        background: "rgba(34,72,137,0.05)",
        border: `1px solid rgba(34,72,137,0.2)`,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <div
        className="font-mono"
        style={{
          fontSize: 9,
          color: FARM.inkFaint,
          letterSpacing: "0.2em",
          fontWeight: 700,
        }}
      >
        친부
      </div>
      <div style={{ fontSize: 12, color: FARM.ink, fontWeight: 700 }}>
        {info.name} ♂{info.grade && (
          <span
            className="font-mono"
            style={{
              fontSize: 10,
              color: FARM.inkSoft,
              fontWeight: 700,
              marginLeft: 6,
              letterSpacing: "0.05em",
            }}
          >
            {info.grade}
          </span>
        )}
      </div>
      <div className="font-mono" style={{ fontSize: 10, color: FARM.inkSoft, letterSpacing: "0.03em" }}>
        {info.species && safeSpeciesLabel(info.species)}
        {rankLabel && ` · ${rankLabel}`}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// 사생아 라벨 구체화
// ═══════════════════════════════════════════════════════════════════════
//
// active_traits 에 "noble_bastard" 가 있고 metadata.bastard_of 에 socialRankId 가
// 저장돼있으면 "후작의 사생아" 같은 구체 라벨로 표시. 없으면 trait 기본 라벨 유지.
function getBastardOverride(animal: AnimalRow): string | null {
  if (!animal.active_traits.includes("noble_bastard")) return null;
  const meta = animal.metadata as Record<string, unknown> | null;
  const rankId = meta?.bastard_of;
  if (typeof rankId !== "string") return null;
  try {
    return getSocialRank(rankId).bastardLabel;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════
// 보육실 졸업 액션 패널
// ═══════════════════════════════════════════════════════════════════════
//
// 성체 도달한 보육실 동물을 어디로 보낼지 선택.
//   - 방으로 이동 (암컷만, 빈 방 선택)
//   - 판매 (가격 자동 계산)
//   - 친부에게 송환 (명성 +N, 친부 정보 있어야 가능)
//
// 두 단계 확정: 첫 클릭 → "확정?" 펼침, 두 번째 클릭 → 실행.
// 실수 방지 + 모달 안 confirm 다이얼로그 안 띄움.

type PendingKind = "relocate" | "sell" | "send" | null;

function NurseryActions({
  animal,
  availableRooms,
  onRelocate,
  onSell,
  onSendToSire,
}: {
  animal: AnimalRow;
  availableRooms: RoomRow[];
  onRelocate: (animalId: string, roomId: string) => Promise<void> | void;
  onSell: (animalId: string, price: number) => Promise<void> | void;
  onSendToSire: (animalId: string, fameGain: number) => Promise<void> | void;
}) {
  const [pending, setPending] = useState<PendingKind>(null);
  const [pickedRoomId, setPickedRoomId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isMale = animal.sex === "M";
  const sellPrice = useMemo(() => calcSellPrice(animal), [animal]);
  const fameGain = useMemo(() => calcSireSendFame(animal), [animal]);
  const sireAvailable = canSendToSire(animal);
  const sireName =
    sireAvailable
      ? ((animal.metadata as Record<string, unknown>).sire_info as { name?: string }).name
      : null;

  const reset = () => {
    setPending(null);
    setPickedRoomId(null);
  };

  const runRelocate = async () => {
    if (!pickedRoomId) return;
    setBusy(true);
    try {
      await onRelocate(animal.id, pickedRoomId);
    } finally {
      setBusy(false);
      reset();
    }
  };

  const runSell = async () => {
    setBusy(true);
    try {
      await onSell(animal.id, sellPrice);
    } finally {
      setBusy(false);
      reset();
    }
  };

  const runSend = async () => {
    setBusy(true);
    try {
      await onSendToSire(animal.id, fameGain);
    } finally {
      setBusy(false);
      reset();
    }
  };

  return (
    <div
      style={{
        marginBottom: 16,
        padding: 12,
        background: "rgba(143,230,0,0.07)",
        border: "1px solid rgba(143,230,0,0.45)",
        borderRadius: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "#3D5500" }}>
          성체로 자랐어요
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: 9,
            color: FARM.inkFaint,
            letterSpacing: "0.2em",
            fontWeight: 700,
          }}
        >
          GRADUATE
        </span>
      </div>

      {/* 펼친 화면(pending 있음) 또는 기본 메뉴 */}
      {pending === "relocate" ? (
        <RelocateForm
          rooms={availableRooms}
          pickedRoomId={pickedRoomId}
          setPickedRoomId={setPickedRoomId}
          onConfirm={runRelocate}
          onCancel={reset}
          busy={busy}
        />
      ) : pending === "sell" ? (
        <ConfirmRow
          message={`판매 — ${sellPrice}₵ 입금`}
          confirmLabel={`${sellPrice}₵ 받기`}
          confirmColor="#3D5500"
          confirmBg="rgba(143,230,0,0.25)"
          confirmBorder="rgba(143,230,0,0.65)"
          onConfirm={runSell}
          onCancel={reset}
          busy={busy}
        />
      ) : pending === "send" ? (
        <ConfirmRow
          message={`${sireName ?? "친부"}에게 송환 — 명성 +${fameGain}`}
          confirmLabel={`명성 +${fameGain}`}
          confirmColor="#6A3D9A"
          confirmBg="rgba(150,90,200,0.18)"
          confirmBorder="rgba(150,90,200,0.55)"
          onConfirm={runSend}
          onCancel={reset}
          busy={busy}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <ActionButton
            disabled={isMale}
            disabledHint={isMale ? "수컷은 방으로 옮길 수 없어요" : undefined}
            label="방으로 옮기기"
            sub={`빈 방 ${availableRooms.length}개`}
            onClick={() => setPending("relocate")}
          />
          <ActionButton
            label="판매"
            sub={`${sellPrice}₵`}
            onClick={() => setPending("sell")}
          />
          <ActionButton
            disabled={!sireAvailable}
            disabledHint={!sireAvailable ? "친부 정보가 없어요" : undefined}
            label="친부에게 보내기"
            sub={sireAvailable ? `명성 +${fameGain}` : "—"}
            onClick={() => setPending("send")}
          />
        </div>
      )}
    </div>
  );
}

function ActionButton({
  label,
  sub,
  onClick,
  disabled,
  disabledHint,
}: {
  label: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  disabledHint?: string;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={disabledHint}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 10,
        padding: "8px 12px",
        background: disabled ? "rgba(61,47,31,0.04)" : "#FFFFFF",
        border: `1px solid ${disabled ? "rgba(61,47,31,0.15)" : "rgba(34,72,137,0.35)"}`,
        borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        textAlign: "left",
        font: "inherit",
        opacity: disabled ? 0.55 : 1,
        transition: "background .12s, border-color .12s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "#FFF8E0";
        e.currentTarget.style.borderColor = FARM.blue;
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.background = "#FFFFFF";
        e.currentTarget.style.borderColor = "rgba(34,72,137,0.35)";
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: FARM.ink }}>{label}</span>
      <span
        className="font-mono"
        style={{
          fontSize: 11,
          color: disabled ? FARM.inkFaint : FARM.inkSoft,
          fontWeight: 700,
        }}
      >
        {sub}
      </span>
    </button>
  );
}

function ConfirmRow({
  message,
  confirmLabel,
  confirmColor,
  confirmBg,
  confirmBorder,
  onConfirm,
  onCancel,
  busy,
}: {
  message: string;
  confirmLabel: string;
  confirmColor: string;
  confirmBg: string;
  confirmBorder: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: FARM.ink, fontWeight: 600 }}>{message}</div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={busy ? undefined : onConfirm}
          disabled={busy}
          className="font-mono"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: confirmBg,
            border: `1.5px solid ${confirmBorder}`,
            color: confirmColor,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: busy ? "wait" : "pointer",
            borderRadius: 3,
          }}
        >
          {busy ? "처리 중…" : confirmLabel}
        </button>
        <button
          type="button"
          onClick={busy ? undefined : onCancel}
          disabled={busy}
          className="font-mono"
          style={{
            padding: "8px 14px",
            background: "transparent",
            border: `1px solid ${FARM.line}`,
            color: FARM.inkSoft,
            fontSize: 10,
            letterSpacing: "0.15em",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            borderRadius: 3,
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}

function RelocateForm({
  rooms,
  pickedRoomId,
  setPickedRoomId,
  onConfirm,
  onCancel,
  busy,
}: {
  rooms: RoomRow[];
  pickedRoomId: string | null;
  setPickedRoomId: (id: string | null) => void;
  onConfirm: () => void;
  onCancel: () => void;
  busy: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: FARM.ink, fontWeight: 600 }}>
        {rooms.length === 0 ? "빈 방이 없어요" : "옮길 방을 골라요"}
      </div>

      {rooms.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {rooms.map((r) => {
            const active = pickedRoomId === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setPickedRoomId(r.id)}
                className="font-mono"
                style={{
                  padding: "6px 10px",
                  background: active ? "rgba(34,72,137,0.18)" : "#FFFFFF",
                  border: `1px solid ${active ? FARM.blue : "rgba(34,72,137,0.3)"}`,
                  color: active ? FARM.blue : FARM.ink,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor: "pointer",
                  borderRadius: 3,
                }}
              >
                {r.floor}F · {r.position}
              </button>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", gap: 6 }}>
        <button
          type="button"
          onClick={busy || !pickedRoomId ? undefined : onConfirm}
          disabled={busy || !pickedRoomId}
          className="font-mono"
          style={{
            flex: 1,
            padding: "8px 12px",
            background: pickedRoomId ? "rgba(34,72,137,0.2)" : "rgba(61,47,31,0.05)",
            border: `1.5px solid ${pickedRoomId ? FARM.blue : "rgba(61,47,31,0.2)"}`,
            color: pickedRoomId ? FARM.blue : FARM.inkFaint,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: busy ? "wait" : pickedRoomId ? "pointer" : "not-allowed",
            borderRadius: 3,
          }}
        >
          {busy ? "처리 중…" : pickedRoomId ? "이동" : "방 선택"}
        </button>
        <button
          type="button"
          onClick={busy ? undefined : onCancel}
          disabled={busy}
          className="font-mono"
          style={{
            padding: "8px 14px",
            background: "transparent",
            border: `1px solid ${FARM.line}`,
            color: FARM.inkSoft,
            fontSize: 10,
            letterSpacing: "0.15em",
            fontWeight: 700,
            cursor: busy ? "wait" : "pointer",
            borderRadius: 3,
          }}
        >
          취소
        </button>
      </div>
    </div>
  );
}