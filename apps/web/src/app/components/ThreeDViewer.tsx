"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Stage } from "@react-three/drei";

interface ThreeDViewerProps {
  modelUrl?: string;
  title?: string;
  author?: string;
  license?: string;
  className?: string;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <Center top>
      <primitive object={scene} />
    </Center>
  );
}

function LoadingFallback() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0D12]/80 backdrop-blur-sm z-10">
      <div className="w-10 h-10 border-2 border-[#C9A227]/20 border-t-[#C9A227] rounded-full animate-spin mb-3" />
      <span className="text-xs font-mono tracking-wider text-[#C4C0B6] uppercase">
        Rendering 3D Mesh...
      </span>
    </div>
  );
}

export function ThreeDViewer({
  modelUrl = "/uploads/assets/fixture-harvey-probber-armchair.glb",
  title = "Midcentury Harvey Probber Armchair",
  author = "eireni",
  license = "CC-BY",
  className = "",
}: ThreeDViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`relative w-full h-[450px] bg-[#0B0D12] rounded-xl border border-[#C9A227]/20 flex items-center justify-center ${className}`}>
        <LoadingFallback />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-[500px] bg-[#0B0D12] rounded-xl border border-[#C9A227]/25 shadow-2xl overflow-hidden group ${className}`}>
      {/* Background Subtle Radial Vignette Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#14171F] via-[#0B0D12] to-[#0B0D12] pointer-events-none" />

      {/* Top Bar Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
        <div className="flex items-center gap-2 bg-[#14171F]/90 backdrop-blur-md border border-[#C9A227]/30 px-3 py-1.5 rounded-md pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-[#C9A227] animate-pulse" />
          <span className="text-xs font-serif font-medium text-[#F2F0EC]">
            {title}
          </span>
        </div>

        {author && (
          <div className="bg-[#14171F]/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-md text-[11px] font-mono text-[#C4C0B6] pointer-events-auto">
            BY: <span className="text-[#F2F0EC]">{author}</span> ({license})
          </div>
        )}
      </div>

      {/* R3F WebGL Canvas */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-[#7E7A72]">
          <p className="text-sm font-mono mb-2">3D Asset Viewport</p>
          <p className="text-xs text-[#C4C0B6]">Model file loaded cleanly or waiting for client selection.</p>
        </div>
      ) : (
        <Suspense fallback={<LoadingFallback />}>
          <Canvas
            shadows
            camera={{ position: [0, 1.5, 3.5], fov: 45 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            onError={() => setHasError(true)}
          >
            <ambientLight intensity={0.7} />
            <spotLight
              position={[10, 15, 10]}
              angle={0.3}
              penumbra={1}
              intensity={2}
              color="#F2F0EC"
              castShadow
            />
            {/* Signature Warm Gold Rim Highlight Light */}
            <pointLight position={[-10, -5, -10]} intensity={1.5} color="#C9A227" />
            <pointLight position={[5, 10, -5]} intensity={1.0} color="#2B4C7E" />

            <Stage environment="city" intensity={0.5} adjustCamera={1.2}>
              <Model url={modelUrl} />
            </Stage>

            <OrbitControls
              autoRotate
              autoRotateSpeed={0.8}
              enableZoom={true}
              maxPolarAngle={Math.PI / 1.75}
              minDistance={1}
              maxDistance={10}
            />
          </Canvas>
        </Suspense>
      )}

      {/* Interactive Controls Overlay Hint */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-[#7E7A72] tracking-wider uppercase bg-[#0B0D12]/70 px-2.5 py-1 rounded border border-white/5 pointer-events-none">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
