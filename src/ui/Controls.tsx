import { useState } from "react";
import { parseCustomInput } from "../playback/usePlayback";
import type { PlayStatus } from "../playback/usePlayback";

interface ControlBarProps {
  status: PlayStatus;
  onPlay: () => void;
  onPause: () => void;
  onNext: () => void;
  onReset: () => void;
  onShuffle: () => void;
  speed: number;
  onSpeed: (s: number) => void;
  step: number;
  opsLength: number;
  comparisons: number;
  writes: number;
}

/** One compact transport bar: transport + speed + live stats. */
export function ControlBar({
  status,
  onPlay,
  onPause,
  onNext,
  onReset,
  onShuffle,
  speed,
  onSpeed,
  step,
  opsLength,
  comparisons,
  writes,
}: ControlBarProps) {
  const playing = status === "playing";
  const done = status === "done";

  return (
    <div className="controlbar" role="group" aria-label="Playback controls">
      {!playing ? (
        <button
          type="button"
          className="btn primary"
          onClick={onPlay}
          aria-label={done ? "Replay sorting animation" : "Play sorting animation"}
        >
          {done ? "↻ Replay" : "▶ Play"}
        </button>
      ) : (
        <button
          type="button"
          className="btn primary"
          onClick={onPause}
          aria-label="Pause sorting animation"
        >
          ⏸ Pause
        </button>
      )}
      <button
        type="button"
        className="btn"
        onClick={onNext}
        disabled={done}
        aria-label="Advance one operation"
      >
        ⏭ Next
      </button>
      <button
        type="button"
        className="btn"
        onClick={onReset}
        aria-label="Reset animation to start"
      >
        ⟲ Reset
      </button>
      <button
        type="button"
        className="btn"
        onClick={onShuffle}
        aria-label="Shuffle blocks with new random values"
      >
        🎲 Shuffle
      </button>
      <label className="speed" htmlFor="speed">
        <span>
          Speed <span className="val">{speed}×</span>
        </span>
        <input
          id="speed"
          type="range"
          min={0.25}
          max={3}
          step={0.25}
          value={speed}
          onChange={(e) => onSpeed(Number(e.target.value))}
          aria-label="Animation speed"
        />
      </label>
      <p className="stats" aria-live="polite">
        Step {step}/{opsLength} · {status} · ⚖ {comparisons} · ✎ {writes}
      </p>
    </div>
  );
}

interface SettingsPanelProps {
  values: number[];
  onCustom: (v: number[]) => void;
  reducedMotion: boolean;
  onReducedMotion: (b: boolean) => void;
}

/** Custom numbers + reduced motion live in a collapsed Settings panel. */
export function SettingsPanel({
  values,
  onCustom,
  reducedMotion,
  onReducedMotion,
}: SettingsPanelProps) {
  const [text, setText] = useState(values.join(", "));
  const [error, setError] = useState<string | null>(null);

  const applyCustom = () => {
    const r = parseCustomInput(text);
    if (r.error) {
      setError(r.error);
      return;
    }
    setError(null);
    onCustom(r.values!);
  };

  return (
    <details className="panel disclosure">
      <summary>Settings</summary>
      <div className="disclosure-body">
        <div className="row">
          <label htmlFor="custom-input">Custom numbers (3–16, 0–99)</label>
          <div className="custom-row">
            <input
              id="custom-input"
              type="text"
              inputMode="numeric"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyCustom();
              }}
              placeholder="e.g. 42, 7, 88, 15"
              aria-label="Custom numbers, 3 to 16 integers from 0 to 99"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "custom-error" : undefined}
            />
            <button
              type="button"
              className="btn"
              onClick={applyCustom}
              aria-label="Apply custom numbers"
            >
              Set
            </button>
          </div>
          {error && (
            <p id="custom-error" className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        <div className="row inline">
          <input
            id="reduced-motion"
            type="checkbox"
            checked={reducedMotion}
            onChange={(e) => onReducedMotion(e.target.checked)}
          />
          <label htmlFor="reduced-motion">Reduced motion (instant steps)</label>
        </div>
        <p className="hint">
          Keys: <kbd>Space</kbd> play/pause · <kbd>→</kbd> next step ·{" "}
          <kbd>R</kbd> reset
        </p>
      </div>
    </details>
  );
}
