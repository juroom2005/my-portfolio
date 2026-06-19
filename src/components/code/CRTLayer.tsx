// src/components/code/CRTLayer.tsx
// 코드 섹션 전용 CRT 오버레이 (스캔라인 + 어퍼처 그릴 + 비네팅 + 플리커 + 스캔밴드).
// pointer-events: none. 키프레임(arcFlicker/arcScan)은 arcade.css 에 있다.

export default function CRTLayer({
  strength = 1,
  tint = "#cfe9ff",
  band = true,
  radius = 0,
  fixed = false,
}: {
  strength?: number;
  tint?: string;
  band?: boolean;
  radius?: number;
  fixed?: boolean;
}) {
  return (
    <div style={{ position: fixed ? "fixed" : "absolute", inset: 0, zIndex: 40, pointerEvents: "none", overflow: "hidden", borderRadius: radius }}>
      <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(0deg, rgba(0,0,0,${0.28 * strength}) 0 1px, transparent 1px 3px)` }} />
      <div style={{ position: "absolute", inset: 0, opacity: 0.07 * strength, background: "repeating-linear-gradient(90deg, rgba(255,0,40,1) 0 1px, rgba(0,255,90,1) 1px 2px, rgba(40,80,255,1) 2px 3px)" }} />
      <div style={{ position: "absolute", inset: 0, background: `radial-gradient(120% 110% at 50% 48%, transparent 55%, rgba(0,0,0,${0.62 * strength}) 100%)` }} />
      <div style={{ position: "absolute", inset: 0, background: tint, mixBlendMode: "overlay", animation: "arcFlicker 5s steps(12) infinite" }} />
      {band && <div style={{ position: "absolute", left: 0, right: 0, height: "16%", background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.05) 50%, transparent)", animation: "arcScan 6.5s linear infinite" }} />}
      <div style={{ position: "absolute", inset: 0, borderRadius: radius, boxShadow: `inset 0 0 120px 24px rgba(0,0,0,${0.5 * strength})` }} />
    </div>
  );
}
