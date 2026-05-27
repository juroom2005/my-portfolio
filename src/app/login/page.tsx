"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh(); // 서버 컴포넌트도 새 세션으로 다시 그리게
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--paper)",
        color: "var(--ink)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: 360,
          background: "var(--paper)",
          border: "1.5px solid var(--ink)",
          boxShadow: "8px 10px 0 var(--ink)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <div
            className="font-display"
            style={{ fontSize: 36, fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em" }}
          >
            LOG IN
          </div>
          <div
            className="font-mono"
            style={{ fontSize: 10, letterSpacing: "0.25em", opacity: 0.6, marginTop: 6 }}
          >
            PRIVATE INDEX · ROOM 404
          </div>
        </div>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            className="font-mono"
            style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7 }}
          >
            EMAIL
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{
              border: "1px solid var(--ink)",
              background: "transparent",
              padding: "8px 10px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </label>

        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span
            className="font-mono"
            style={{ fontSize: 9, letterSpacing: "0.25em", opacity: 0.7 }}
          >
            PASSWORD
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={{
              border: "1px solid var(--ink)",
              background: "transparent",
              padding: "8px 10px",
              fontSize: 13,
              outline: "none",
            }}
          />
        </label>

        {error && (
          <div
            className="font-mono"
            style={{
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "#c00",
              border: "1px solid #c00",
              padding: "6px 8px",
              background: "rgba(204,0,0,0.05)",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-mono"
          style={{
            border: "1.5px solid var(--ink)",
            background: loading ? "rgba(0,0,0,0.1)" : "var(--neon)",
            padding: "10px 12px",
            fontSize: 11,
            letterSpacing: "0.25em",
            fontWeight: 700,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background .15s",
          }}
        >
          {loading ? "..." : "→  LOG IN"}
        </button>

        <a
          href="/"
          className="font-mono"
          style={{
            fontSize: 9,
            letterSpacing: "0.25em",
            opacity: 0.5,
            textDecoration: "none",
            color: "inherit",
            textAlign: "center",
          }}
        >
          ← BACK TO INDEX
        </a>
      </form>
    </div>
  );
}