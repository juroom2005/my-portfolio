// src/components/drawings/oc/codex/ocCodexData.ts
// OC 설정도감 cast. Mirrors the broadcast roster ids (shan / ari / kei) so the
// /drawings/oc/[id] deep-link from the 전광판 lands on the right character.

export type OCChar = {
  id: string;
  rarity: "SSR" | "SS" | "SR" | "R" | "+";
  no: string;
  name: string;
  kor: string;
  tag: string;
  role: string;
  affil: string;
  ability: string;
  abilityCn: string;
  quote: string;
  cn: string;
  pinyin: string;
  accent: string;
  ink: string;
  paper: string;
  events: string[];
  stats: Record<string, number>;
  locked?: boolean;
  addSlot?: boolean;
};

export const OC_CAST: OCChar[] = [
  { id: "shan", rarity: "SSR", no: "01", name: "SHAN", kor: "샨", tag: "You said you like my eyes", role: "OBSERVER", affil: "천문대 · 校時者", ability: "Liminal Sight", abilityCn: "靈性視覺", quote: "넌 정말 사람을 볼 줄 안다고 했지.", cn: "不是真的有人看见了吧", pinyin: "BÚHUÌ ZHĒNDE YǑU RÉN KÀN", accent: "#B6E84A", ink: "#0A0A0A", paper: "#F2EFE4", events: ["시그나스 지구 · 군집 실종", "Wing-67 “불멸” 사건", "77번지 미아 보호"], stats: { 목격력: 92, 위험도: 81, 음습성: 64, 정신함몰: 38, 동조효과: 55, 충동성: 12 } },
  { id: "ari", rarity: "SS", no: "02", name: "ARI", kor: "아리", tag: "Paint the silence loud", role: "ARCHIVIST", affil: "6번 자료실", ability: "Paper Parser", abilityCn: "紙片解析", quote: "종이 한 장에도 색이 있어요.", cn: "纸张上有色彩", pinyin: "ZHǏZHĀNG SHÀNG YǑU SÈCǍI", accent: "#D58A6B", ink: "#0A0A0A", paper: "#F2EFE4", events: ["MAY-04 도큐먼트 폐기", "잉크자국 #114", "6번 자료실 침수"], stats: { 집중력: 78, 손재주: 88, 자료처리: 71, 인내심: 24, 색채감각: 96, 사회성: 18 } },
  { id: "kei", rarity: "SR", no: "03", name: "KEI", kor: "케이", tag: "Whispering from the wire", role: "RUNNER", affil: "거리 무선 채널", ability: "Wire Whisper", abilityCn: "電信潛聽", quote: "전선이 흥얼거리는 걸 들었어.", cn: "电线在哼歌", pinyin: "DIÀNXIÀN ZÀI HĒNGGĒ", accent: "#7FA8D6", ink: "#0A0A0A", paper: "#F2EFE4", events: ["공중전화 18번 · 0시 발신", "지하 4구역 정전", "루머 #099"], stats: { 청력: 94, 민첩성: 76, 잠입력: 68, 신뢰도: 41, 끈기: 52, 흔적: 9 } },
  { id: "mystery", rarity: "R", no: "04", name: "???", kor: "미지", tag: "Classified · access denied", role: "— — —", affil: "— — —", ability: "— — —", abilityCn: "— —", quote: "— — — — — — — — —", cn: "禁止访问", pinyin: "JÌNZHǏ FǍNGWÈN", accent: "#9A9A92", ink: "#0A0A0A", paper: "#F2EFE4", events: ["파일 손상 ###", "— — —", "— — —"], stats: {}, locked: true },
  { id: "add", rarity: "+", no: "05", name: "NEW", kor: "추가", tag: "Cast a new shadow", role: "— — —", affil: "— — —", ability: "— — —", abilityCn: "— —", quote: "새 캐릭터 등록 슬롯.", cn: "新角色", pinyin: "XĪN JUÉSÈ", accent: "#C6F560", ink: "#0A0A0A", paper: "#F2EFE4", events: [], stats: {}, addSlot: true },
];

export const RARITY_DOT: Record<OCChar["rarity"], number> = { SSR: 4, SS: 3, SR: 2, R: 1, "+": 0 };
