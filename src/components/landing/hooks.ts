"use client";

import { useEffect, useState } from "react";

/**
 * Counts from 0 → target over `dur` ms using ease-out-cubic.
 * Runs once per mount (target change re-runs).
 */
export function useCountUp(target: number, dur = 1200, delay = 0): number {
  const [v, setV] = useState(0);

  useEffect(() => {
    let raf: number | undefined;
    let start: number | undefined;

    const timer = window.setTimeout(() => {
      const step = (ts: number) => {
        if (start === undefined) start = ts;
        const p = Math.min(1, (ts - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        setV(Math.round(target * eased));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      if (raf !== undefined) cancelAnimationFrame(raf);
    };
  }, [target, dur, delay]);

  return v;
}

/** Ticks every second, re-renders the consumer. Returns null until mounted (SSR-safe). */
export function useClock(): Date | null {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

/** Binds ⌘K / Ctrl-K (toggle) + Esc (close) to a setter. */
export function usePaletteHotkey(setOpen: (fn: (prev: boolean) => boolean) => void, close: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen, close]);
}
