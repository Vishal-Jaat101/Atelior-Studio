export interface SketchfabUser {
  username: string;
  displayName?: string;
  profileUrl: string;
}

export interface SketchfabLicense {
  slug: string;
  fullName: string;
  requirementsUrl?: string;
}

export interface SketchfabModel {
  uid: string;
  name: string;
  description?: string;
  viewerUrl: string;
  user: SketchfabUser;
  license: SketchfabLicense;
  thumbnails?: Array<{
    url: string;
    width: number;
    height: number;
  }>;
}

export interface SearchAssetsRequest {
  prompt: string;
  projectId?: string;
}

export interface SearchAssetsResponse {
  queryUsed: string;
  models: SketchfabModel[];
}

export interface SelectAssetRequest {
  projectId: string;
  modelUid: string;
  customName?: string;
}

export interface AssetAttribution {
  authorName: string;
  authorUrl: string;
  licenseName: string;
  licenseUrl?: string;
  modelUrl: string;
}

export interface ProcessedAsset {
  id: string;
  projectId: string;
  name: string;
  source: 'sketchfab' | 'generated';
  url: string;
  attribution: AssetAttribution;
  metadata: {
    uid: string;
    sizeBytes: number;
    dracoCompressed: boolean;
    scaleNormalized: boolean;
    centerNormalized: boolean;
    lodGenerated: boolean;
    originalLicense: string;
    originalAuthor: string;
  };
}
