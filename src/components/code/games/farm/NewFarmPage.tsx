"use client";

// src/components/code/games/farm/NewFarmPage.tsx
//
// 새 농장 생성기 — 농장 톤 첫 적용 (베이지 + 형광 녹 액센트).
// 좌: 농장주(여/남 토글 + 풀바디 미리보기 + 이름 + 농장 이름)
// 우/아래: 시작 동물 두 마리 (모색·눈색 선택, 활성 특성 미리보기, 이름)

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { generateStarterPack } from "@/lib/farm/starterPack";
import { createNewFarmAction } from "@/app/code/games/farm/new/actions";
import "@/components/code/arcade.css";
import {
  getSpecies,
  TRAIT_REGISTRY,
  type Species,
  type GeneTrait,
} from "@/components/code/games/farm/species";
import type { NewAnimalData } from "@/components/code/games/farm/genetics";

// ── 농장 톤 팔레트 ──────────────────────────────────────────────────────
const FARM = {
  bg: "#FAF3E0",
  cardBg: "#F5EBC4",
  cardEdge: "#E8DBC0",
  ink: "#3D2F1F",
  inkSoft: "#6B5942",
  line: "rgba(61,47,31,0.18)",
  lineSolid: "rgba(61,47,31,0.5)",
  neon: "#B4FF3A",
  neonDeep: "#8FE600",
  neonSoft: "#E4FFB0",
  warn: "#E8714D",
  ghost: "rgba(61,47,31,0.05)",
};

// ── 메인 페이지 ─────────────────────────────────────────────────────────
export default function NewFarmPage() {
  const router = useRouter();

  const [sex, setSex] = useState<"F" | "M">("F");
  const [characterName, setCharacterName] = useState("");
  const [farmName, setFarmName] = useState("");
  const [seed, setSeed] = useState<string | null>(null);

  const [rabbitChoices, setRabbitChoices] = useState<Record<string, string>>({
    color: "검정",
    eye: "회색",
  });
  const [sheepChoices, setSheepChoices] = useState<Record<string, string>>({
    color: "흰",
    eye: "호박색",
  });
  

  const [rabbitAnimalName, setRabbitAnimalName] = useState("");
  const [sheepAnimalName, setSheepAnimalName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [transitioning, setTransitioning] = useState<"toFarm" | "toEntry" | null>(null);

  const starterAnimals = useMemo(
    () => (seed ? generateStarterPack({ seed, rabbitChoices, sheepChoices }) : null),
    [seed, rabbitChoices, sheepChoices],
  );

  const rabbitSpec = getSpecies("rabbit");
  const sheepSpec = getSpecies("sheep");

  const reroll = () => {
  if (!seed) return;
  setSeed(makeSeed());
};


  useEffect(() => {
  setSeed(makeSeed());
}, []);

  const goBack = () => {
    if (transitioning) return;
    setTransitioning("toEntry");
    window.setTimeout(() => router.push("/code/games/farm"), 250);
  };

  const valid =
    seed !== null &&
    characterName.trim().length > 0 &&
    characterName.trim().length <= 24 &&
    farmName.trim().length > 0 &&
    farmName.trim().length <= 30;

  const submit = async () => {
    if (submitting || !valid || !seed) return;   // ← seed null 가드 추가
    setSubmitting(true);
    try {
      const saveId = await createNewFarmAction({
        sex,
        character_name: characterName.trim(),
        farm_name: farmName.trim(),
        seed,
        rabbitChoices,
        sheepChoices,
        rabbitName: rabbitAnimalName.trim() || null,
        sheepName: sheepAnimalName.trim() || null,
      });
      setTransitioning("toFarm");
      window.setTimeout(() => router.push(`/code/games/farm/${saveId}`), 300);
    } catch (e) {
      console.error("[NewFarmPage] submit failed:", e);
      setSubmitting(false);
      alert("농장 생성에 실패했습니다. 콘솔을 확인해주세요.");
    }
  };

  

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: FARM.bg,
        color: FARM.ink,
        animation: "slideInFromRight .4s cubic-bezier(.6,.0,.2,1) both",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${FARM.line}`,
        }}
      >
        <button
          type="button"
          onClick={goBack}
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
        <h1
          className="font-mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.3em",
            fontWeight: 700,
            margin: 0,
            opacity: 0.6,
          }}
        >
          NEW FARM · 새 농장 만들기
        </h1>
        <div style={{ width: 80 }} />
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "44px 32px 80px" }}>
        {/* 농장주 섹션 */}
        <Section title="농장주" en="CHARACTER">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "240px 1fr",
              gap: 32,
              marginTop: 22,
            }}
          >
            <CharacterPreview sex={sex} />
            <div>
              <Field label="성별">
                <SexToggle value={sex} onChange={setSex} />
              </Field>
              <Field label="이름">
                <TextInput
                  value={characterName}
                  onChange={setCharacterName}
                  placeholder="농장주의 이름"
                  maxLength={24}
                />
              </Field>
              <Field label="농장 이름" hint="이 이름이 농장 간판에 걸립니다">
                <TextInput
                  value={farmName}
                  onChange={setFarmName}
                  placeholder="달의 농장, 봄의 들판..."
                  maxLength={30}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 시작 동물 섹션 */}
        <Section title="시작 동물" en="STARTER ANIMALS">
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginTop: 10,
              marginBottom: 14,
            }}
          >
            <div className="font-mono" style={{ fontSize: 11, color: FARM.inkSoft, letterSpacing: "0.05em" }}>
              모색·눈색을 골라보세요. 특성은 무작위로 정해져요.
            </div>
            <button
              type="button"
              onClick={reroll}
              className="font-mono"
              style={{
                background: "transparent",
                border: `1px solid ${FARM.lineSolid}`,
                color: FARM.ink,
                fontSize: 10,
                letterSpacing: "0.18em",
                fontWeight: 700,
                padding: "5px 12px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = FARM.ghost)}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              ⟲ 다시 굴리기
            </button>
          </div>

          {starterAnimals ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <AnimalCard
                icon="🐰"
                label="토끼수인 ♀"
                animal={starterAnimals[0]}
                species={rabbitSpec}
                choices={rabbitChoices}
                onChoicesChange={setRabbitChoices}
                animalName={rabbitAnimalName}
                onAnimalNameChange={setRabbitAnimalName}
              />
              <AnimalCard
                icon="🐑"
                label="양수인 ♀"
                animal={starterAnimals[1]}
                species={sheepSpec}
                choices={sheepChoices}
                onChoicesChange={setSheepChoices}
                animalName={sheepAnimalName}
                onAnimalNameChange={setSheepAnimalName}
              />
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: FARM.inkSoft, fontSize: 12 }}>
              동물 준비 중...
            </div>
          )}
        </Section>

        {/* Submit */}
        <div style={{ textAlign: "right", marginTop: 40 }}>
          <button
            type="button"
            onClick={submit}
            disabled={!valid || submitting}
            style={{
              background: valid && !submitting ? FARM.neon : FARM.ghost,
              color: FARM.ink,
              border: `1.5px solid ${FARM.ink}`,
              padding: "14px 36px",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.12em",
              cursor: valid && !submitting ? "pointer" : "not-allowed",
              boxShadow: valid && !submitting ? `4px 4px 0 ${FARM.ink}` : "none",
              transition: "transform .12s, box-shadow .12s",
            }}
            onMouseEnter={(e) => {
              if (valid && !submitting) {
                e.currentTarget.style.transform = "translate(-2px, -2px)";
                e.currentTarget.style.boxShadow = `6px 6px 0 ${FARM.ink}`;
              }
            }}
            onMouseLeave={(e) => {
              if (valid && !submitting) {
                e.currentTarget.style.transform = "translate(0, 0)";
                e.currentTarget.style.boxShadow = `4px 4px 0 ${FARM.ink}`;
              }
            }}
          >
            {submitting ? "준비 중..." : "농장 시작 →"}
          </button>
        </div>
      </main>
      

      {/* 트랜지션 오버레이 */}
      {transitioning === "toEntry" && (
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
      {transitioning === "toFarm" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: FARM.bg,
            zIndex: 90,
            animation: "slideInFromRight .3s cubic-bezier(.6,.0,.2,1) forwards",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

// ── 하위 컴포넌트 ───────────────────────────────────────────────────────

function Section({ title, en, children }: { title: string; en: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
        <span className="font-mono" style={{ fontSize: 11, letterSpacing: "0.25em", color: FARM.inkSoft }}>
          {en}
        </span>
      </div>
      <div style={{ height: 1, background: FARM.line, margin: "10px 0 0" }} />
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label
        className="font-mono"
        style={{ display: "block", fontSize: 11, letterSpacing: "0.18em", color: FARM.inkSoft, marginBottom: 6 }}
      >
        {label}
        {hint && (
          <span style={{ marginLeft: 8, opacity: 0.7, letterSpacing: "normal", fontSize: 10 }}>· {hint}</span>
        )}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: "100%",
        background: "transparent",
        border: "none",
        borderBottom: `1.5px solid ${FARM.lineSolid}`,
        padding: "6px 0",
        fontSize: 16,
        color: FARM.ink,
        outline: "none",
        fontFamily: "inherit",
      }}
      onFocus={(e) => (e.currentTarget.style.borderBottomColor = FARM.ink)}
      onBlur={(e) => (e.currentTarget.style.borderBottomColor = FARM.lineSolid)}
    />
  );
}

function SexToggle({ value, onChange }: { value: "F" | "M"; onChange: (v: "F" | "M") => void }) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {(["F", "M"] as const).map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{
              flex: 1,
              maxWidth: 120,
              padding: "10px 0",
              background: active ? FARM.ink : "transparent",
              color: active ? FARM.neon : FARM.ink,
              border: `1.5px solid ${FARM.ink}`,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {s === "F" ? "여자" : "남자"}
          </button>
        );
      })}
    </div>
  );
}

function CharacterPreview({ sex }: { sex: "F" | "M" }) {
  // 향후 스프라이트가 생기면 <Image> 로 교체. 지금은 이모지 폴백.
  const [hasSprite, setHasSprite] = useState(true);
  const spriteSrc = `/farm/characters/human_${sex === "F" ? "f" : "m"}_full.png`;

  return (
    <div
      style={{
        background: FARM.cardBg,
        border: `1px solid ${FARM.cardEdge}`,
        borderRadius: 2,
        aspectRatio: "3/4",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {hasSprite ? (
        <Image
          src={spriteSrc}
          alt={sex === "F" ? "여성 농장주" : "남성 농장주"}
          fill
          sizes="240px"
          style={{ objectFit: "contain", padding: 16 }}
          onError={() => setHasSprite(false)}
        />
      ) : (
        <div style={{ fontSize: 120 }}>{sex === "F" ? "👩" : "👨"}</div>
      )}

      <div
        className="font-mono"
        style={{
          position: "absolute",
          bottom: 8,
          left: 10,
          fontSize: 9,
          letterSpacing: "0.2em",
          color: FARM.inkSoft,
          opacity: 0.7,
        }}
      >
        PREVIEW
      </div>
    </div>
  );
}

// ── 동물 카드 ───────────────────────────────────────────────────────────

function AnimalCard({
  icon,
  label,
  animal,
  species,
  choices,
  onChoicesChange,
  animalName,
  onAnimalNameChange,
}: {
  icon: string;
  label: string;
  animal: NewAnimalData;
  species: Species;
  choices: Record<string, string>;
  onChoicesChange: (next: Record<string, string>) => void;
  animalName: string;
  onAnimalNameChange: (v: string) => void;
}) {
  const playerTraits = species.genes.filter((g) => g.player_selectable);

  return (
    <div
      style={{
        background: FARM.cardBg,
        border: `1px solid ${FARM.cardEdge}`,
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 36, lineHeight: 1 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
          <div className="font-mono" style={{ fontSize: 10, color: FARM.inkSoft, letterSpacing: "0.15em" }}>
            G·{animal.grade} · 1세대
          </div>
        </div>
      </div>

      {/* 이름 */}
      <div>
        <label className="font-mono" style={{ display: "block", fontSize: 10, letterSpacing: "0.18em", color: FARM.inkSoft, marginBottom: 4 }}>
          이름 (옵션)
        </label>
        <input
          type="text"
          value={animalName}
          onChange={(e) => onAnimalNameChange(e.target.value)}
          placeholder="비워두면 나중에"
          maxLength={20}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${FARM.line}`,
            padding: "4px 0",
            fontSize: 14,
            color: FARM.ink,
            outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => (e.currentTarget.style.borderBottomColor = FARM.ink)}
          onBlur={(e) => (e.currentTarget.style.borderBottomColor = FARM.line)}
        />
      </div>

      {/* 형질 선택 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {playerTraits.map((trait) => (
          <PhenotypePicker
            key={trait.id}
            trait={trait}
            current={choices[trait.id]}
            onChange={(label) => onChoicesChange({ ...choices, [trait.id]: label })}
          />
        ))}
      </div>

      {/* 활성 특성 */}
      <div>
        <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: FARM.inkSoft, marginBottom: 6 }}>
          활성 특성
        </div>
        <TraitChips activeIds={animal.active_traits} />
      </div>
    </div>
  );
}

function PhenotypePicker({
  trait,
  current,
  onChange,
}: {
  trait: GeneTrait;
  current: string | undefined;
  onChange: (label: string) => void;
}) {
  // 동형접합 표현형 옵션을 매니페스트에서 추출
  const options = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const allele of trait.alleles) {
      const label = trait.expression([allele.code, allele.code]);
      if (!seen.has(label)) {
        seen.add(label);
        result.push(label);
      }
    }
    return result;
  }, [trait]);

  return (
    <div>
      <div className="font-mono" style={{ fontSize: 10, letterSpacing: "0.18em", color: FARM.inkSoft, marginBottom: 4 }}>
        {trait.label_ko}
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {options.map((label) => {
          const active = current === label;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onChange(label)}
              style={{
                padding: "5px 12px",
                fontSize: 12,
                fontWeight: active ? 700 : 400,
                background: active ? FARM.neon : "transparent",
                color: FARM.ink,
                border: `1px solid ${active ? FARM.ink : FARM.lineSolid}`,
                cursor: "pointer",
                transition: "all .12s",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TraitChips({ activeIds }: { activeIds: string[] }) {
  if (activeIds.length === 0) {
    return (
      <div className="font-mono" style={{ fontSize: 11, color: FARM.inkSoft, fontStyle: "italic", padding: "4px 0" }}>
        보통 (특별한 특성 없음)
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {activeIds.map((id) => {
        const spec = TRAIT_REGISTRY[id];
        if (!spec) return null;
        const isPenalty = spec.rarity_label === "PENALTY";
        const isRare = spec.rarity_label === "RARE" || spec.rarity_label === "LEGENDARY";

        let bg = FARM.neonSoft;
        let textColor = FARM.ink;
        let border = FARM.lineSolid;

        if (isPenalty) {
          bg = "rgba(232,113,77,0.18)";
          textColor = FARM.warn;
          border = FARM.warn;
        } else if (isRare) {
          bg = FARM.neon;
          textColor = FARM.ink;
          border = FARM.ink;
        }

        return (
          <div
            key={id}
            title={spec.description}
            style={{
              padding: "3px 9px",
              fontSize: 11,
              fontWeight: 600,
              background: bg,
              color: textColor,
              border: `1px solid ${border}`,
              borderRadius: 2,
            }}
          >
            {spec.label_ko}
          </div>
        );
      })}
    </div>
  );
}

// ── 헬퍼 ────────────────────────────────────────────────────────────────

function makeSeed(): string {
  return `farm-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}