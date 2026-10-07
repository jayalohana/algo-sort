import { Component, Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { ALGORITHM_IDS } from "./sorting/algorithms";
import type { AlgorithmId } from "./sorting/algorithms";
import { metaFor } from "./sorting/metadata";
import { randomValues, usePlayback } from "./playback/usePlayback";
import { SortingScene } from "./scene/SortingScene";
import { ControlBar, SettingsPanel } from "./ui/Controls";
import { LearningPanel } from "./ui/LearningPanel";

class WebGLErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(): void {
    this.setState({ failed: true });
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="webgl-fallback" role="alert">
          <h2>3D view unavailable</h2>
          <p>
            WebGL could not start in this browser. Try a browser with hardware
            acceleration enabled (Chrome, Edge, Firefox, or Safari with WebGL
            on).
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function App() {
  const [algorithm, setAlgorithm] = useState<AlgorithmId>("bubble");
  const [values, setValues] = useState<number[]>([42, 7, 88, 15, 63, 29, 5, 71]);
  const [reducedMotion, setReducedMotion] = useState<boolean>(prefersReducedMotion);

  const playback = usePlayback(values, algorithm, reducedMotion);
  const distinctValues = useMemo(
    () => Array.from(new Set(values)).sort((a, b) => a - b),
    [values],
  );

  // Keyboard controls: Space = play/pause, ArrowRight = next, R = reset.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.tagName === "INPUT" || t.tagName === "SELECT" || t.tagName === "TEXTAREA");
      if (e.key === " " && !typing) {
        e.preventDefault();
        if (playback.status === "playing") playback.pause();
        else playback.play();
      } else if (e.key === "ArrowRight" && !typing) {
        e.preventDefault();
        playback.next();
      } else if ((e.key === "r" || e.key === "R") && !typing) {
        playback.reset();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback.status, playback.opsLength]);

  return (
    <div className="app">
      <header className="topbar">
        <span className="brand">
          <span aria-hidden="true">🕷</span> Spider-Sort
        </span>
        <label className="algo-picker">
          <span className="visually-hidden">Choose sorting algorithm</span>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmId)}
            aria-label="Choose sorting algorithm"
          >
            {ALGORITHM_IDS.map((id) => (
              <option key={id} value={id}>
                {metaFor(id).name}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="stage">
        <div className="viewport-wrap">
          <WebGLErrorBoundary>
            <Suspense
              fallback={<div className="webgl-fallback">Loading 3D scene…</div>}
            >
              <Canvas
                dpr={[1, 2]}
                gl={{ antialias: true }}
                camera={{ position: [0, 4.9, 13], fov: 50 }}
                aria-label={`3D visualization of ${algorithm} sort`}
              >
                <color attach="background" args={["#16161a"]} />
                <SortingScene
                  snap={playback.snap}
                  algorithm={algorithm}
                  distinctValues={distinctValues}
                  reducedMotion={reducedMotion}
                />
              </Canvas>
            </Suspense>
          </WebGLErrorBoundary>
        </div>

        <p className="op" aria-live="polite">
          {playback.snap.message}
        </p>

        <ControlBar
          status={playback.status}
          onPlay={playback.play}
          onPause={playback.pause}
          onNext={playback.next}
          onReset={playback.reset}
          onShuffle={() => setValues(randomValues(values.length))}
          speed={playback.speed}
          onSpeed={playback.setSpeed}
          step={playback.step}
          opsLength={playback.opsLength}
          comparisons={playback.snap.comparisons}
          writes={playback.snap.writes}
        />

        <LearningPanel algorithm={algorithm} line={playback.snap.line} />
        <SettingsPanel
          values={values}
          onCustom={setValues}
          reducedMotion={reducedMotion}
          onReducedMotion={setReducedMotion}
        />
      </main>
    </div>
  );
}
