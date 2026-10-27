import { useMemo } from "react";
import { Billboard } from "@react-three/drei";
import * as THREE from "three";

interface LabelProps {
  text: string;
  /** plane height in world units */
  size?: number;
  fg?: string;
  bg?: string;
  position?: [number, number, number];
}

/**
 * Crisp number label drawn on a local canvas texture (no network fonts).
 * Wrapped in a Billboard so numbers stay readable from any angle.
 */
export function Label({
  text,
  size = 0.5,
  fg = "#ffffff",
  bg = "rgba(0,0,0,0)",
  position = [0, 0, 0],
}: LabelProps) {
  const texture = useMemo(() => {
    const S = 256;
    const canvas = document.createElement("canvas");
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext("2d")!;
    if (bg !== "rgba(0,0,0,0)") {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, S, S);
    }
    ctx.fillStyle = fg;
    ctx.font = `900 ${text.length > 1 ? 120 : 150}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    // dark outline for readability on bright blocks
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.strokeText(text, S / 2, S / 2 + 6);
    ctx.fillText(text, S / 2, S / 2 + 6);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, [text, fg, bg]);

  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} />
      </mesh>
    </Billboard>
  );
}



//daily
//daily
//daily