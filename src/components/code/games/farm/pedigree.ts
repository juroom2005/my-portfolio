// src/components/code/games/farm/pedigree.ts
//
// 근친계수(F) 계산. Wright의 공식 (단순화 — F_ancestor 재귀항은 생략).
// 4세대까지 거슬러가서 공통 조상을 찾고, 각 공통 조상에 대해
// 모든 (mother_path_length, father_path_length) 쌍의 (1/2)^(n_m+n_f+1) 합산.
//
// 표준 케이스 검증:
//   형제 교배 (full sibling)    → F = 0.25
//   부모-자식 교배              → F = 0.25
//   사촌 교배 (full cousin)     → F = 0.0625

import type { AnimalRow } from "./dbTypes";

/**
 * 단일 동물 row 를 가져오는 함수. 호출 측에서 Supabase 쿼리든 캐시든 자유.
 * 같은 세이브 내 동물만 다루므로 ID 만 받음.
 */
export type AncestorFetcher = (id: string) => Promise<AnimalRow | null>;

export async function inbreedingCoefficient(
  motherId: string | null,
  fatherId: string | null,
  fetcher: AncestorFetcher,
  maxDepth = 4,
): Promise<number> {
  if (!motherId || !fatherId) return 0;
  if (motherId === fatherId) return 0.5; // 이론상 동일 개체

  const motherPaths = await collectPaths(motherId, fetcher, maxDepth);
  const fatherPaths = await collectPaths(fatherId, fetcher, maxDepth);

  let f = 0;
  for (const [ancestorId, mPaths] of motherPaths) {
    const fPaths = fatherPaths.get(ancestorId);
    if (!fPaths) continue;

    for (const mp of mPaths) {
      for (const fp of fPaths) {
        f += Math.pow(0.5, mp + fp + 1);
      }
    }
  }

  return Math.min(1, f);
}

/**
 * 시작 동물부터 깊이 maxDepth 까지 모든 조상의 모든 경로 길이를 수집.
 * 같은 조상이 여러 경로를 통해 나타날 수 있으니 값은 배열.
 */
async function collectPaths(
  startId: string,
  fetcher: AncestorFetcher,
  maxDepth: number,
): Promise<Map<string, number[]>> {
  const paths = new Map<string, number[]>();

  async function walk(id: string, depth: number) {
    if (depth > maxDepth) return;

    const existing = paths.get(id) ?? [];
    existing.push(depth);
    paths.set(id, existing);

    if (depth === maxDepth) return;

    const animal = await fetcher(id);
    if (!animal) return;

    if (animal.mother_id) await walk(animal.mother_id, depth + 1);
    if (animal.father_id) await walk(animal.father_id, depth + 1);
  }

  await walk(startId, 0);
  return paths;
}
