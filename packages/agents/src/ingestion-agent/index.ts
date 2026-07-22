import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { IngestionInput, IngestionResult, ExtractedContent, DerivedBriefField, FileType, ACCEPTED_MIME_TYPES, ImageClassification } from './types.js';
import { LivingBrief } from '../types.js';
import { ModelRouter } from '../model-router.js';

// PRD section patterns used to detect structured documents
const PRD_SECTION_PATTERNS: { pattern: RegExp; briefField: keyof LivingBrief }[] = [
  { pattern: /(?:target\s*audience|users?|customer|persona)/i, briefField: 'targetAudience' },
  { pattern: /(?:user\s*flow|core\s*flow|journey|workflow|user\s*story)/i, briefField: 'coreUserFlow' },
  { pattern: /(?:must[\s-]*have|required|core\s*features?|mvp)/i, briefField: 'mustHaveFeatures' },
  { pattern: /(?:nice[\s-]*to[\s-]*have|future|optional|stretch)/i, briefField: 'niceToHaveFeatures' },
  { pattern: /(?:visual|design|tone|style|brand|aesthetic|look\s*and\s*feel)/i, briefField: 'visualTone' },
  { pattern: /(?:platform|device|web|mobile|ios|android|responsive)/i, briefField: 'platforms' },
  { pattern: /(?:3d|three[\s-]*dimensional|immersive|spatial|ar|vr|rotate)/i, briefField: 'has3DApplicability' },
];

export class IngestionAgent {
  constructor() {
    // Shared router resolves api key and endpoint per configuration
  }

  /**
   * Main ingestion entry point — routes to the appropriate parser based on MIME type.
   */
  async ingest(input: IngestionInput): Promise<IngestionResult> {
    const fileType = ACCEPTED_MIME_TYPES[input.mimeType];
    if (!fileType) {
      throw new Error(`Unsupported MIME type: ${input.mimeType}`);
    }

    let extractedContent: ExtractedContent;

    switch (fileType) {
      case 'pdf':
        extractedContent = await this.parsePDF(input.buffer);
        break;
      case 'docx':
        extractedContent = await this.parseDOCX(input.buffer);
        break;
      case 'pptx':
        extractedContent = await this.parsePPTX(input.buffer);
        break;
      case 'image':
        extractedContent = await this.parseImage(input.buffer, input.mimeType);
        break;
      case 'video':
        extractedContent = await this.parseVideo(input.buffer, input.fileName);
        break;
      default:
        throw new Error(`Unhandled file type: ${fileType}`);
    }

    // Map extracted content to Living Brief fields
    const derivedBriefFields = await this.mapToBriefFields(extractedContent, fileType);

    const overallConfidence = derivedBriefFields.length > 0
      ? derivedBriefFields.reduce((sum, f) => sum + f.confidence, 0) / derivedBriefFields.length
      : 0;

    return {
      fileType,
      fileName: input.fileName,
      extractedContent,
      derivedBriefFields,
      overallConfidence,
    };
  }

  // ─── PDF Parser ──────────────────────────────────────────────────────
  private async parsePDF(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const data = await pdfParse(buffer);
      return { text: data.text || '' };
    } catch (err) {
      console.warn('PDF parsing failed, returning empty content:', err);
      return { text: '' };
    }
  }

  // ─── DOCX Parser ─────────────────────────────────────────────────────
  private async parseDOCX(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value || '' };
    } catch (err) {
      console.warn('DOCX parsing failed:', err);
      return { text: '' };
    }
  }

  // ─── PPTX Parser ─────────────────────────────────────────────────────
  private async parsePPTX(buffer: Buffer): Promise<ExtractedContent> {
    try {
      const zip = await JSZip.loadAsync(buffer);
      const slides: { index: number; text: string; notes?: string }[] = [];

      // PPTX files contain slide XML files in ppt/slides/
      const slideFiles = Object.keys(zip.files)
        .filter(f => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
        .sort((a, b) => {
          const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
          const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
          return numA - numB;
        });

      for (let i = 0; i < slideFiles.length; i++) {
        const slideXml = await zip.files[slideFiles[i]].async('text');
        // Extract text content from XML — strip tags
        const text = slideXml
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Try to get slide notes
        const notesPath = `ppt/notesSlides/notesSlide${i + 1}.xml`;
        let notes: string | undefined;
        if (zip.files[notesPath]) {
          const notesXml = await zip.files[notesPath].async('text');
          notes = notesXml
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }

        slides.push({ index: i + 1, text, notes });
      }

      const fullText = slides.map(s => s.text).join('\n\n');
      return { text: fullText, slides };
    } catch (err) {
      console.warn('PPTX parsing failed:', err);
      return { text: '' };
    }
  }

  // ─── Image Parser ────────────────────────────────────────────────────
  private async parseImage(buffer: Buffer, mimeType: string): Promise<ExtractedContent> {
    // Use LLM vision to classify and analyze the image via ModelRouter
    try {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64}`;

      const { content } = await ModelRouter.chatCompletion({
        agentName: 'ingestion',
        messages: [
          {
            role: 'system',
            content: `You are a visual analysis expert. Analyze the provided image and respond with a JSON object containing:
{
  "classification": "product-photo" | "mood-inspiration" | "competitor-screenshot",
  "colorPalette": ["#hex1", "#hex2", ...],  // 3-5 dominant colors
  "visualTone": "description of the visual mood/tone",
  "subjectDescription": "what the image depicts",
  "suggestedAudience": "who this visual might appeal to (or null)",
  "has3D": false  // whether the image suggests 3D/spatial content
}
Only respond with valid JSON, no markdown.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this image for a product brief:' },
              { type: 'image_url', image_url: { url: dataUrl } }
            ] as any
          }
        ],
        temperature: 0.2,
        responseFormat: { type: 'json_object' },
      });

      const analysis = JSON.parse(content || '{}');

      return {
        text: analysis.subjectDescription || '',
        imageClassification: analysis.classification as ImageClassification,
        colorPalette: analysis.colorPalette || [],
        visualTone: analysis.visualTone || '',
        subjectDescription: analysis.subjectDescription || '',
      };
    } catch (err: any) {
      console.warn('LLM image analysis failed, falling back to basic extraction:', err.message);
    }

    // Fallback: basic metadata without LLM
    return {
      text: '',
      imageClassification: 'mood-inspiration',
      visualTone: 'Could not analyze — no vision model available',
      subjectDescription: 'Uploaded image (analysis unavailable)',
    };
  }

  // ─── Video Parser (optional — ffmpeg) ────────────────────────────────
  private async parseVideo(buffer: Buffer, fileName: string): Promise<ExtractedContent> {
    let ffmpegPath: string | null = null;
    try {
      // Try to load ffmpeg-static — this is optional
      const ffmpegStatic = await import('ffmpeg-static');
      ffmpegPath = (ffmpegStatic as any).default || ffmpegStatic;
    } catch {
      console.warn('ffmpeg-static not available — skipping video analysis');
    }

    if (!ffmpegPath) {
      return {
        text: '',
        transcript: '(Video analysis skipped — ffmpeg not available)',
        keyframes: [],
      };
    }

    // For v1, we extract basic metadata and return a notice
    // Full keyframe extraction + transcription requires more complex pipeline
    return {
      text: `Video file uploaded: ${fileName}`,
      transcript: '(Video transcription available in future version)',
      keyframes: [],
    };
  }

  // ─── Brief Field Mapping ─────────────────────────────────────────────
  private async mapToBriefFields(
    content: ExtractedContent,
    fileType: FileType
  ): Promise<DerivedBriefField[]> {
    const fields: DerivedBriefField[] = [];

    // For images, map visual analysis directly
    if (fileType === 'image') {
      if (content.visualTone) {
        fields.push({
          field: 'visualTone',
          value: content.visualTone,
          confidence: 0.7,
          source: 'image-analysis',
        });
      }
      if (content.subjectDescription) {
        fields.push({
          field: 'targetAudience',
          value: content.subjectDescription,
          confidence: 0.5,
          source: 'image-subject',
        });
      }
      if (content.colorPalette && content.colorPalette.length > 0) {
        // Color palette is stored as metadata, not directly a brief field
        // but it influences visual tone
      }
      return fields;
    }

    // For text-based files (PDF, DOCX, PPTX), use pattern matching + LLM
    const text = content.text;
    if (!text || text.trim().length === 0) return fields;

    // Try LLM-based extraction first
    if (text.length > 50) {
      try {
        return await this.llmMapToBriefFields(text, fileType);
      } catch (err) {
        console.warn('LLM brief mapping failed, falling back to pattern matching:', err);
      }
    }

    // Fallback: pattern-based extraction
    return this.patternMapToBriefFields(text);
  }

  /**
   * Use the LLM to intelligently map extracted text to Living Brief fields.
   */
  private async llmMapToBriefFields(text: string, fileType: FileType): Promise<DerivedBriefField[]> {
    // Truncate very long texts to stay within context limits
    const truncated = text.slice(0, 8000);

    const { content } = await ModelRouter.chatCompletion({
      agentName: 'ingestion',
      messages: [
        {
          role: 'system',
          content: `You are a product manager analyzing an uploaded ${fileType.toUpperCase()} document to pre-fill a project intake brief.

The Living Brief has these fields:
- targetAudience (string): Who is the target user/customer
- coreUserFlow (string): The main user journey/flow
- mustHaveFeatures (string[]): Essential features for v1
- niceToHaveFeatures (string[]): Future/optional features
- visualTone (string): Visual style/mood direction
- platforms (string[] of "web" or "mobile"): Target platforms
- has3DApplicability (boolean): Whether 3D/spatial features are relevant

Extract ONLY information that is clearly present in the document. Do NOT fabricate or infer information that isn't there.

Respond with valid JSON:
{
  "fields": [
    {
      "field": "fieldName",
      "value": "extracted value",
      "confidence": 0.0-1.0,
      "source": "brief description of where in the doc this came from"
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze this ${fileType.toUpperCase()} content and extract Living Brief fields:\n\n${truncated}`
        }
      ],
      temperature: 0.1,
      responseFormat: { type: 'json_object' },
    });

    const parsed = JSON.parse(content || '{}');
    if (!parsed.fields || !Array.isArray(parsed.fields)) return [];

    // Validate fields
    const validFields: (keyof LivingBrief)[] = [
      'targetAudience', 'coreUserFlow', 'mustHaveFeatures',
      'niceToHaveFeatures', 'visualTone', 'platforms', 'has3DApplicability'
    ];

    return parsed.fields
      .filter((f: any) => validFields.includes(f.field) && f.value !== undefined && f.value !== null)
      .map((f: any) => ({
        field: f.field as keyof LivingBrief,
        value: f.value,
        confidence: Math.min(1, Math.max(0, Number(f.confidence) || 0.5)),
        source: f.source || 'document',
      }));
  }

  /**
   * Fallback pattern-based extraction when LLM is unavailable.
   */
  private patternMapToBriefFields(text: string): DerivedBriefField[] {
    const fields: DerivedBriefField[] = [];
    const lines = text.split('\n');

    // Split text into sections based on headings
    const sections: { heading: string; content: string }[] = [];
    let currentHeading = '';
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Detect headings: lines that are short, possibly uppercase or have # prefix
      if (trimmed.length > 0 && trimmed.length < 100 &&
          (trimmed.startsWith('#') || trimmed === trimmed.toUpperCase() || /^[\d.]+\s/.test(trimmed))) {
        if (currentHeading || currentContent.length > 0) {
          sections.push({ heading: currentHeading, content: currentContent.join('\n') });
        }
        currentHeading = trimmed.replace(/^#+\s*/, '').replace(/^\d+\.?\s*/, '');
        currentContent = [];
      } else if (trimmed.length > 0) {
        currentContent.push(trimmed);
      }
    }
    if (currentHeading || currentContent.length > 0) {
      sections.push({ heading: currentHeading, content: currentContent.join('\n') });
    }

    // Match sections to brief fields
    for (const section of sections) {
      for (const { pattern, briefField } of PRD_SECTION_PATTERNS) {
        if (pattern.test(section.heading)) {
          const value = section.content.trim();
          if (value.length > 10) {
            // For array fields, split by newlines/bullets
            if (briefField === 'mustHaveFeatures' || briefField === 'niceToHaveFeatures') {
              const items = value
                .split(/[\n•\-\*]/)
                .map(s => s.trim())
                .filter(s => s.length > 3);
              if (items.length > 0) {
                fields.push({
                  field: briefField,
                  value: items,
                  confidence: 0.7,
                  source: `section: ${section.heading}`,
                });
              }
            } else if (briefField === 'platforms') {
              const platforms: string[] = [];
              if (/web|browser|desktop/i.test(value)) platforms.push('web');
              if (/mobile|ios|android|app/i.test(value)) platforms.push('mobile');
              if (platforms.length > 0) {
                fields.push({
                  field: 'platforms',
                  value: platforms,
                  confidence: 0.8,
                  source: `section: ${section.heading}`,
                });
              }
            } else if (briefField === 'has3DApplicability') {
              fields.push({
                field: 'has3DApplicability',
                value: true,
                confidence: 0.7,
                source: `section: ${section.heading}`,
              });
            } else {
              // String fields
              fields.push({
                field: briefField,
                value: value.slice(0, 500), // cap length
                confidence: 0.7,
                source: `section: ${section.heading}`,
              });
            }
          }
          break; // only match one pattern per section
        }
      }
    }

    // Also check the full text for platform/3D mentions if not found in sections
    if (!fields.some(f => f.field === 'platforms')) {
      const platforms: string[] = [];
      if (/\bweb\b|browser|desktop|website/i.test(text)) platforms.push('web');
      if (/\bmobile\b|ios|android|\bapp\b/i.test(text)) platforms.push('mobile');
      if (platforms.length > 0) {
        fields.push({
          field: 'platforms',
          value: platforms,
          confidence: 0.6,
          source: 'full-text keyword scan',
        });
      }
    }

    if (!fields.some(f => f.field === 'has3DApplicability')) {
      if (/3d|three[\s-]*dimensional|immersive|spatial|rotate|orbit/i.test(text)) {
        fields.push({
          field: 'has3DApplicability',
          value: true,
          confidence: 0.6,
          source: 'full-text keyword scan',
        });
      }
    }

    return fields;
  }
}
