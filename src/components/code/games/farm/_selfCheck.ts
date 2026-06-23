// src/components/code/games/farm/_selfCheck.ts
//
// 유전 시스템 + 특성 시스템 무결성/결정성 점검.
// 호출: useEffect 안에서 runFarmSelfCheck()

import { Rng, deriveSeed } from "./rng";
import { makeStarter, breed, type NewAnimalData, type ParentAnimal } from "./genetics";
import { calcGrade, calcVisitFee, recomputeActiveTraits } from "./grading";
import { getSpecies, TRAIT_REGISTRY, type Species } from "./species";

function asParent(d: NewAnimalData, id: string): ParentAnimal {
  return { ...d, id };
}

export function runFarmSelfCheck(): void {
  console.group("🐰 Farm Self-Check");

  const rabbit = getSpecies("rabbit");

  // 1. Starter
  const seedA = new Rng("check-starter-A");
  const seedB = new Rng("check-starter-B");
  const mom = makeStarter(rabbit, "F", seedA, { phenotypes: { color: "검정", eye: "회색" } });
  const dad = makeStarter(rabbit, "M", seedB);
  console.log("1. Starters:", { mom, dad });
  assert(mom.sex === "F", "mom should be F");
  assert(mom.generation === 1, "starter gen must be 1");
  assert(mom.genes.color[0] === mom.genes.color[1], "chosen color must be homozygous");
  assert(typeof mom.grade === "string", "starter has grade");
  assert(Array.isArray(mom.active_traits), "starter has active_traits array");
  assert(mom.active_traits.length <= 2, "starter trait cap (max 2)");

  // 2. Determinism
  const motherP = { ...asParent(mom, "mom-1"), fertility: 100 };
  const fatherP = { ...asParent(dad, "dad-1"), fertility: 100 };
  const seed = deriveSeed("breed", "mom-1", "dad-1", "visit-001");
  const r1 = breed(rabbit, { mother: motherP, father: fatherP, inbreedingF: 0, seed });
  const r2 = breed(rabbit, { mother: motherP, father: fatherP, inbreedingF: 0, seed });
  const same = JSON.stringify(r1) === JSON.stringify(r2);
  console.log("2. Same seed → same result:", same ? "✓" : "✗", r1);
  assert(same, "breeding must be deterministic");

  // 3. Different seed
  const r3 = breed(rabbit, {
    mother: motherP, father: fatherP, inbreedingF: 0,
    seed: deriveSeed("breed", "mom-1", "dad-1", "visit-002"),
  });
  const diff = JSON.stringify(r1) !== JSON.stringify(r3);
  console.log("3. Different seed → different result:", diff ? "✓" : "✗");

  // 4. Inbreeding penalty
  const avgClean = avgStat(rabbit, motherP, fatherP, 0, 200);
  const avgInbred = avgStat(rabbit, motherP, fatherP, 0.25, 200);
  console.log(`4. Inbreeding penalty (F=0 avg=${avgClean.toFixed(1)}, F=0.25 avg=${avgInbred.toFixed(1)}):`,
    avgInbred < avgClean - 2 ? "✓" : "✗");

  // 5. Grading
  const grade70 = calcGrade({
    beauty: 70, stamina: 70, temperament: 70, health: 70, fertility: 70,
    rare_genes: {}, species: "rabbit",
  });
  console.log("5. Grade for 70x5 stats:", grade70, "(expect B — A starts at 72)");
  assert(grade70 === "B", "70x5 should produce grade B");

  // 6. Visit fee
  const fee = calcVisitFee({ species: "rabbit", grade: "A" }, 5);
  console.log("6. Visit fee (rabbit, grade A, farm lvl 5):", fee, "c");

  // 7. 특성 풀 로딩
  const traitCount = Object.keys(TRAIT_REGISTRY).length;
  console.log(`7. Trait pool loaded: ${traitCount} traits`, Object.keys(TRAIT_REGISTRY));
  assert(traitCount === 11, "expected 11 traits in pool");

  // 8. 등급별 슬롯 — 시작 동물은 grade 가 B 라도 cap 2 적용
  console.log(
    `8. Starter slot cap — mom grade=${mom.grade}, active=${mom.active_traits.length} (≤2 ok)`,
  );
  assert(mom.active_traits.length <= 2, "starter cap enforced");

  // 9. 특성 유전 — 보인자 부모 둘이서 발현 자식이 나오는지 (200회 중 적어도 1번)
  let expressedCount = 0;
  const mom_pp_carrier = { ...motherP, traits: { prolific: ["P", "p"] as [string, string] } };
  const dad_pp_carrier = { ...fatherP, traits: { prolific: ["P", "p"] as [string, string] } };
  for (let i = 0; i < 200; i++) {
    const r = breed(rabbit, {
      mother: mom_pp_carrier, father: dad_pp_carrier, inbreedingF: 0,
      seed: `inh-test-${i}`,
    });
    if (!r.pregnancy) continue;
    for (const o of r.offspring) {
      // prolific 는 우성이라 부모 둘 다 carrier (Pp) 면 자식 75% 가 P 알렐 가짐 → expressed
      const geno = o.traits.prolific;
      if (geno && (geno[0] === "P" || geno[1] === "P")) expressedCount++;
    }
  }
  console.log(`9. Prolific inheritance (Pp × Pp → expect ~75% expressed): ${expressedCount} expressions in 200 breedings`);

  // 10. recomputeActiveTraits — 같은 등급이면 항상 같은 결과
  const fakeAnimal = {
    id: "test-animal-1",
    traits: mom.traits,
    grade: "A" as const,
  };
  const a1 = recomputeActiveTraits(fakeAnimal);
  const a2 = recomputeActiveTraits(fakeAnimal);
  console.log(`10. recomputeActiveTraits determinism: ${JSON.stringify(a1) === JSON.stringify(a2) ? "✓" : "✗"}`,
    a1);

  console.groupEnd();
}

function avgStat(species: Species, mom: ParentAnimal, dad: ParentAnimal, f: number, n: number): number {
  let total = 0;
  let count = 0;
  for (let i = 0; i < n; i++) {
    const r = breed(species, { mother: mom, father: dad, inbreedingF: f, seed: `chk-${f}-${i}` });
    if (!r.pregnancy) continue;
    for (const o of r.offspring) {
      total += (o.beauty + o.stamina + o.temperament + o.health + o.fertility) / 5;
      count++;
    }
  }
  return count > 0 ? total / count : 0;
}

function assert(cond: boolean, msg: string) {
  if (!cond) console.error("  ✗ ASSERT:", msg);
}