"use client";

type Props = {
  /** Logical (unscaled) x in artboard space. Set far negative to hide. */
  x: number;
  y: number;
};

/**
 * Neon diamond cursor — replaces the native pointer.
 * The parent should set `cursor: none` so the OS pointer doesn't show through.
 */
export default function DiamondCursor({ x, y }: Props) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 30 30"
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 100,
        left: x - 10,
        top: y - 10,
        opacity: x > -500 ? 1 : 0,
        transition: "opacity .15s",
        filter: "drop-shadow(0 2px 0 rgba(0,0,0,0.25))",
      }}
    >
      <path
        d="M15 2 L28 15 L15 28 L2 15 Z"
        fill="#B4FF3A"
        stroke="#0A0A0A"
        strokeWidth="1.8"
        strokeLinejoin="miter"
      />
      <path d="M15 2 L15 28 M2 15 L28 15" stroke="#0A0A0A" strokeWidth="1" opacity="0.55" />
      <path
        d="M15 2 L8 15 L15 28 L22 15 Z"
        fill="none"
        stroke="#0A0A0A"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <path d="M15 5 L18 12" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
