// src/app/code/games/farm/new/page.tsx
// 캐릭터 생성 + 시작 동물 형질 선택 화면 — 다음 단계에서 구현.

export const metadata = { title: "새 농장 — INDEX·404" };

export default function Page() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#FAFAF7",
        color: "#0A0A0A",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 32,
      }}
    >
      <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>새 농장 시작</h1>
      <p style={{ opacity: 0.6, fontSize: 14 }}>다음 단계에서 캐릭터 생성기 + 시작 동물 형질 선택을 만듭니다.</p>
      <a
        href="/code/games/farm"
        style={{
          marginTop: 16,
          padding: "8px 16px",
          border: "1px solid #0A0A0A",
          fontFamily: "monospace",
          fontSize: 12,
          letterSpacing: "0.2em",
          textDecoration: "none",
          color: "#0A0A0A",
        }}
      >
        ← BACK
      </a>
    </div>
  );
}