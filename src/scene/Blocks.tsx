import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Label } from "./Label";
import {
  BLOCK_DEPTH,
  blockHeight,
  blockWidth,
  rowWidth,
  xForIndex,
} from "./layout";
import type { Item } from "../sorting/types";

export const C = {
  def: "#c9ccd4",
  range: "#9aa0aa",
  compare: "#ffb020",
  lifted: "#ef2d3c",
  pivot: "#8b5cf6",
  sorted: "#2fd671",
  gold: "#e8c26a",
  web: "#f1f5f9",
};

/** Thin web strand stretched between two world points. */
export function Beam({
  from,
  to,
  color = C.web,
  radius = 0.03,
  opacity = 1,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
  radius?: number;
  opacity?: number;
}) {
  const { pos, quat, len } = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const dir = b.clone().sub(a);
    const len = Math.max(0.001, dir.length());
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    const pos = a.clone().add(b).multiplyScalar(0.5);
    return { pos, quat, len };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from[0], from[1], from[2], to[0], to[1], to[2]]);

  return (
    <mesh position={pos} quaternion={quat}>
      <cylinderGeometry args={[radius, radius, len, 6]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

interface BlockProps {
  item: Item;
  x: number;
  color: string;
  lift: number;
  reducedMotion: boolean;
  width: number;
}

/** One numbered 3D block. Glides toward its slot; lifts when grabbed. */
export function Block({ item, x, color, lift, reducedMotion, width }: BlockProps) {
  const group = useRef<THREE.Group>(null!);
  const h = blockHeight(item.value);

  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    if (reducedMotion) {
      g.position.x = x;
      g.position.y = lift;
      return;
    }
    const k = Math.min(1, delta * 6);
    g.position.x += (x - g.position.x) * Math.min(1, delta * 5);
    g.position.y += (lift - g.position.y) * k;
  });

  return (
    <group ref={group} position={[x, lift, 0]}>
      <mesh position={[0, h / 2, 0]}>
        <boxGeometry args={[width, h, BLOCK_DEPTH]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.22}
          roughness={0.55}
        />
      </mesh>
      {/* base glow strip */}
      <mesh position={[0, 0.03, 0]}>
        <boxGeometry args={[width, 0.06, BLOCK_DEPTH + 0.04]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Label
        text={String(item.value)}
        size={Math.min(0.55, width * 0.85)}
        position={[0, Math.max(0.45, h / 2), BLOCK_DEPTH / 2 + 0.03]}
      />
    </group>
  );
}

export function Platform({ n }: { n: number }) {
  const w = rowWidth(n) + 2.4;
  return (
    <group>
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[w, 0.36, 2.4]} />
        <meshStandardMaterial color="#232329" roughness={0.85} />
      </mesh>
      {/* subtle edge trim */}
      <mesh position={[0, -0.02, 1.21]}>
        <boxGeometry args={[w, 0.05, 0.04]} />
        <meshBasicMaterial color="#3a3a42" />
      </mesh>
      <mesh position={[0, -0.02, -1.21]}>
        <boxGeometry args={[w, 0.05, 0.04]} />
        <meshBasicMaterial color="#3a3a42" />
      </mesh>
    </group>
  );
}

/** Gold bracket over an index range, optional divider + caption. */
export function RangeBracket({
  low,
  high,
  n,
  divider = null,
  caption = "",
}: {
  low: number;
  high: number;
  n: number;
  divider?: number | null;
  caption?: string;
}) {
  const y = 3.9;
  const x0 = xForIndex(low, n) - blockWidth(n) / 2;
  const x1 = xForIndex(high, n) + blockWidth(n) / 2;
  return (
    <group>
      <Beam from={[x0, y, 0]} to={[x1, y, 0]} color={C.gold} radius={0.025} />
      <Beam from={[x0, y, 0]} to={[x0, y - 0.3, 0]} color={C.gold} radius={0.025} />
      <Beam from={[x1, y, 0]} to={[x1, y - 0.3, 0]} color={C.gold} radius={0.025} />
      {divider !== null && (
        <Beam
          from={[(x0 + x1) / 2, y, 0]}
          to={[(x0 + x1) / 2, y - 0.55, 0]}
          color={C.lifted}
          radius={0.025}
        />
      )}
      {caption !== "" && (
        <Label text={caption} size={0.55} position={[(x0 + x1) / 2, y + 0.55, 0]} fg={C.gold} />
      )}
    </group>
  );
}

/** Heap parent→child links drawn between block tops. */
export function HeapLinks({ n, heapSize }: { n: number; heapSize: number }) {
  if (heapSize <= 1) return null;
  const links: Array<{ p: number; c: number }> = [];
  for (let c = 1; c < heapSize; c++) links.push({ p: (c - 1) >> 1, c });
  return (
    <group>
      {links.map(({ p, c }) => {
        const xp = xForIndex(p, n);
        const xc = xForIndex(c, n);
        // heights depend on values; caller passes tops via y positions:
        return <HeapLink key={`${p}-${c}`} xp={xp} xc={xc} />;
      })}
    </group>
  );
}

function HeapLink({ xp, xc }: { xp: number; xc: number }) {
  // arc between two points above the blocks
  const y = 4.6;
  return (
    <group>
      <Beam from={[xp, y, -0.2]} to={[(xp + xc) / 2, y + 0.5, -0.2]} color="#22d3ee" radius={0.02} opacity={0.9} />
      <Beam from={[(xp + xc) / 2, y + 0.5, -0.2]} to={[xc, y, -0.2]} color="#22d3ee" radius={0.02} opacity={0.9} />
    </group>
  );
}

/** Count boxes for counting sort (distinct values, behind the row). */
export function CountBoxes({
  distinct,
  counts,
  highlight,
}: {
  distinct: number[];
  counts: Map<number, number>;
  highlight: number | null;
}) {
  const n = distinct.length;
  const gap = 1.15;
  const total = n * gap;
  return (
    <group position={[0, 0, -2.9]}>
      {distinct.map((v, i) => {
        const x = -total / 2 + gap / 2 + i * gap;
        const c = counts.get(v) ?? 0;
        const hot = highlight === v;
        return (
          <group key={v} position={[x, 0, 0]}>
            <mesh position={[0, 0.35, 0]}>
              <boxGeometry args={[0.9, 0.7, 0.7]} />
              <meshStandardMaterial
                color={hot ? "#ef2d3c" : "#232329"}
                emissive={hot ? "#ef2d3c" : "#55555e"}
                emissiveIntensity={hot ? 0.5 : 0.25}
                roughness={0.6}
              />
            </mesh>
            <Label text={String(v)} size={0.4} position={[0, 0.35, 0.38]} fg="#d6d0c4" />
            <Label
              text={`×${c}`}
              size={0.42}
              position={[0, 1.05, 0]}
              fg={hot ? "#ffd166" : "#ffffff"}
            />
          </group>
        );
      })}
      <Label text="COUNT BOXES" size={0.5} position={[0, 1.75, 0]} fg="#7d8aa5" />
    </group>
  );
}

/** Bucket trays for radix / bucket sort with stacked value chips. */
export function BucketTrays({
  buckets,
  caption,
  hotBucket,
  width,
}: {
  buckets: Item[][];
  caption: string;
  hotBucket: number | null;
  width: number;
}) {
  const k = buckets.length;
  const gap = 0.35;
  const trayW = Math.min(1.5, (width - (k - 1) * gap) / Math.max(1, k));
  const total = k * trayW + (k - 1) * gap;
  return (
    <group position={[0, 0, -3.1]}>
      {buckets.map((bk, b) => {
        const x = -total / 2 + trayW / 2 + b * (trayW + gap);
        const hot = hotBucket === b;
        return (
          <group key={b} position={[x, 0, 0]}>
            <mesh position={[0, 0.08, 0]}>
              <boxGeometry args={[trayW, 0.16, 1.1]} />
              <meshStandardMaterial
                color={hot ? "#ef2d3c" : "#232329"}
                emissive={hot ? "#ef2d3c" : "#55555e"}
                emissiveIntensity={hot ? 0.5 : 0.25}
              />
            </mesh>
            {bk.map((it, j) => (
              <group key={`${it.id}-${j}`} position={[0, 0.35 + j * 0.34, 0]}>
                <mesh>
                  <boxGeometry args={[Math.min(0.85, trayW * 0.8), 0.3, 0.6]} />
                  <meshStandardMaterial color="#a9adb6" emissive="#a9adb6" emissiveIntensity={0.2} />
                </mesh>
                <Label text={String(it.value)} size={0.26} position={[0, 0, 0.33]} />
              </group>
            ))}
            <Label text={String(b)} size={0.34} position={[0, -0.35, 0.4]} fg={hot ? "#ffd166" : "#7d8aa5"} />
          </group>
        );
      })}
      <Label text={caption} size={0.5} position={[0, 2.1, 0]} fg="#7d8aa5" />
    </group>
  );
}

/** Glowing merge-area panel floating above the platform. */
export function MergeArea({ width }: { width: number }) {
  return (
    <group position={[0, 4.7, -0.6]}>
      <mesh>
        <boxGeometry args={[width, 0.08, 1.6]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} />
      </mesh>
      <Label text="MERGE AREA" size={0.5} position={[0, 0.5, 0]} fg="#a5f3fc" />
    </group>
  );
}
