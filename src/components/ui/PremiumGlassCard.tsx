"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float, PresentationControls, useTexture, RoundedBox, MeshTransmissionMaterial } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

const SceneContent = ({ activeTrack }: { activeTrack: { coverUrl?: string, color1?: string, color2?: string } }) => {
    const groupRef = useRef<THREE.Group>(null);
    const textureBase = useTexture(activeTrack.coverUrl as string) as THREE.Texture;
    const texture = React.useMemo(() => {
        const cloned = textureBase.clone();
        cloned.colorSpace = THREE.SRGBColorSpace;
        return cloned;
    }, [textureBase]);

    // Slight continuous movement
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
            groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.4) * 0.05;
        }
    });

    return (
        <group ref={groupRef}>
            <Float
                speed={2}
                rotationIntensity={0.2}
                floatIntensity={0.5}
                floatingRange={[-0.1, 0.1]}
            >
                <PresentationControls
                    global
                    rotation={[0, -0.1, 0]}
                    polar={[-0.2, 0.2]}
                    azimuth={[-0.3, 0.3]}
                >
                    <group scale={1.2}>
                        {/* 1. The Vinyl Record peeking out from the right */}
                        <mesh position={[0.8, 0, -0.15]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                            <cylinderGeometry args={[1.4, 1.4, 0.02, 64]} />
                            <meshPhysicalMaterial
                                color="#020202"
                                roughness={0.1}
                                metalness={0.9}
                                clearcoat={1.0}
                                clearcoatRoughness={0.1}
                            />
                        </mesh>

                        {/* Vinyl Grooves  */}
                        {[0.6, 0.8, 1.0, 1.2].map((radius, i) => (
                            <mesh key={`groove-${i}`} position={[0.8, 0, -0.14]} rotation={[0, 0, 0]}>
                                <torusGeometry args={[radius, 0.002, 16, 64]} />
                                <meshStandardMaterial color="#111" roughness={0.5} />
                            </mesh>
                        ))}

                        {/* Vinyl Inner Label */}
                        <mesh position={[0.8, 0, -0.138]} rotation={[0, 0, 0]}>
                            <circleGeometry args={[0.45, 32]} />
                            <meshBasicMaterial map={texture} />
                        </mesh>

                        {/* Center Hole */}
                        <mesh position={[0.8, 0, -0.137]} rotation={[0, 0, 0]}>
                            <circleGeometry args={[0.05, 32]} />
                            <meshBasicMaterial color="#000" />
                        </mesh>

                        {/* 2. The Main Album Cover Image Plane */}
                        <mesh position={[0, 0, -0.05]}>
                            <planeGeometry args={[3, 3]} />
                            <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
                        </mesh>

                        {/* 3. The Heavy Glass/Acrylic Card Enclosing the Cover */}
                        <RoundedBox args={[3.1, 3.1, 0.15]} radius={0.05} smoothness={16} position={[0, 0, 0]}>
                            <MeshTransmissionMaterial
                                thickness={0.5}
                                roughness={0.05}
                                transmission={1} // glass effect
                                ior={1.3} // Index of Refraction
                                chromaticAberration={0.04}
                                backside={true}
                                clearcoat={1}
                                color="#ffffff"
                            />
                        </RoundedBox>

                        {/* Ambient glowing backlight tied to the track color */}
                        <mesh position={[0, 0, -0.5]}>
                            <planeGeometry args={[4, 4]} />
                            <meshBasicMaterial color={activeTrack.color1} transparent opacity={0.4} />
                        </mesh>
                    </group>
                </PresentationControls>
            </Float>
        </group>
    );
};

export default function PremiumGlassCard({ activeTrack }: { activeTrack: { coverUrl?: string, color1?: string, color2?: string } }) {
    return (
        <div className="w-full h-full absolute inset-0 pointer-events-auto">
            <Canvas camera={{ position: [0, 0, 6], fov: 40 }} dpr={[1, 2]}>
                <Environment preset="studio" />
                <ambientLight intensity={0.4} />

                {/* Key lighting to highlight the glass edge */}
                <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
                <spotLight position={[-5, 5, 5]} intensity={1.5} color={activeTrack?.color2 || "#ffffff"} penumbra={1} />

                <React.Suspense fallback={null}>
                    <SceneContent activeTrack={activeTrack} />
                </React.Suspense>

                {/* Soft diffused bloom for the cinematic atmosphere */}
                {/* @ts-expect-error */}
                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.5} mipmapBlur intensity={1.2} />
                </EffectComposer>
            </Canvas>
        </div>
    );
}
