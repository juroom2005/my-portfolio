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

import { useEffect, useMemo } from "react";
import type { AnimalRow } from "./dbTypes";
import {
  describeAnimal,
  describeGenesWithGenotype,
  describeRareGenesWithGenotype,
  describeExpressedTraits,
  describeCarrierTraits,
  gradeColor,
  type DetailedTraitInfo,
} from "./phenotype";

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
};

export default function AnimalDetailModal({ animal, currentDay, onClose }: Props) {
  const d = useMemo(() => describeAnimal(animal), [animal]);
  const grade = gradeColor(animal.grade);

  const genes = useMemo(() => describeGenesWithGenotype(animal), [animal]);
  const rares = useMemo(() => describeRareGenesWithGenotype(animal), [animal]);
  const expressedTraits = useMemo(() => describeExpressedTraits(animal), [animal]);
  const carrierTraits = useMemo(() => describeCarrierTraits(animal), [animal]);

  const activeTraits = expressedTraits.filter((t) => t.active);
  const latentTraits = expressedTraits.filter((t) => !t.active);

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
              <span>
                {animal.name?.trim() || (
                  <em style={{ color: FARM.inkFaint, fontStyle: "normal" }}>이름 없음</em>
                )}
              </span>
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
              style={{ fontSize: 11, color: FARM.inkSoft, letterSpacing: "0.05em", marginTop: 3 }}
            >
              {d.speciesLabel} · GEN {animal.generation}
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
            <StatBar label="외모" value={animal.beauty} />
            <StatBar label="체력" value={animal.stamina} />
            <StatBar label="기질" value={animal.temperament} />
            <StatBar label="건강" value={animal.health} />
            <StatBar label="번식력" value={animal.fertility} />
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
              <KV k="모친 ID" v={shortId(animal.mother_id)} />
              <KV k="부친 ID" v={shortId(animal.father_id)} />
            </KVGrid>
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

// ── 능력치 막대 ────────────────────────────────────────────────────────
function StatBar({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 36px",
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
          background: FARM.statBg,
          borderRadius: 4,
          overflow: "hidden",
          border: `1px solid ${FARM.line}`,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: pct >= 70 ? FARM.statFill : pct >= 40 ? "#C9D96A" : "#D9B86A",
            transition: "width .4s ease",
          }}
        />
      </div>
      <span className="font-mono" style={{ textAlign: "right", fontWeight: 700, color: FARM.ink }}>
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