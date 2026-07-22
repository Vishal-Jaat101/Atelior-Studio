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
  /** The original user prompt / project description — used as a last-resort fallback for keyword extraction */
  projectDescription?: string;
  className?: string;
}

// Stop words to filter out when extracting search keywords from brief text
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
  'it', 'its', 'that', 'this', 'these', 'those', 'i', 'we', 'you', 'they',
  'my', 'our', 'your', 'their', 'not', 'no', 'so', 'if', 'then', 'than',
  'when', 'where', 'how', 'what', 'which', 'who', 'whom', 'each', 'every',
  'all', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only',
  'also', 'just', 'about', 'up', 'out', 'into',
  // UI/app generic terms to skip
  'website', 'web', 'app', 'application', 'site', 'page', 'feature', 'features',
  'build', 'create', 'make', 'want', 'need', 'include', 'includes', 'using',
  'interactive', 'immersive', 'view', 'viewer', 'rendering', 'render',
  '3d', 'three', 'model', 'product', 'preview', 'display', 'show',
  'viewport', 'cursor', 'toggles', 'toggle', 'toggle',
]);

/**
 * Extract meaningful search keywords from arbitrary text.
 * Removes stop words, retains nouns/adjectives likely to match 3D model names.
 */
function extractKeywords(text: string, maxKeywords = 3): string {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  return words.slice(0, maxKeywords).join(' ');
}

export function Dynamic3DAssetViewer({ projectId, brief, projectDescription, className = '' }: Dynamic3DAssetViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assetData, setAssetData] = useState<{
    url: string;
    title: string;
    author: string;
    license: string;
    queryUsed: string;
  } | null>(null);

  // Extract 3D search term from brief — improved to actually extract meaningful nouns
  const extractSearchTerm = (): string => {
    if (!brief && !projectDescription) return 'furniture';

    const allFeatures = [
      ...(brief?.mustHaveFeatures || []),
      ...(brief?.niceToHaveFeatures || []),
    ];

    // Strategy 1: Look for explicit 3D feature mention in features
    const explicit3D = allFeatures.find((f) =>
      /3d|three-d|model|mesh|viewer|render|viewport|shoe|chair|car|sneaker|helmet|camera/i.test(f)
    );

    if (explicit3D) {
      const keywords = extractKeywords(explicit3D);
      if (keywords.length > 0) {
        console.log(`[Dynamic3DAssetViewer] Extracted keywords from 3D feature: "${keywords}" (from: "${explicit3D}")`);
        return keywords;
      }
    }

    // Strategy 2: Extract from coreUserFlow if it mentions 3D objects
    if (brief?.coreUserFlow && /3d|model|mesh|sneaker|shoe|chair|car|helmet/i.test(brief.coreUserFlow)) {
      const keywords = extractKeywords(brief.coreUserFlow);
      if (keywords.length > 0) return keywords;
    }

    // Strategy 3: Extract meaningful nouns from targetAudience
    if (brief?.targetAudience) {
      const keywords = extractKeywords(brief.targetAudience, 2);
      if (keywords.length > 0) {
        console.log(`[Dynamic3DAssetViewer] Extracted keywords from target audience: "${keywords}"`);
        return keywords;
      }
    }

    // Strategy 4: Use the original user prompt / project description
    if (projectDescription) {
      const keywords = extractKeywords(projectDescription);
      if (keywords.length > 0) {
        console.log(`[Dynamic3DAssetViewer] Extracted keywords from project description: "${keywords}" (from: "${projectDescription}")`);
        return keywords;
      }
    }

    // Strategy 5: Use first non-empty feature
    if (allFeatures.length > 0) {
      const keywords = extractKeywords(allFeatures[0]);
      if (keywords.length > 0) return keywords;
    }

    // Final fallback
    return 'furniture';
  };

  useEffect(() => {
    let isMounted = true;
    const searchTerm = extractSearchTerm();

    async function fetchBriefRelevantAsset() {
      setLoading(true);
      setError(null);

      try {
        console.log(`[Dynamic3DAssetViewer] Searching Sketchfab for brief query: "${searchTerm}"...`);
        
        // 1. Search Sketchfab via /api/asset/search — pass `query` directly to skip LLM query generation
        const searchRes = await fetch('/api/asset/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchTerm }),
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
          // Don't crash — show the search results without download
          const errorText = await selectRes.text();
          console.warn(`[Dynamic3DAssetViewer] Asset download failed (${selectRes.status}): ${errorText}`);
          
          // Fall back to showing model info without 3D render
          if (isMounted) {
            setError(`Found "${topModel.name}" on Sketchfab but download requires SKETCHFAB_API_TOKEN. Search query: "${searchTerm}"`);
            setLoading(false);
          }
          return;
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
  }, [projectId, JSON.stringify(brief?.mustHaveFeatures), JSON.stringify(brief?.niceToHaveFeatures), projectDescription]);

  if (loading) {
    return (
      <div className={`relative w-full h-[360px] rounded-xl bg-[#0B0D12] border border-[#C9A227]/30 flex flex-col items-center justify-center p-6 space-y-3 ${className}`}>
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A227] border-t-transparent animate-spin" />
        <div className="text-xs font-mono text-[#C9A227] tracking-wider uppercase">
          Searching Sketchfab Data API for 3D Asset...
        </div>
        <div className="text-[10px] font-mono text-[#7E7A72]">
          Brief Query: &quot;{extractSearchTerm()}&quot;
        </div>
      </div>
    );
  }

  if (error || !assetData) {
    return (
      <div className={`relative w-full p-4 rounded-xl bg-[#0B0D12] border border-[#C9A227]/20 text-center space-y-2 ${className}`}>
        <div className="text-xs font-mono text-[#C9A227]">
          ⚠️ 3D Asset: {error || 'Could not load brief asset'}
        </div>
        <div className="text-[10px] font-mono text-[#7E7A72]">
          Search query used: &quot;{extractSearchTerm()}&quot;
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
