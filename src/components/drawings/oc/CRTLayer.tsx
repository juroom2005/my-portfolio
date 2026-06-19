// src/components/drawings/oc/CRTLayer.tsx
// CRT monitor overlay: scanlines + aperture grille + vignette + flicker + scan band.
// Keyframes (crtFlicker, crtScan) live in globals.css — see the install note.

type Props = {
  band?: boolean;
  curve?: boolean;
  strength?: number;
};

export default function CRTLayer({ band = true, curve = true, strength = 1 }: Props) {
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 40, pointerEvents: "none", overflow: "hidden" }}>
      {/* scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(0deg, rgba(0,0,0,${0.3 * strength}) 0 1px, transparent 1px 3px)`,
        }}
      />
      {/* aperture grille (rgb) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.1 * strength,
          background:
            "repeating-linear-gradient(90deg, rgba(255,0,40,1) 0 1px, rgba(0,255,90,1) 1px 2px, rgba(40,80,255,1) 2px 3px)",
        }}
      />
      {/* vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(120% 110% at 50% 48%, transparent 52%, rgba(0,0,0,${0.6 * strength}) 100%)`,
        }}
      />
      {/* flicker */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#cfe9ff",
          mixBlendMode: "overlay",
          animation: "crtFlicker 5s steps(12) infinite",
        }}
      />
      {/* moving scan band */}
      {band && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "18%",
            background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06) 50%, transparent)",
            animation: "crtScan 7s linear infinite",
          }}
        />
      )}
      {/* tube curvature */}
      {curve && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            boxShadow: `inset 0 0 120px 30px rgba(0,0,0,${0.55 * strength}), inset 0 0 8px rgba(0,0,0,0.6)`,
          }}
        />
      )}
    </div>
  );
}
