import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AlgorithmId } from "../sorting/algorithms";
import { generateOps } from "../sorting/algorithms";
import type { Item, VizSnapshot } from "../sorting/types";
import { replay, toItems } from "../sorting/types";

export type PlayStatus = "idle" | "playing" | "paused" | "done";

/** Delay (ms) per operation at 1x speed. Slider adjusts around this. */
export const BASE_DELAY_MS = 900;

export function delayForSpeed(speed: number): number {
  return Math.round(BASE_DELAY_MS / speed);
}

export interface Playback {
  items: Item[];
  opsLength: number;
  step: number;
  status: PlayStatus;
  speed: number;
  setSpeed: (s: number) => void;
  snap: VizSnapshot;
  done: boolean;
  play: () => void;
  pause: () => void;
  next: () => void;
  reset: () => void;
}

/**
 * Playback controller: owns the typed op sequence and applies it to the
 * scene one op per boundary. Play uses a cancellable timeout chain; every
 * effect cleans up so reset / algorithm / input changes cancel all pending
 * animation work (no stray timers).
 */
export function usePlayback(
  values: number[],
  algorithm: AlgorithmId,
  reducedMotion: boolean,
): Playback {
  const items = useMemo(() => toItems(values), [values]);
  const ops = useMemo(
    () => generateOps(algorithm, values),
    [algorithm, values],
  );

  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<PlayStatus>("idle");
  const [speed, setSpeed] = useState(1);
  const timer = useRef<number | null>(null);
  // Generation token: bumped on reset/algorithm/input change so any
  // in-flight timeout chain exits instead of advancing stale state.
  const gen = useRef(0);

  const clearTimer = useCallback(() => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  // Any new input/algorithm cancels pending work and restarts.
  useEffect(() => {
    gen.current += 1;
    clearTimer();
    setStep(0);
    setStatus("idle");
  }, [algorithm, values, clearTimer]);

  // Reduced motion: still step through ops, just without animated delays.
  const effectiveDelay = reducedMotion ? 0 : delayForSpeed(speed);

  useEffect(() => {
    if (status !== "playing") return;
    const myGen = gen.current;
    if (step >= ops.length) {
      setStatus("done");
      return;
    }
    timer.current = window.setTimeout(() => {
      if (gen.current !== myGen) return; // cancelled
      setStep((s) => {
        const ns = Math.min(s + 1, ops.length);
        if (ns >= ops.length) setStatus("done");
        return ns;
      });
    }, effectiveDelay);
    return clearTimer;
  }, [status, step, ops.length, effectiveDelay, clearTimer]);

  const play = useCallback(() => {
    if (step >= ops.length) {
      setStep(0);
      setStatus(ops.length === 0 ? "done" : "playing");
    } else {
      setStatus("playing");
    }
  }, [step, ops.length]);

  const pause = useCallback(() => {
    gen.current += 1; // invalidate any queued advance
    clearTimer();
    setStatus((s) => (s === "playing" ? "paused" : s));
  }, [clearTimer]);

  const next = useCallback(() => {
    gen.current += 1;
    clearTimer();
    setStatus((s) => {
      void s;
      return step + 1 >= ops.length ? "done" : "paused";
    });
    setStep((s) => Math.min(s + 1, ops.length));
  }, [clearTimer, step, ops.length]);

  const reset = useCallback(() => {
    gen.current += 1;
    clearTimer();
    setStep(0);
    setStatus("idle");
  }, [clearTimer]);

  const snap = useMemo<VizSnapshot>(
    () => replay(items, ops, step),
    [items, ops, step],
  );

  return {
    items,
    opsLength: ops.length,
    step,
    status,
    speed,
    setSpeed,
    snap,
    done: step >= ops.length,
    play,
    pause,
    next,
    reset,
  };
}

/** Parse "3–16 integers 0–99" free-text input. Returns values or error. */
export function parseCustomInput(
  raw: string,
): { values?: number[]; error?: string } {
  const tokens = raw
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  if (tokens.length === 0) return { error: "Enter 3–16 integers from 0 to 99." };
  if (tokens.length < 3)
    return { error: `Only ${tokens.length} numbers — enter at least 3.` };
  if (tokens.length > 16)
    return { error: `${tokens.length} numbers — enter at most 16.` };
  const values: number[] = [];
  for (const t of tokens) {
    if (!/^\d+$/.test(t))
      return { error: `"${t}" is not a whole number from 0 to 99.` };
    const v = Number(t);
    if (v < 0 || v > 99)
      return { error: `${v} is out of range — use 0 to 99.` };
    values.push(v);
  }
  return { values };
}

export function randomValues(count = 8): number[] {
  return Array.from({ length: count }, () =>
    Math.floor(Math.random() * 100),
  );
}
