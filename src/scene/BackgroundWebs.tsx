import { useMemo } from "react";
import * as THREE from "three";

/**
 * Faint background web: radial strands from the top-center anchor plus
 * concentric arcs, drawn as a single lineSegments object.
 */
export function BackgroundWeb({ width = 30 }: { width?: number }) {
  const geometry = useMemo(() => {
    const pts: number[] = [];
    const cx = 0;
    const cy = 10;
    // radial strands fanning down
    for (let i = -8; i <= 8; i++) {
      const ang = (i / 8) * 1.1;
      const x2 = cx + Math.sin(ang) * width;
      const y2 = cy - Math.cos(ang) * 16;
      pts.push(cx, cy, -6, x2, y2, -6);
    }
    // concentric arcs
    for (let r = 3; r <= 15; r += 2.4) {
      const segs = 40;
      for (let s = 0; s < segs; s++) {
        const a0 = Math.PI + (s / segs) * Math.PI;
        const a1 = Math.PI + ((s + 1) / segs) * Math.PI;
        pts.push(
          cx + Math.cos(a0) * r * 1.4,
          cy + Math.sin(a0) * r,
          -6,
          cx + Math.cos(a1) * r * 1.4,
          cy + Math.sin(a1) * r,
          -6,
        );
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [width]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial color="#8e8e96" transparent opacity={0.08} />
    </lineSegments>
  );
}
