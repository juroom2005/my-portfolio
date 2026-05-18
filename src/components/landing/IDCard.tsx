"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { PROFILE } from "./data";

export default function IDCard() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const handleEnter = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const handleLeave = () => {
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      closeTimer.current = null;
    }, 120);
  };

  const RAISE = 40;

  return (
        <div
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      style={{
        position: "fixed",
        right: 24,
        bottom: 0,
        width: 240,
        zIndex: 40,
        transform: open ? `translateY(-${RAISE}px)` : "translateY(calc(100% - 92px))",
        transition: "transform .35s cubic-bezier(.2,.7,.3,1)",
        cursor: "none",
      }}
    >
      <div
        style={{
          background: "var(--paper)",
          border: "1.5px solid var(--ink)",
          boxShadow: open ? "10px 12px 0 var(--ink)" : "4px 5px 0 var(--ink)",
          transition: "box-shadow .35s",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* 상단 핸들 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            borderBottom: "1px solid var(--ink)",
            background: "var(--ink)",
            color: "var(--neon)",
          }}
        >
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.25em", fontWeight: 700 }}>
            ID · 00
          </span>
          <span style={{ flex: 1 }} />
          <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.7 }}>
            {open ? "RELEASE TO CLOSE" : "HOVER"}
          </span>
          <span
            style={{
              display: "inline-block",
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: "var(--neon)",
              animation: "pulseDot 1.4s infinite",
            }}
          />
        </div>

        {/* 프로필 헤더 */}
        <div
          style={{
            padding: "14px 14px 12px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: open ? "1px solid var(--ink)" : "1px dashed rgba(0,0,0,0.2)",
            transition: "border .3s",
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              border: "1.5px solid var(--ink)",
              background: "var(--neon)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              overflow: "hidden",
              position: "relative",
            }}
          >
            {PROFILE.avatarUrl ? (
              <Image
                src={PROFILE.avatarUrl}
                alt={PROFILE.nickname}
                fill
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span className="font-display" style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.04em" }}>
                {PROFILE.nickname.slice(0, 2)}
              </span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, letterSpacing: "-0.03em" }}>
              {PROFILE.nickname}
            </div>
            <div className="font-mono" style={{ fontSize: 9, letterSpacing: "0.2em", opacity: 0.6, marginTop: 3 }}>
              {PROFILE.handle}
            </div>
          </div>
        </div>

        {/* 펼쳐졌을 때만 보이는 영역 */}
        <div
          style={{
            opacity: open ? 1 : 0,
            transition: "opacity .25s ease",
            transitionDelay: open ? ".12s" : "0s",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Bio */}
          <div
            style={{
              padding: "12px 14px",
              fontSize: 11,
              lineHeight: 1.55,
              borderBottom: "1px dashed rgba(0,0,0,0.2)",
            }}
          >
            {PROFILE.bio}
          </div>

          {/* Email */}
          <a
            href={`mailto:${PROFILE.email}`}
            style={{
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px dashed rgba(0,0,0,0.2)",
              color: "inherit",
              textDecoration: "none",
              cursor: "none",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--neon-soft)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span className="font-mono" style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.6 }}>
              EMAIL
            </span>
            <span style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {PROFILE.email}
            </span>
          </a>

          {/* Links */}
          <div style={{ padding: "8px 0" }}>
            {PROFILE.links.map((l) => (
             <a 
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  color: "inherit",
                  textDecoration: "none",
                  cursor: "none",
                  transition: "background .12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--neon-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span
                  className="font-mono"
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.2em",
                    padding: "1px 5px",
                    border: "1px solid var(--ink)",
                    background: l.kind === "sns" ? "transparent" : "var(--neon)",
                  }}
                >
                  {l.kind.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{l.label}</span>
                <span style={{ opacity: 0.4 }}>→</span>
              </a>
            ))}
          </div>

          {/* Footer */}
          <div
            className="font-mono"
            style={{
              padding: "8px 14px",
              fontSize: 8,
              letterSpacing: "0.25em",
              opacity: 0.5,
              borderTop: "1px solid var(--ink)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>{PROFILE.since}</span>
            <span>PRIVATE INDEX</span>
          </div>
        </div>
      </div>
    </div>
  );
}