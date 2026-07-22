'use client';

import React, { useEffect, useState } from 'react';
import { ThreeDViewer } from './ThreeDViewer';

interface Dynamic3DAssetViewerProps {
  projectId: string;
  brief?: {
    mustHaveFeatures?: string[];
    niceToHaveFeatures?: string[];
    coreUserFlow?: string;
    targetAudience?: string;
    description?: string;
  };
  className?: string;
}

export function Dynamic3DAssetViewer({ projectId, brief, className = '' }: Dynamic3DAssetViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<{
    url: string;
    title: string;
    author: string;
    license: string;
    queryUsed: string;
  } | null>(null);

  // Extract 3D search term from brief
  const extractSearchTerm = (): string => {
    if (!brief) return '3d model';

    const allFeatures = [
      ...(brief.mustHaveFeatures || []),
      ...(brief.niceToHaveFeatures || []),
    ];

    // Look for explicit 3D feature mention
    const explicit3D = allFeatures.find((f) =>
      /3d|three-d|model|mesh|viewer|render|viewport|interactive|shoe|chair|car|product/i.test(f)
    );

    if (explicit3D) {
      // Clean up description string to produce short keyword query
      return explicit3D
        .replace(/3d|interactive|rendering|viewport|viewer|with|that|toggles|cursor|preview/gi, '')
        .trim() || explicit3D;
    }

    if (brief.coreUserFlow && /3d|model|mesh/i.test(brief.coreUserFlow)) {
      return brief.coreUserFlow.slice(0, 40);
    }

    return allFeatures[0] || brief.description || '3d model';
  };

  useEffect(() => {
    let isMounted = true;
    const searchTerm = extractSearchTerm();

    async function fetchBriefRelevantAsset() {
      setLoading(true);
      setError(null);

      try {
        console.log(`[Dynamic3DAssetViewer] Searching Sketchfab for brief query: "${searchTerm}"...`);
        
        // 1. Search Sketchfab via /api/asset/search
        const searchRes = await fetch('/api/asset/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: searchTerm }),
        });

        if (!searchRes.ok) {
          throw new Error(`Asset search API returned status ${searchRes.status}`);
        }

        const searchJson = await searchRes.json();
        if (!searchJson.success || !searchJson.models || searchJson.models.length === 0) {
          throw new Error(`No CC-licensed 3D models found for "${searchTerm}"`);
        }

        const topModel = searchJson.models[0];
        console.log(`[Dynamic3DAssetViewer] Selected model: "${topModel.name}" (${topModel.uid})`);

        // 2. Download and post-process model via /api/asset/select
        const selectRes = await fetch('/api/asset/select', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            modelUid: topModel.uid,
            projectId: projectId || 'demo-project',
            customName: topModel.name,
          }),
        });

        if (!selectRes.ok) {
          throw new Error(`Asset select API returned status ${selectRes.status}`);
        }

        const selectJson = await selectRes.json();
        if (!selectJson.success || !selectJson.asset) {
          throw new Error('Failed to process selected 3D asset');
        }

        const asset = selectJson.asset;
        let attribution = { authorName: topModel.user?.displayName || 'Sketchfab Creator', licenseName: 'CC-BY' };
        try {
          if (typeof asset.attribution === 'string') {
            attribution = JSON.parse(asset.attribution);
          } else if (asset.attribution) {
            attribution = asset.attribution;
          }
        } catch (e) {
          // ignore parse error
        }

        if (isMounted) {
          setAssetData({
            url: asset.url,
            title: topModel.name || 'Brief-Relevant 3D Asset',
            author: attribution.authorName || 'Sketchfab Creator',
            license: attribution.licenseName || 'CC-BY',
            queryUsed: searchJson.queryUsed || searchTerm,
          });
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('[Dynamic3DAssetViewer] Asset search/load fallback:', err.message);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchBriefRelevantAsset();

    return () => {
      isMounted = false;
    };
  }, [projectId, JSON.stringify(brief?.mustHaveFeatures), JSON.stringify(brief?.niceToHaveFeatures)]);

  if (loading) {
    return (
      <div className={`relative w-full h-[360px] rounded-xl bg-[#0B0D12] border border-[#C9A227]/30 flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin" />
        <div className="text-xs font-mono text-[#C9A227] tracking-wider uppercase">
          Searching Sketchfab Data API for 3D Asset...
        </div>
        <div className="text-[10px] font-mono text-[#7E7A72]">
          Brief Query: "{extractSearchTerm()}"
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className={`relative w-full p-4 rounded-xl bg-[#0B0D12] border border-red-500/30 text-center space-y-2 ${className}`}>
        <div className="text-xs font-mono text-red-400">
          ⚠️ 3D Asset Search Warning: {error || 'Could not load brief asset'}
        </div>
        <div className="text-[10px] font-mono text-[#7E7A72]">
          Query attempted: "{extractSearchTerm()}"
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-[10px] font-mono text-[#7E7A72] px-1">
        <span className="text-[#C9A227] font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
          Brief-Matched 3D Asset ({assetData.queryUsed})
        </span>
        <span>SKETCHFAB CC-BY REALTIME ASSET</span>
      </div>
      <ThreeDViewer
        modelUrl={assetData.url}
        title={assetData.title}
        author={assetData.author}
        license={assetData.license}
      />
    </div>
  );
}
