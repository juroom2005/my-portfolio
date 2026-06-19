// src/components/code/games/farm/rng.ts
//
// 시드 기반 의사난수 생성기. 같은 시드 → 같은 시퀀스.
// 교배·방문·시작 동물 생성 결과의 재현성 보장에 사용.
//
// 알고리즘: mulberry32 (32비트 상태, 통계적으로 충분히 좋음, 6줄)
// 문자열 시드 해싱: cyrb53 (Bryc) — 충돌 적고 빠름

export class Rng {
  private state: number;

  constructor(seed: number | string) {
    this.state = typeof seed === "string" ? cyrb53(seed) : seed >>> 0;
  }

  /** 0 ≤ x < 1 */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** 확률 p (0~1) 으로 true 반환 */
  roll(p: number): boolean {
    return this.next() < p;
  }

  /** 배열에서 균등 무작위 선택 */
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  /** 정수 [min, max] inclusive */
  intRange(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** 실수 [min, max) */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** 가우시안 (Box–Muller). 평균·표준편차 지정. */
  gauss(mean: number, sigma: number): number {
    const u1 = Math.max(this.next(), 1e-10);
    const u2 = this.next();
    return mean + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }
}

function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h1 >>> 0) ^ (h2 >>> 0)) >>> 0;
}

/**
 * 여러 식별자를 합쳐 안정적인 시드 문자열 생성.
 * 예: deriveSeed("breed", motherId, fatherId, visitId)
 *
 * DB의 visits.metadata 에 이 시드를 저장하면, 그 방문에서 태어난 새끼들을
 * 부모 정보 + 시드만으로 완벽 재구성 가능 (세이브 복원 용도).
 */
export function deriveSeed(...parts: string[]): string {
  return parts.join("|");
}
