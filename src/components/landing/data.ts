export type JournalEntry = { d: string; t: string };
export type PaletteItem = { k: string; s: string; icon: string };

export type ProfileLink = { label: string; href: string; kind: "sns" | "site" };


export const NOTES: JournalEntry[] = [
  { d: "05.16", t: "오늘은 더 이상 무언가를 새로 만들고 싶지 않다. 만들어 놓은 것들을 다시 보고 싶다." },
  { d: "05.14", t: "책 한 권을 다 읽고 나면 생기는 그 공허함이 좋다." },
  { d: "05.12", t: "산책길에 본 형광 녹색의 이끼. 사진으로는 절대 안 잡힘." },
  { d: "05.10", t: "내가 만든 것들을 한 군데 모으는 것이 결국 나를 모으는 일." },
];

export const PALETTE_ITEMS: PaletteItem[] = [
  { k: "그림 열기",      s: "01 · DRAWINGS",   icon: "01" },
  { k: "사진 열기",      s: "02 · PHOTOS",     icon: "02" },
  { k: "일기 열기",      s: "03 · JOURNAL",    icon: "03" },
  { k: "글 열기",        s: "04 · NOTES",      icon: "04" },
  { k: "음악 열기",      s: "05 · SOUND",      icon: "05" },
  { k: "책갈피 열기",    s: "06 · BOOKMARKS",  icon: "06" },
  { k: "코드 열기",      s: "07 · CODE",       icon: "07" },
  { k: "새 글 작성",     s: "NEW · NOTE",      icon: "+" },
  { k: "새 그림 업로드", s: "NEW · DRAWING",   icon: "+" },
  { k: "백업 / 동기화",  s: "SYSTEM · SYNC",   icon: "⇅" },
  { k: "설정",          s: "SYSTEM · CONFIG", icon: "⚙" },
];

export const COUNTS = {
  drawings: 142,
  photos: 318,
  journal: 412,
  notes: 56,
  sound: 89,
  bookmarks: 201,
  code: 34,
  total: 1232,
};


export const PROFILE = {
  avatarUrl: "/avatar.png", // public/avatar.png에 넣으세요. 없으면 일단 비워두고 이니셜로
  nickname: "Pollonia",
  handle: "@juroom2005",
  email: "mode20059841@gmail.com",
  bio: "Hi, I'm Pollonia. This is my personal web space for sharing my works and more. Welcome and enjoy😄",
  since: "EST.2026",
  links: [
    { label: "GitHub",    href: "https://github.com/juroom2005",   kind: "sns"  },
    { label: "Instagram", href: "https://instagram.com/",           kind: "sns"  },
    { label: "X",         href: "https://x.com/",                   kind: "sns"  },
    { label: "Commission",href: "https://example.com/commission",   kind: "site" },
  ] as ProfileLink[],
};