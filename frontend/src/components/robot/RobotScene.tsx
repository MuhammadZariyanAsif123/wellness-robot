"use client";

import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RobotModel, type RobotModelProps } from "./RobotModel";

/**
 * Procedural studio lighting: Lightformers inside <Environment> build the
 * reflections in code, so nothing is downloaded (no HDR files, no CDN).
 */
export function RobotScene(props: RobotModelProps) {
  return (
    <Canvas
      camera={{ position: [0, 1.7, 6.8], fov: 30 }}
      dpr={[1, 2]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ camera }) => camera.lookAt(0, 1.45, 0)}
      aria-hidden="true"
    >
      <Environment resolution={256} frames={1} background={false}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 4]} scale={[9, 3, 1]} />
        <Lightformer form="rect" intensity={1.3} position={[-5, 2, -1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.3} position={[5, 2, -1]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" color="#f2c9a0" intensity={1.2} position={[0, 2.5, -5]} scale={5} />
      </Environment>
      <directionalLight position={[3, 5, 4]} intensity={1.1} />

      <RobotModel {...props} />

      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={7} blur={2.6} far={3} resolution={512} />
    </Canvas>
  );
}
