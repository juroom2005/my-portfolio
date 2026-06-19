// src/components/drawings/oc/FullBody.tsx
// Full-body silhouette placeholder. Drop a real PNG/SVG illustration on top of
// this later (absolute-positioned) — keep the same bottom-aligned bounding box.

type Props = {
  accent: string;
  locked?: boolean;
  dim?: boolean;
  mono?: boolean;
  height?: string;
};

export default function FullBody({ accent, locked = false, dim = false, mono = false, height = "100%" }: Props) {
  const body = mono ? accent : "#0C0D0B";
  const op = dim ? 0.5 : 1;
  const gid = `fb-${accent.replace("#", "")}-${mono ? "m" : "s"}`;
  return (
    <svg
      viewBox="0 0 220 560"
      height={height}
      width="100%"
      preserveAspectRatio="xMidYMax meet"
      style={{ display: "block", opacity: op, filter: mono ? `drop-shadow(0 0 10px ${accent}88)` : "none" }}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={body} stopOpacity={mono ? 0.9 : 1} />
          <stop offset="1" stopColor={body} stopOpacity={mono ? 0.35 : 0.86} />
        </linearGradient>
      </defs>
      {/* legs */}
      <path d="M96 320 L88 540 L112 540 L116 348 Z" fill={`url(#${gid})`} />
      <path d="M124 320 L132 540 L108 540 L104 348 Z" fill={`url(#${gid})`} />
      <rect x="84" y="538" width="30" height="12" rx="2" fill={body} opacity="0.9" />
      <rect x="106" y="538" width="30" height="12" rx="2" fill={body} opacity="0.9" />
      {/* torso / coat */}
      <path
        d="M84 150 C84 122 100 108 110 108 C120 108 136 122 136 150 L150 300 C154 332 150 348 110 348 C70 348 66 332 70 300 Z"
        fill={`url(#${gid})`}
      />
      {/* arms */}
      <path d="M86 158 C70 182 64 250 70 300 L84 300 C82 244 86 196 96 168 Z" fill={`url(#${gid})`} />
      <path d="M134 158 C150 182 156 250 150 300 L136 300 C138 244 134 196 124 168 Z" fill={`url(#${gid})`} />
      {/* neck + head */}
      <rect x="101" y="92" width="18" height="26" fill={body} opacity="0.92" />
      <ellipse cx="110" cy="66" rx="30" ry="34" fill={body} />
      {/* hair sweep */}
      <path
        d="M110 30 C140 30 154 56 150 92 C146 80 138 76 130 80 C128 56 122 46 110 46 C98 46 92 56 90 80 C82 76 74 80 70 92 C66 56 80 30 110 30 Z"
        fill={body}
      />
      {/* accent seams */}
      <path d="M110 120 L110 330" stroke={accent} strokeWidth="2" opacity={locked ? 0.25 : 0.85} />
      <path d="M84 196 L136 196 M80 244 L140 244" stroke={accent} strokeWidth="1.2" opacity={locked ? 0.18 : 0.5} />
      <circle cx="100" cy="66" r="2.6" fill={accent} opacity={locked ? 0.3 : 1} />
      <circle cx="120" cy="66" r="2.6" fill={accent} opacity={locked ? 0.3 : 1} />
      {locked && (
        <text x="110" y="210" textAnchor="middle" fill={accent} fontSize="80" fontStyle="italic" opacity="0.8">
          ?
        </text>
      )}
    </svg>
  );
}
