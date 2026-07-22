"use client";

import React, { Suspense, useState, useEffect, Component, ErrorInfo, ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Center, Stage } from "@react-three/drei";

interface ThreeDViewerProps {
  modelUrl?: string;
  title?: string;
  author?: string;
  license?: string;
  className?: string;
}

// React error boundary that catches GLB/glTF loading failures (404, corrupt files, etc.)
// without crashing the entire page.
interface ModelErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}

interface ModelErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  constructor(props: ModelErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ModelErrorBoundaryState {
    return { hasError: true, errorMessage: error.message || 'Unknown 3D loading error' };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[ThreeDViewer] GLB model load error caught by boundary:', error.message);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
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

function ModelLoadErrorUI({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0B0D12]">
      <div className="w-12 h-12 rounded-full border-2 border-[#C9A227]/30 flex items-center justify-center mb-3">
        <span className="text-lg text-[#C9A227]">△</span>
      </div>
      <p className="text-sm font-mono text-[#C4C0B6] mb-1">3D Asset Unavailable</p>
      <p className="text-[10px] font-mono text-[#7E7A72] max-w-xs leading-relaxed">
        {message || 'The GLB model file could not be loaded. It may not be available or the URL may have expired.'}
      </p>
    </div>
  );
}

export function ThreeDViewer({
  modelUrl,
  title = "3D Asset Preview",
  author,
  license = "CC-BY",
  className = "",
}: ThreeDViewerProps) {
  const [mounted, setMounted] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't attempt to render if no modelUrl provided
  if (!modelUrl) {
    return (
      <div className={`relative w-full h-[450px] bg-[#0B0D12] rounded-xl border border-white/10 flex items-center justify-center ${className}`}>
        <ModelLoadErrorUI message="No 3D model URL provided. The asset search may still be in progress." />
      </div>
    );
  }

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

      {/* R3F WebGL Canvas with Error Boundary */}
      {loadError ? (
        <ModelLoadErrorUI message={loadError} />
      ) : (
        <ModelErrorBoundary 
          fallback={<ModelLoadErrorUI message={`Failed to load GLB from: ${modelUrl}`} />}
          onError={(err) => setLoadError(err.message)}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Canvas
              shadows
              camera={{ position: [0, 1.5, 3.5], fov: 45 }}
              className="w-full h-full cursor-grab active:cursor-grabbing"
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
        </ModelErrorBoundary>
      )}

      {/* Interactive Controls Overlay Hint */}
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-[#7E7A72] tracking-wider uppercase bg-[#0B0D12]/70 px-2.5 py-1 rounded border border-white/5 pointer-events-none">
        Drag to rotate • Scroll to zoom
      </div>
    </div>
  );
}
