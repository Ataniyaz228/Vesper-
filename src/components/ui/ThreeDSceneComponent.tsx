"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, PresentationControls, useTexture } from "@react-three/drei";
import * as THREE from "three";

// --- Detailed 3D Vinyl Record ---
const VinylRecord = ({ activeTrack }: { activeTrack: { coverUrl?: string, color2?: string } }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Load the actual cover art texture directly from CORS-friendly source
    const textureBase = useTexture(activeTrack.coverUrl as string) as THREE.Texture;
    const texture = React.useMemo(() => {
        const cloned = textureBase.clone();
        cloned.colorSpace = THREE.SRGBColorSpace;

        // Fix texture rotation because of how CircleGeometry maps UVs
        cloned.center.set(0.5, 0.5);
        cloned.rotation = -Math.PI / 2;
        return cloned;
    }, [textureBase]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Elegant slow rotation
            groupRef.current.rotation.y -= delta * 0.4;
            groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
            groupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.3) * 0.05;
        }
    });

    return (
        <group rotation={[Math.PI / 8, Math.PI / 8, 0]} position={[0, -0.2, 0]}>
            <group ref={groupRef}>
                {/* 1. Hyper-Realistic Glossy Vinyl Base */}
                <mesh castShadow receiveShadow>
                    <cylinderGeometry args={[2.8, 2.8, 0.04, 128]} />
                    <meshPhysicalMaterial
                        color="#050505"
                        roughness={0.2}
                        metalness={0.8}
                        clearcoat={1.0}
                        clearcoatRoughness={0.1}
                        envMapIntensity={2.0} // Very reflective
                    />
                </mesh>

                {/* 2. Elegant Track Separators (Grooves) */}
                {[1.4, 1.8, 2.3, 2.6].map((radius, i) => (
                    <mesh key={`groove-${i}`} position={[0, 0.021, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <torusGeometry args={[radius, 0.004, 16, 128]} />
                        <meshStandardMaterial color="#000000" roughness={0.4} metalness={0.2} />
                    </mesh>
                ))}

                {/* 3. Real Album Cover Label */}
                <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.9, 64]} />
                    <meshStandardMaterial map={texture} roughness={0.5} metalness={0.1} />
                </mesh>

                {/* 4. Center Hole Pitch-Black */}
                <mesh position={[0, 0.023, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.05, 32]} />
                    <meshBasicMaterial color="#000000" />
                </mesh>
            </group>

            {/* 5. Turntable Platter (Adds weight and grounds the scene) */}
            <mesh position={[0, -0.15, 0]}>
                <cylinderGeometry args={[2.9, 2.9, 0.1, 128]} />
                <meshStandardMaterial color="#111111" roughness={0.6} metalness={0.5} />
            </mesh>

            {/* 6. Glowing Aura Underglow (Fills bottom void) */}
            <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[2.0, 3.4, 64]} />
                <meshBasicMaterial color={activeTrack.color2} transparent opacity={0.15} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
};

export default function ThreeDSceneComponent({ activeTrack }: { activeTrack?: { coverUrl?: string, color2?: string } }) {
    return (
        <Canvas camera={{ position: [0, 0, 10], fov: 35 }} dpr={[1, 2]}>
            <Environment preset="studio" />
            <ambientLight intensity={0.4} />

            {/* Subtle Rim Lighting */}
            <directionalLight position={[10, 10, -5]} intensity={1.0} color="#ffffff" />
            {/* Colored side-fill from the active track */}
            <spotLight position={[-10, 0, 5]} intensity={2.0} color={activeTrack?.color2 || "#ffffff"} penumbra={1} distance={20} />

            <PresentationControls
                global
                snap={true}
                rotation={[0, 0, 0]}
                polar={[-Math.PI / 4, Math.PI / 4]}
                azimuth={[-Math.PI / 3, Math.PI / 3]}
                // @ts-expect-error PresentationControls types are incomplete
                config={{ mass: 1, tension: 170, friction: 26 }}
            >
                <Suspense fallback={null}>
                    <group scale={1.2} position={[0, 0.2, 0]}>
                        {activeTrack && <VinylRecord activeTrack={activeTrack} />}
                    </group>
                </Suspense>
            </PresentationControls>
        </Canvas>
    );
}
