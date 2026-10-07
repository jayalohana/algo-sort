import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const SPIDEY_Y = 6.1;
export const SPIDEY_TOP = 10;

const SUIT_RED = "#c81e2b";
const SUIT_BLUE = "#1e4fd8";
const SUIT_DARK = "#0f2a7a";
const EYE_WHITE = "#f8fafc";

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Approximate world positions of Spidey's hands (web origins). */
export function spideyHands(x: number): {
  left: [number, number, number];
  right: [number, number, number];
} {
  return {
    left: [x - 0.62, SPIDEY_Y - 0.55, 0.15],
    right: [x + 0.62, SPIDEY_Y - 0.55, 0.15],
  };
}

interface SpiderManProps {
  x: number;
  /** world x of whatever Spidey is looking at / aiming at */
  focusX: number;
  /** whether webs are currently fired at blocks */
  active: boolean;
  reducedMotion: boolean;
}

/**
 * Spider-Man built from local geometry only (spheres, capsules, boxes).
 * Hangs upside down from a web: feet grip the line at top, head points
 * down at the blocks. Arms animate to aim at the focused block.
 */
export function SpiderMan({ x, focusX, active, reducedMotion }: SpiderManProps) {
  const group = useRef<THREE.Group>(null!);
  const armL = useRef<THREE.Group>(null!);
  const armR = useRef<THREE.Group>(null!);
  const head = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    // glide toward target x
    const k = reducedMotion ? 1 : Math.min(1, delta * 3.2);
    g.position.x += (x - g.position.x) * k;
    if (reducedMotion) {
      g.position.y = SPIDEY_Y;
      g.rotation.z = 0;
    } else {
      g.position.y = SPIDEY_Y + Math.sin(t * 1.15) * 0.09;
      g.rotation.z = Math.sin(t * 0.7) * 0.055;
    }
    const aim = clamp((focusX - g.position.x) * 0.28, -0.85, 0.85);
    const wave = reducedMotion ? 0 : Math.sin(t * (active ? 6 : 2.2)) * (active ? 0.16 : 0.07);
    if (armL.current) armL.current.rotation.z = 0.5 + aim + wave;
    if (armR.current) armR.current.rotation.z = -0.5 + aim - wave;
    if (armL.current) armL.current.rotation.x = active ? -0.5 : -0.15;
    if (armR.current) armR.current.rotation.x = active ? -0.5 : -0.15;
    if (head.current && !reducedMotion) {
      head.current.rotation.y = Math.sin(t * 0.9) * 0.12;
    }
  });

  return (
    <group ref={group} position={[x, SPIDEY_Y, 0]}>
      {/* hanging web: from feet up out of frame */}
      <mesh position={[0, (SPIDEY_TOP - SPIDEY_Y) / 2 + 1, 0]}>
        <cylinderGeometry args={[0.035, 0.035, SPIDEY_TOP - SPIDEY_Y, 8]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      {/* second strand for a twisted-web look */}
      <mesh position={[0.09, (SPIDEY_TOP - SPIDEY_Y) / 2 + 1, 0.02]} rotation={[0, 0, 0.012]}>
        <cylinderGeometry args={[0.018, 0.018, SPIDEY_TOP - SPIDEY_Y, 6]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.7} />
      </mesh>

      {/* feet gripping the web (up) */}
      <mesh position={[-0.16, 1.12, 0]}>
        <boxGeometry args={[0.22, 0.3, 0.24]} />
        <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
      </mesh>
      <mesh position={[0.16, 1.12, 0]}>
        <boxGeometry args={[0.22, 0.3, 0.24]} />
        <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
      </mesh>

      {/* legs (blue) going down from feet to hips */}
      <mesh position={[-0.17, 0.62, 0]} rotation={[0, 0, 0.06]}>
        <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
        <meshStandardMaterial color={SUIT_BLUE} roughness={0.55} />
      </mesh>
      <mesh position={[0.17, 0.62, 0]} rotation={[0, 0, -0.06]}>
        <capsuleGeometry args={[0.15, 0.55, 6, 12]} />
        <meshStandardMaterial color={SUIT_BLUE} roughness={0.55} />
      </mesh>

      {/* torso (blue with red sides) */}
      <mesh position={[0, -0.05, 0]}>
        <capsuleGeometry args={[0.34, 0.45, 6, 16]} />
        <meshStandardMaterial color={SUIT_BLUE} roughness={0.55} />
      </mesh>
      {/* spider emblem */}
      <mesh position={[0, -0.02, 0.33]} scale={[1, 1.3, 0.4]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.4} />
      </mesh>
      {/* belt */}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.32, 0.045, 8, 24]} />
        <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
      </mesh>

      {/* arms: pivot groups at shoulders, capsules point down-out */}
      <group ref={armL} position={[-0.38, 0.05, 0]}>
        <mesh position={[0, -0.42, 0]}>
          <capsuleGeometry args={[0.12, 0.6, 6, 12]} />
          <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
        </mesh>
        {active && (
          <mesh position={[0, -0.82, 0.1]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}
      </group>
      <group ref={armR} position={[0.38, 0.05, 0]}>
        <mesh position={[0, -0.42, 0]}>
          <capsuleGeometry args={[0.12, 0.6, 6, 12]} />
          <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.82, 0]}>
          <sphereGeometry args={[0.15, 12, 12]} />
          <meshStandardMaterial color={SUIT_RED} roughness={0.5} />
        </mesh>
        {active && (
          <mesh position={[0, -0.82, 0.1]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        )}
      </group>

      {/* head (red mask), hanging lowest */}
      <mesh ref={head} position={[0, -0.85, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial color={SUIT_RED} roughness={0.45} />
      </mesh>
      {/* mask web rings */}
      <mesh position={[0, -0.85, 0]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.42, 0.012, 6, 32]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.85, 0]} rotation={[0, 0.5, 0.35]}>
        <torusGeometry args={[0.42, 0.012, 6, 32]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.6} />
      </mesh>
      {/* white eyes on the downward face */}
      <mesh position={[-0.18, -1.02, 0.3]} rotation={[-0.5, -0.25, 0.35]} scale={[1, 1.45, 0.45]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={EYE_WHITE} roughness={0.2} />
      </mesh>
      <mesh position={[0.18, -1.02, 0.3]} rotation={[-0.5, 0.25, -0.35]} scale={[1, 1.45, 0.45]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={EYE_WHITE} roughness={0.2} />
      </mesh>
      {/* eye rims */}
      <mesh position={[-0.18, -1.02, 0.27]} rotation={[-0.5, -0.25, 0.35]} scale={[1.18, 1.62, 0.4]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.6} />
      </mesh>
      <mesh position={[0.18, -1.02, 0.27]} rotation={[-0.5, 0.25, -0.35]} scale={[1.18, 1.62, 0.4]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color="#0b0f1a" roughness={0.6} />
      </mesh>
      {/* unused var guard for SUIT_DARK tint on joints */}
      <mesh position={[0, -0.45, -0.28]} scale={[1, 0.6, 0.5]}>
        <sphereGeometry args={[0.2, 10, 10]} />
        <meshStandardMaterial color={SUIT_DARK} roughness={0.6} />
      </mesh>
    </group>
  );
}
