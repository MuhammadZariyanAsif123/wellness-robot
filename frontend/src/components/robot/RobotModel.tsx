"use client";

import { useGSAP } from "@gsap/react";
import { RoundedBox } from "@react-three/drei";
import gsap from "gsap";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/motion/useReducedMotion";
import type { Expression, RobotState } from "@/lib/turn";
import { FACES } from "./expressions";
import { FACE_H, FACE_W, drawFace, type LedTint, type Live } from "./face";
import { visualFor } from "./states";

gsap.registerPlugin(useGSAP);

export interface RobotModelProps {
  expression: Expression;
  state: RobotState;
  reducedMotionOverride?: boolean | null;
}

const TINTS = {
  warm: { led: "#ffd9b0", blush: "#f2a477" },
  calm: { led: "#bfe3df", blush: "#8fc7c1" },
  none: { led: "#cfd8e3", blush: "#cfd8e3" },
} satisfies Record<"warm" | "calm" | "none", LedTint>;

const LIGHT_COLOR = { warm: "#f2c9a0", calm: "#7fb8b3", none: "#ffffff" } as const;
const LIGHT_INTENSITY = { warm: 6, calm: 5, none: 0 } as const;

function Shell({ children, ...rest }: React.ComponentProps<"mesh">) {
  return (
    <mesh castShadow {...rest}>
      {children}
      <meshPhysicalMaterial color="#f4f0ea" roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} />
    </mesh>
  );
}

function Metal({ children, ...rest }: React.ComponentProps<"mesh">) {
  return (
    <mesh castShadow {...rest}>
      {children}
      <meshStandardMaterial color="#8d9198" metalness={1} roughness={0.32} />
    </mesh>
  );
}

/** Two-part arm: shoulder pivot, upper arm, elbow pivot, forearm, mitten hand. */
function Arm({ side }: { side: 1 | -1 }) {
  return (
    <group
      name={side < 0 ? "arm-left" : "arm-right"}
      position={[side * 0.74, 1.3, 0]}
      rotation={[0, 0, side * 0.12]}
    >
      <Metal>
        <sphereGeometry args={[0.17, 32, 32]} />
      </Metal>
      <Shell position={[0, -0.32, 0]}>
        <capsuleGeometry args={[0.1, 0.32, 8, 20]} />
      </Shell>
      <group name="elbow" position={[0, -0.6, 0]} rotation={[-0.1, 0, 0]}>
        <Metal>
          <sphereGeometry args={[0.12, 24, 24]} />
        </Metal>
        <Shell position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.085, 0.26, 8, 20]} />
        </Shell>
        <Shell position={[0, -0.54, 0]} scale={[1, 1.15, 0.8]}>
          <sphereGeometry args={[0.14, 28, 28]} />
        </Shell>
      </group>
    </group>
  );
}

export function RobotModel({ expression, state, reducedMotionOverride }: RobotModelProps) {
  const reduced = useReducedMotion(reducedMotionOverride);
  const visual = visualFor(state, expression);
  const tint = TINTS[visual.glow];

  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);

  const live = useRef<Live>({
    ...FACES[visual.expression],
    gazeX: visual.gazeX,
    gazeY: visual.gazeY,
    mouthOpen: 0,
    blink: 0,
  });

  // Offscreen canvas painted with the LED face and used as the visor texture.
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = FACE_W;
    c.height = FACE_H;
    return c;
  }, []);
  const texture = useRef<THREE.CanvasTexture>(null);

  // Latest tint, read by draw() from effects without re-creating them.
  const tintRef = useRef<LedTint>(tint);

  const draw = (): void => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawFace(ctx, live.current, tintRef.current);
    if (texture.current) texture.current.needsUpdate = true;
  };

  // Expression and gaze: eyes first, mouth 40 ms later, head turns slightly toward the gaze.
  useGSAP(
    () => {
      tintRef.current = TINTS[visual.glow];
      const t = { ...FACES[visual.expression], gazeX: visual.gazeX, gazeY: visual.gazeY };
      const duration = reduced ? 0.1 : 0.3;
      const stagger = !reduced && visual.expressive ? 0.04 : 0;
      gsap.to(live.current, {
        eyeRx: t.eyeRx,
        eyeRy: t.eyeRy,
        browTilt: t.browTilt,
        browLift: t.browLift,
        gazeX: t.gazeX,
        gazeY: t.gazeY,
        duration,
        ease: "power2.out",
        onUpdate: draw,
      });
      gsap.to(live.current, {
        mouthWidth: t.mouthWidth,
        mouthCurve: t.mouthCurve,
        blush: t.blush,
        duration,
        delay: stagger,
        ease: "power2.out",
        onUpdate: draw,
      });
      if (head.current) {
        gsap.to(head.current.rotation, {
          y: reduced || !visual.expressive ? 0 : t.gazeX * 0.04,
          x: reduced || !visual.expressive ? 0 : t.gazeY * 0.04,
          duration,
          ease: "power2.out",
        });
      }
      draw();
    },
    { dependencies: [visual.expression, visual.gazeX, visual.gazeY, visual.expressive, reduced, visual.glow] },
  );

  // Blink: rare and small; the only animation left in safe mode (slower there).
  useGSAP(
    () => {
      const [min, max] = visual.blinkEvery;
      const schedule = (): void => {
        gsap.delayedCall(gsap.utils.random(min, max), () => {
          gsap.to(live.current, {
            blink: 1,
            duration: visual.blinkDuration / 2,
            yoyo: true,
            repeat: 1,
            ease: "sine.inOut",
            onUpdate: draw,
          });
          schedule();
        });
      };
      schedule();
    },
    { dependencies: [visual.blinkEvery[0], visual.blinkEvery[1], visual.blinkDuration] },
  );

  // Idle breath: idle only, never under reduced motion or in safe mode.
  useGSAP(
    () => {
      if (!visual.breathe || reduced || !root.current) return;
      gsap.to(root.current.scale, { y: 1.012, duration: 2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    },
    { dependencies: [visual.breathe, reduced] },
  );

  // Mouth movement while speaking. Reduced motion: a static half-open mouth.
  useGSAP(
    () => {
      if (!visual.talk) return;
      if (reduced) {
        live.current.mouthOpen = 0.5;
        draw();
      } else {
        gsap.to(live.current, {
          mouthOpen: 1,
          duration: 0.16,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
          onUpdate: draw,
        });
      }
      return () => {
        live.current.mouthOpen = 0;
        draw();
      };
    },
    { dependencies: [visual.talk, reduced] },
  );

  // Glow light in front of the face: warm, calm (exercise) or off (safe mode).
  useGSAP(
    () => {
      const l = light.current;
      if (!l) return;
      l.color.set(LIGHT_COLOR[visual.glow]);
      gsap.to(l, { intensity: LIGHT_INTENSITY[visual.glow], duration: reduced ? 0.1 : 0.3 });
    },
    { dependencies: [visual.glow, reduced] },
  );

  // Entrance, once on mount. Skipped for reduced motion and safe mode.
  useGSAP(() => {
    draw();
    if (reduced || !visual.expressive || !root.current) return;
    gsap.from(root.current.position, { y: -0.4, duration: 0.6, ease: "power2.out" });
    gsap.from(root.current.scale, { x: 0.92, y: 0.92, z: 0.92, duration: 0.6, ease: "power2.out" });
    gsap.fromTo(
      live.current,
      { blink: 1 },
      { blink: 0, duration: 0.25, delay: 0.45, ease: "power2.out", onUpdate: draw },
    );
  }, []);

  return (
    <group ref={root}>
      <group ref={head} position={[0, 2.2, 0]} name="head">
        <RoundedBox args={[1.5, 1.2, 1.1]} radius={0.38} smoothness={8} castShadow>
          <meshPhysicalMaterial color="#f4f0ea" roughness={0.26} clearcoat={1} clearcoatRoughness={0.12} />
        </RoundedBox>
        {/* Dark glass visor bezel and the LED face on top of it */}
        <RoundedBox args={[1.27, 0.93, 0.06]} radius={0.06} smoothness={6} position={[0, 0, 0.545]}>
          <meshPhysicalMaterial color="#14161a" roughness={0.1} metalness={0.5} clearcoat={1} />
        </RoundedBox>
        <mesh position={[0, 0, 0.578]}>
          <planeGeometry args={[1.18, 0.885]} />
          <meshBasicMaterial toneMapped={false}>
            <canvasTexture
              ref={texture}
              attach="map"
              args={[canvas]}
              colorSpace={THREE.SRGBColorSpace}
              anisotropy={8}
            />
          </meshBasicMaterial>
        </mesh>
        {/* Side pods */}
        {([-1, 1] as const).map((s) => (
          <Metal key={s} position={[s * 0.8, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.2, 0.2, 0.14, 40]} />
          </Metal>
        ))}
      </group>

      <Metal position={[0, 1.62, 0]}>
        <cylinderGeometry args={[0.2, 0.26, 0.24, 32]} />
      </Metal>

      <RoundedBox args={[1.1, 1.15, 0.8]} radius={0.32} smoothness={8} position={[0, 0.95, 0]} castShadow>
        <meshPhysicalMaterial color="#ebe3d8" roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.2} />
      </RoundedBox>

      <Arm side={-1} />
      <Arm side={1} />

      <pointLight ref={light} position={[0, 2.3, 2.4]} intensity={0} distance={8} />
    </group>
  );
}
