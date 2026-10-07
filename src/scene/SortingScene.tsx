import { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import type { AlgorithmId } from "../sorting/algorithms";
import type { VizSnapshot } from "../sorting/types";
import { blockHeight, blockWidth, rowWidth, xForIndex } from "./layout";
import { SpiderMan, spideyHands } from "./SpiderMan";
import { Label } from "./Label";
import {
  Beam,
  Block,
  BucketTrays,
  C,
  CountBoxes,
  HeapLinks,
  MergeArea,
  Platform,
  RangeBracket,
} from "./Blocks";
import { BackgroundWeb } from "./BackgroundWebs";

function CameraRig({ n }: { n: number }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const portrait = size.height > size.width;
  const dist = useMemo(() => {
    const w = rowWidth(Math.max(1, n));
    const base = portrait ? w * 1.05 + 9 : w * 0.75 + 7.5;
    return Math.max(11, Math.min(24, base));
  }, [n, portrait]);
  camera.position.set(0, 4.9, dist);
  (camera as { fov?: number }).fov = portrait ? 58 : 50;
  camera.updateProjectionMatrix?.();
  camera.lookAt(0, 2.4, 0);
  return null;
}

function colorAndLift(
  snap: VizSnapshot,
  i: number,
): { color: string; lift: number } {
  const op = snap.lastOp;
  if (snap.sorted[i]) return { color: C.sorted, lift: 0 };
  if (snap.lifted === i) return { color: C.lifted, lift: 1.5 };
  if (snap.pivot === i) return { color: C.pivot, lift: 0.5 };
  const hot = snap.activeA === i || snap.activeB === i;
  if (hot) {
    if (op?.kind === "swap") return { color: C.lifted, lift: 0.85 };
    if (op?.kind === "overwrite" || op?.kind === "collect")
      return { color: C.lifted, lift: 1.1 };
    if (op?.kind === "shift") return { color: C.compare, lift: 0.25 };
    return { color: C.compare, lift: 0 };
  }
  if (snap.range && i >= snap.range.low && i <= snap.range.high)
    return { color: C.range, lift: 0 };
  return { color: C.def, lift: 0 };
}

/** Block indices Spidey currently aims webs at. */
function webTargets(snap: VizSnapshot): number[] {
  const op = snap.lastOp;
  if (!op) return [];
  switch (op.kind) {
    case "compare":
      return op.a === op.b ? [op.a] : [op.a, op.b];
    case "swap":
      return [op.a, op.b];
    case "lift":
      return [op.index];
    case "shift":
      return [op.from, op.to];
    case "place":
      return [op.to];
    case "overwrite":
      return [op.index];
    case "pivot":
      return [op.index];
    case "distribute":
      return [op.from];
    case "collect":
      return [op.to];
    case "sorted":
      return [op.index];
    case "range":
      return [Math.floor((op.low + op.high) / 2)];
    default:
      return snap.activeA !== null ? [snap.activeA] : [];
  }
}

interface SortingSceneProps {
  snap: VizSnapshot;
  algorithm: AlgorithmId;
  distinctValues: number[];
  reducedMotion: boolean;
}

export function SortingScene({
  snap,
  algorithm,
  distinctValues,
  reducedMotion,
}: SortingSceneProps) {
  const n = snap.array.length;
  const targets = webTargets(snap);
  const focusX =
    targets.length > 0
      ? targets.reduce((s, i) => s + xForIndex(i, n), 0) / targets.length
      : 0;
  const rowW = rowWidth(n);
  const spideyX = Math.max(-rowW / 2, Math.min(rowW / 2, focusX));
  const hands = spideyHands(spideyX);

  const topOf = (i: number): number => {
    const s = snap.array[i];
    let lift = 0;
    if (snap.lifted === i) lift = 1.5;
    else if (
      snap.lastOp?.kind === "swap" &&
      (snap.lastOp.a === i || snap.lastOp.b === i)
    )
      lift = 0.85;
    else if (
      (snap.lastOp?.kind === "overwrite" || snap.lastOp?.kind === "collect") &&
      snap.activeA === i
    )
      lift = 1.1;
    return lift + blockHeight(s.value);
  };

  const lastOp = snap.lastOp;
  const hotBucket =
    lastOp?.kind === "distribute" || lastOp?.kind === "collect"
      ? lastOp.bucket
      : null;
  const countHighlight = lastOp?.kind === "countSet" ? lastOp.value : null;

  const showMerge =
    algorithm === "merge" && snap.range !== null && !snap.sorted.every(Boolean);
  const showHeap =
    algorithm === "heap" && snap.heapSize !== null && snap.heapSize > 1;
  const showCounts = algorithm === "counting";
  const showBuckets =
    (algorithm === "radix" || algorithm === "bucket") && snap.buckets !== null;
  const digitCaption =
    snap.digit === 1
      ? "ONES DIGIT → 10 BUCKETS"
      : snap.digit !== null
        ? `${snap.digit}S DIGIT → 10 BUCKETS`
        : "VALUE BUCKETS";

  return (
    <>
      <CameraRig n={n} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 7]} intensity={1.0} />
      <pointLight position={[-8, 4, 4]} intensity={8} color="#c81e2b" />
      <pointLight position={[8, 4, 4]} intensity={8} color="#4a7ddb" />
      <pointLight position={[0, 9, 2]} intensity={10} color="#ffffff" />

      <BackgroundWeb />
      <fog attach="fog" args={["#16161a", 18, 34]} />

      <Platform n={n} />

      {/* numbered blocks; keyed by stable id so swaps glide */}
      {snap.array.map((item, i) => {
        const { color, lift } = colorAndLift(snap, i);
        return (
          <Block
            key={item.id}
            item={item}
            x={xForIndex(i, n)}
            color={color}
            lift={lift}
            reducedMotion={reducedMotion}
            width={blockWidth(n)}
          />
        );
      })}

      {/* Spider-Man above the action */}
      <SpiderMan
        x={spideyX}
        focusX={focusX}
        active={targets.length > 0}
        reducedMotion={reducedMotion}
      />

      {/* web strands from hands to focused blocks */}
      {targets.slice(0, 2).map((ti, k) => {
        const from = k === 0 ? hands.left : hands.right;
        const x = xForIndex(ti, n);
        return (
          <Beam
            key={`${ti}-${k}`}
            from={from}
            to={[x, topOf(ti), 0.2]}
            color="#f1f5f9"
            radius={0.028}
            opacity={0.95}
          />
        );
      })}

      {/* per-algorithm overlays */}
      {showMerge && snap.range && (
        <>
          <MergeArea width={rowW + 1} />
          <RangeBracket
            low={snap.range.low}
            high={snap.range.high}
            n={n}
            divider={Math.floor((snap.range.low + snap.range.high) / 2) + 0.5}
            caption="MERGE"
          />
        </>
      )}
      {algorithm === "quick" && snap.range && (
        <RangeBracket
          low={snap.range.low}
          high={snap.range.high}
          n={n}
          caption="PARTITION"
        />
      )}
      {snap.pivot !== null && algorithm === "quick" && (
        <mesh
          position={[xForIndex(snap.pivot, n), 0.03, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[blockWidth(n) * 0.55, blockWidth(n) * 0.75, 24]} />
          <meshBasicMaterial color={C.gold} />
        </mesh>
      )}
      {showHeap && (
        <>
          <HeapLinks n={n} heapSize={snap.heapSize ?? 0} />
          <RangeBracket
            low={0}
            high={(snap.heapSize ?? 1) - 1}
            n={n}
            caption="HEAP"
          />
        </>
      )}
      {showCounts && (
        <CountBoxes
          distinct={distinctValues}
          counts={snap.counts}
          highlight={countHighlight}
        />
      )}
      {showBuckets && snap.buckets && (
        <BucketTrays
          buckets={snap.buckets}
          caption={digitCaption}
          hotBucket={hotBucket}
          width={rowW + 2}
        />
      )}
      {algorithm === "shell" && snap.gap !== null && (
        <Label
          text={`gap ${snap.gap}`}
          size={0.6}
          position={[rowW / 2 + 1.4, 3.4, 0]}
          fg={C.gold}
        />
      )}
      {algorithm === "radix" && snap.digit === null && !snap.buckets && (
        <Label
          text="grouping by digits…"
          size={0.5}
          position={[0, 4.4, -2]}
          fg="#7d8aa5"
        />
      )}
    </>
  );
}
