// src/components/code/games/farm/_selfCheck.ts
//
// 유전 시스템 무결성/결정성 점검. 아무 컴포넌트에서나 호출해서
// 브라우저 콘솔에 결과를 확인할 수 있는 스모크 테스트.
//
// 사용:
//   import { runFarmSelfCheck } from "@/components/code/games/farm/_selfCheck";
//   useEffect(() => { runFarmSelfCheck(); }, []);
//
// 검증 항목:
//   1. 시작 동물 생성 (선택 표현형이 동형접합으로 들어가는지)
//   2. 같은 시드 → 같은 교배 결과 (결정성)
//   3. 다른 시드 → 다른 결과
//   4. 근친 페널티 (F=0.25일 때 평균 스탯이 낮아지는가)
//   5. 등급 계산 sanity (70x5 → A)

import { Rng, deriveSeed } from "./rng";
import { makeStarter, breed, type NewAnimalData, type ParentAnimal } from "./genetics";
import { calcGrade, calcVisitFee } from "./grading";
import { getSpecies, type Species } from "./species";

function asParent(d: NewAnimalData, id: string): ParentAnimal {
  return { ...d, id };
}

export function runFarmSelfCheck(): void {
  console.group("🐰 Farm Self-Check");

  const rabbit = getSpecies("rabbit");

  // 1. Starter generation
  const seedA = new Rng("check-starter-A");
  const seedB = new Rng("check-starter-B");
  const mom = makeStarter(rabbit, "F", seedA, { phenotypes: { color: "검정", eye: "회색" } });
  const dad = makeStarter(rabbit, "M", seedB);
  console.log("1. Starters:", { mom, dad });
  assert(mom.sex === "F", "mom should be F");
  assert(dad.sex === "M", "dad should be M");
  assert(mom.generation === 1, "starter gen must be 1");
  assert(mom.mother_id === null, "starter mother_id null");
  assert(
    mom.genes.color[0] === mom.genes.color[1],
    "chosen color must be homozygous",
  );
  assert(rabbit.genes.find((g) => g.id === "color")!.expression(mom.genes.color) === "검정",
    "chosen color phenotype must match");

  // 2. Determinism
  const motherP = { ...asParent(mom, "mom-1"), fertility: 100 };
  const fatherP = { ...asParent(dad, "dad-1"), fertility: 100 };
  const seed = deriveSeed("breed", "mom-1", "dad-1", "visit-001");
  const r1 = breed(rabbit, { mother: motherP, father: fatherP, inbreedingF: 0, seed });
  const r2 = breed(rabbit, { mother: motherP, father: fatherP, inbreedingF: 0, seed });
  const same = JSON.stringify(r1) === JSON.stringify(r2);
  console.log("2. Same seed → same result:", same ? "✓" : "✗", r1);
  assert(same, "breeding must be deterministic for same seed");

  // 3. Different seed
  const r3 = breed(rabbit, {
    mother: motherP, father: fatherP, inbreedingF: 0,
    seed: deriveSeed("breed", "mom-1", "dad-1", "visit-002"),
  });
  const diff = JSON.stringify(r1) !== JSON.stringify(r3);
  console.log("3. Different seed → different result:", diff ? "✓" : "✗");

  // 4. Inbreeding penalty (avg stat over many breedings)
  const avgClean = avgStat(rabbit, motherP, fatherP, 0, 200);
  const avgInbred = avgStat(rabbit, motherP, fatherP, 0.25, 200);
  console.log(`4. Inbreeding penalty (F=0 avg=${avgClean.toFixed(1)}, F=0.25 avg=${avgInbred.toFixed(1)}):`,
    avgInbred < avgClean - 2 ? "✓" : "✗");
  assert(avgInbred < avgClean, "F=0.25 should reduce average stats");

  // 5. Grading sanity
  const grade70 = calcGrade({
    beauty: 70, stamina: 70, temperament: 70, health: 70, fertility: 70,
    rare_genes: {}, species: "rabbit",
  });
  console.log("5. Grade for 70x5 stats:", grade70, "(expect B — A starts at 72)");
  assert(grade70 === "B", "70x5 should produce grade B");

  const grade20Weak = calcGrade({
    beauty: 90, stamina: 90, temperament: 90, health: 90, fertility: 20,
    rare_genes: {}, species: "rabbit",
  });
  console.log("   Weakest-link demo (90/90/90/90/20):", grade20Weak, "(곱셈식이라 끌어내려짐)");

  // 6. Visit fee
  const fee = calcVisitFee({ species: "rabbit", grade: "A" }, 5);
  console.log("6. Visit fee (rabbit, grade A, farm lvl 5):", fee, "c");

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
