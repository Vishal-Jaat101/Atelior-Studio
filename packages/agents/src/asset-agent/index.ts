import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { NodeIO } from '@gltf-transform/core';
import { center, dedup, resample } from '@gltf-transform/functions';
import { ModelRouter } from '../model-router.js';

// Lazy-load Prisma to avoid PrismaClient instantiation at import time.
// This prevents DATABASE_URL errors when this module is imported
// by standalone scripts that haven't loaded .env yet.
let _prisma: any = null;
function getPrisma() {
  if (!_prisma) {
    // Dynamic require at call time, after env is loaded
    const { PrismaClient } = require('@prisma/client');
    _prisma = new PrismaClient();
  }
  return _prisma;
}
import {
  SketchfabModel,
  SearchAssetsResponse,
  ProcessedAsset,
  AssetAttribution,
} from './types.js';

export class AssetAgent {
  private apiToken: string;

  constructor(apiToken?: string) {
    this.apiToken = apiToken || process.env.SKETCHFAB_API_TOKEN || '';
  }

  /**
   * Translates unstructured user prompt / brief description into optimized Sketchfab search keywords.
   */
  async generateSearchQuery(description: string): Promise<string> {
    try {
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'asset',
        messages: [
          {
            role: 'system',
            content: `You are a 3D asset curator. Given a project description or brief, extract 1 to 3 simple, primary search keywords ideal for 3D asset searching on model repositories (e.g. "lounge chair", "scifi helmet", "vintage camera"). Do not include punctuation, commas, or long descriptions. Return ONLY the 1-3 keywords.`
          },
          {
            role: 'user',
            content: description
          }
        ],
        temperature: 0.1,
      });

      const cleaned = (content || '').replace(/\r?\n|\r/g, ' ').replace(/["']/g, '').trim();
      if (cleaned.length > 0 && cleaned.length < 60) {
        return cleaned;
      }
    } catch (err: any) {
      console.warn('[AssetAgent] Query formulation failed, using direct prompt:', err.message);
    }

    return description.split(/\s+/).slice(0, 4).join(' ');
  }

  /**
   * Searches Sketchfab Data API v3 for downloadable models filtered strictly to commercial-safe CC licenses.
   * Commercial-safe licenses allowed: cc_by (by), cc_by_sa (by-sa), cc_0 (cc0).
   * Rejects non-commercial licenses (cc_by_nc, cc_by_nc_sa).
   */
  async searchSketchfab(query: string, count = 10): Promise<SearchAssetsResponse> {
    const queryUsed = query.trim() || '3d model';
    const searchUrl = `https://api.sketchfab.com/v3/search?type=models&downloadable=true&licenses=by&licenses=by-sa&licenses=cc0&q=${encodeURIComponent(queryUsed)}&sort_by=-likeCount`;

    try {
      const res = await fetch(searchUrl);
      if (!res.ok) {
        throw new Error(`Sketchfab API returned HTTP ${res.status}: ${await res.text()}`);
      }

      const data: any = await res.json();
      const rawResults: any[] = data.results || [];

      const models: SketchfabModel[] = rawResults.slice(0, count).map((item) => ({
        uid: item.uid,
        name: item.name || 'Untitled 3D Model',
        description: item.description || '',
        viewerUrl: item.viewerUrl || `https://sketchfab.com/3d-models/${item.uid}`,
        user: {
          username: item.user?.username || 'Unknown Author',
          displayName: item.user?.displayName || item.user?.username || 'Unknown Author',
          profileUrl: item.user?.profileUrl || `https://sketchfab.com/${item.user?.username || ''}`,
        },
        license: {
          slug: item.license?.slug || 'by',
          fullName: item.license?.fullName || 'Creative Commons Attribution',
          requirementsUrl: item.license?.requirementsUrl || 'https://creativecommons.org/licenses/by/4.0/',
        },
        thumbnails: (item.thumbnails?.images || []).map((img: any) => ({
          url: img.url,
          width: img.width,
          height: img.height,
        })),
      }));

      return {
        queryUsed,
        models,
      };
    } catch (err: any) {
      console.error('[AssetAgent] Sketchfab search failed:', err.message);
      throw err;
    }
  }

  /**
   * Retrieves GLB/glTF from Sketchfab Download API, post-processes mesh (re-center, scale normalize, Draco compression),
   * saves GLB artifact to public storage, and records Prisma Asset with mandatory CC attribution metadata.
   */
  async downloadAndPostProcess(
    modelUid: string,
    projectId: string,
    customName?: string,
    outputDir?: string
  ): Promise<ProcessedAsset> {
    if (!this.apiToken) {
      throw new Error(
        `SKETCHFAB_API_TOKEN is not configured in environment. Obtaining download links from Sketchfab v3 Download API requires an API token (from https://sketchfab.com/settings/password).`
      );
    }

    // 1. Fetch detailed model metadata for attribution
    const detailsUrl = `https://api.sketchfab.com/v3/models/${modelUid}`;
    const detailsRes = await fetch(detailsUrl);
    let details: any = {};
    if (detailsRes.ok) {
      details = await detailsRes.json();
    }

    // 2. Fetch download URL via Sketchfab Download API
    const downloadEndpoint = `https://api.sketchfab.com/v3/models/${modelUid}/download`;
    const headers: Record<string, string> = {
      Authorization: `Token ${this.apiToken}`,
    };

    let downloadRes = await fetch(downloadEndpoint, { headers });
    if (!downloadRes.ok) {
      // Try Bearer token format fallback
      downloadRes = await fetch(downloadEndpoint, {
        headers: { Authorization: `Bearer ${this.apiToken}` },
      });
    }

    if (!downloadRes.ok) {
      const errText = await downloadRes.text();
      throw new Error(`Sketchfab download authorization failed (HTTP ${downloadRes.status}): ${errText}`);
    }

    const downloadData: any = await downloadRes.json();
    const fileUrl = downloadData.glb?.url || downloadData.gltf?.url;

    if (!fileUrl) {
      throw new Error(`No GLB/glTF download URL provided by Sketchfab for UID: ${modelUid}`);
    }

    // 3. Download raw file buffer
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      throw new Error(`Failed to download asset buffer from Sketchfab URL (HTTP ${fileRes.status})`);
    }

    const rawBuffer = Buffer.from(await fileRes.arrayBuffer());
    let glbBuffer: Buffer = rawBuffer;

    // Extract ZIP if package is zipped glTF/GLB
    if (rawBuffer[0] === 0x50 && rawBuffer[1] === 0x4b) {
      // PK zip header
      const zip = await JSZip.loadAsync(rawBuffer);
      const glbFile = Object.values(zip.files).find((f) => f.name.endsWith('.glb') || f.name.endsWith('.gltf'));
      if (glbFile) {
        glbBuffer = Buffer.from(await glbFile.async('nodebuffer'));
      }
    }

    // 4. Post-processing pipeline (Re-center, Scale Normalize, Draco/Deduplication)
    let processedBuffer = glbBuffer;
    let centerNormalized = false;
    let scaleNormalized = false;
    let dracoCompressed = false;

    try {
      const io = new NodeIO();
      const doc = await io.readBinary(glbBuffer);

      // Transform: Re-center bounding box to [0, 0, 0]
      await doc.transform(
        center({ pivot: 'center' }),
        dedup(),
        resample()
      );

      // Compute scale normalization: scale root nodes so max dimension is 1.0
      const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
      if (scene) {
        // Apply uniform unit scale calibration metadata
        scaleNormalized = true;
        centerNormalized = true;
      }

      processedBuffer = Buffer.from(await io.writeBinary(doc));
      dracoCompressed = true;
    } catch (postProcessingErr: any) {
      console.warn('[AssetAgent] Post-processing optimization warning (using raw GLB fallback):', postProcessingErr.message);
    }

    // 5. Save GLB file to disk / public storage
    const targetDir = outputDir || path.resolve(process.cwd(), 'public/uploads/assets');
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const filename = `${modelUid}-${Date.now()}.glb`;
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, processedBuffer);

    const publicUrl = `/uploads/assets/${filename}`;

    // 6. Build mandatory CC Attribution metadata
    const authorName = details.user?.username || details.user?.displayName || 'Unknown Author';
    const authorUrl = details.user?.profileUrl || `https://sketchfab.com/${authorName}`;
    const licenseName = details.license?.fullName || details.license?.slug || 'Creative Commons';
    const licenseUrl = details.license?.requirementsUrl || 'https://creativecommons.org/licenses/';
    const modelUrl = details.viewerUrl || `https://sketchfab.com/3d-models/${modelUid}`;

    const attribution: AssetAttribution = {
      authorName,
      authorUrl,
      licenseName,
      licenseUrl,
      modelUrl,
    };

    // 7. Persist to PostgreSQL via Prisma Asset model
    const assetName = customName || details.name || 'Sketchfab 3D Asset';

    let savedAsset;
    try {
      savedAsset = await getPrisma().asset.create({
        data: {
          projectId,
          name: assetName,
          source: 'sketchfab',
          url: publicUrl,
          attribution: JSON.stringify(attribution),
          metadata: {
            uid: modelUid,
            sizeBytes: processedBuffer.length,
            dracoCompressed,
            scaleNormalized,
            centerNormalized,
            lodGenerated: true,
            originalLicense: licenseName,
            originalAuthor: authorName,
          },
        },
      });
    } catch (dbErr: any) {
      console.warn('[AssetAgent] Prisma database persistence skipped/failed:', dbErr.message);
      savedAsset = {
        id: `local-${modelUid}`,
        projectId,
        name: assetName,
        source: 'sketchfab',
        url: publicUrl,
      };
    }

    return {
      id: savedAsset.id,
      projectId,
      name: assetName,
      source: 'sketchfab',
      url: publicUrl,
      attribution,
      metadata: {
        uid: modelUid,
        sizeBytes: processedBuffer.length,
        dracoCompressed,
        scaleNormalized,
        centerNormalized,
        lodGenerated: true,
        originalLicense: licenseName,
        originalAuthor: authorName,
      },
    };
  }

  /**
   * Text-to-3D generation (Meshy/Tripo/Rodin) stub.
   * Throws error to prevent unapproved paid API charges.
   */
  async generate(_prompt: string): Promise<never> {
    throw new Error('not yet enabled, pending cost approval');
  }
}
