import { LivingBrief } from '../types.js';

export type FileType = 'image' | 'pdf' | 'pptx' | 'docx' | 'video';

export type ImageClassification = 'product-photo' | 'mood-inspiration' | 'competitor-screenshot';

export interface IngestionInput {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}

export interface ExtractedContent {
  /** Raw text extracted from the document */
  text: string;
  /** Tables found in the document (array of row-arrays) */
  tables?: string[][];
  /** Per-slide content for presentations */
  slides?: { index: number; text: string; notes?: string }[];
  /** Keyframes extracted from video (base64 encoded) */
  keyframes?: string[];
  /** Audio transcript from video */
  transcript?: string;
  /** Image classification result */
  imageClassification?: ImageClassification;
  /** Extracted color palette from images */
  colorPalette?: string[];
  /** Visual tone/mood description */
  visualTone?: string;
  /** Subject description */
  subjectDescription?: string;
}

export interface DerivedBriefField {
  field: keyof LivingBrief;
  value: any;
  confidence: number;
  source: string; // which part of the file this was derived from
}

export interface IngestionResult {
  fileType: FileType;
  fileName: string;
  extractedContent: ExtractedContent;
  derivedBriefFields: DerivedBriefField[];
  overallConfidence: number;
}

/** MIME types we accept, mapped to our internal FileType */
export const ACCEPTED_MIME_TYPES: Record<string, FileType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/webp': 'image',
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'video/mp4': 'video',
  'video/quicktime': 'video',
};

/** Maximum file size in bytes (20 MB) */
export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
