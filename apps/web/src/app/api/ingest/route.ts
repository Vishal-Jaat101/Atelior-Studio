import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import {
  IngestionAgent,
  DiscoveryAgent,
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@atelier/agents';
import type { DiscoveryResponse } from '@atelier/agents';

const ingestionAgent = new IngestionAgent();
const discoveryAgent = new DiscoveryAgent();

/** Accepted MIME types for server-side validation */
const VALID_MIMES = new Set(Object.keys(ACCEPTED_MIME_TYPES));

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const projectId = formData.get('projectId') as string | null;
    const prompt = formData.get('prompt') as string | null;

    // Collect all files from the form
    const files: File[] = [];
    for (const [, value] of formData.entries()) {
      if (value instanceof File && value.size > 0) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files uploaded' },
        { status: 400 }
      );
    }

    // ─── Server-side validation ────────────────────────────────────────
    for (const file of files) {
      // 1. File size cap: 20 MB
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 20 MB size limit (${(file.size / 1024 / 1024).toFixed(1)} MB)` },
          { status: 413 }
        );
      }

      // 2. MIME type validation
      if (!VALID_MIMES.has(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" has unsupported type: ${file.type}. Accepted: ${Array.from(VALID_MIMES).join(', ')}` },
          { status: 415 }
        );
      }
    }

    // ─── Resolve or create the project ─────────────────────────────────
    let resolvedProjectId = projectId;

    if (!resolvedProjectId && prompt) {
      // Create a new project + brief if we're starting from scratch with files
      const initialPrefills = discoveryAgent.parsePromptKeywords(prompt);
      const name = initialPrefills.targetAudience
        ? `${initialPrefills.targetAudience.split(' ')[0]} Studio`
        : 'New Studio Project';

      const project = await prisma.project.create({
        data: { name, description: prompt },
      });

      await prisma.livingBrief.create({
        data: { projectId: project.id, content: initialPrefills as any },
      });

      resolvedProjectId = project.id;
    }

    if (!resolvedProjectId) {
      return NextResponse.json(
        { error: 'Either projectId or prompt is required' },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: resolvedProjectId },
    });
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // ─── Run ingestion on each file ────────────────────────────────────
    const allDerivedFields: Record<string, { value: any; confidence: number }> = {};
    const ingestionResults: any[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await ingestionAgent.ingest({
        buffer,
        mimeType: file.type,
        fileName: file.name,
      });

      // Save SourceDocument record
      await prisma.sourceDocument.create({
        data: {
          projectId: resolvedProjectId,
          type: result.fileType,
          fileName: result.fileName,
          extractedContent: result.extractedContent as any,
          derivedBriefFields: result.derivedBriefFields as any,
          confidence: result.overallConfidence,
        },
      });

      // Merge derived fields — keep the highest-confidence value per field
      for (const derived of result.derivedBriefFields) {
        const existing = allDerivedFields[derived.field];
        if (!existing || derived.confidence > existing.confidence) {
          allDerivedFields[derived.field] = {
            value: derived.value,
            confidence: derived.confidence,
          };
        }
      }

      ingestionResults.push({
        fileName: result.fileName,
        fileType: result.fileType,
        fieldsExtracted: result.derivedBriefFields.length,
        overallConfidence: result.overallConfidence,
      });
    }

    // ─── Merge into Living Brief ───────────────────────────────────────
    let briefRecord = await prisma.livingBrief.findUnique({
      where: { projectId: resolvedProjectId },
    });

    const currentContent = (briefRecord?.content || {}) as Record<string, any>;

    // Only merge fields with sufficient confidence and that aren't already filled
    const mergedContent = { ...currentContent };
    let fieldsPreFilled = 0;

    for (const [field, { value, confidence }] of Object.entries(allDerivedFields)) {
      // Merge if confidence >= 0.6 AND the field is currently empty
      const currentVal = mergedContent[field];
      const isEmpty =
        currentVal === undefined ||
        currentVal === null ||
        currentVal === '' ||
        (Array.isArray(currentVal) && currentVal.length === 0);

      if (confidence >= 0.6 && isEmpty) {
        mergedContent[field] = value;
        fieldsPreFilled++;
      }
    }

    // Save updated brief
    if (briefRecord) {
      await prisma.livingBrief.update({
        where: { projectId: resolvedProjectId },
        data: { content: mergedContent as any },
      });
    } else {
      await prisma.livingBrief.create({
        data: {
          projectId: resolvedProjectId,
          content: mergedContent as any,
        },
      });
    }

    // ─── Generate next questions (skipping pre-filled fields) ──────────
    const { questions, prefills: llmPrefills } = await discoveryAgent.generateQuestions(
      project.description || prompt || '',
      mergedContent
    );

    const finalBrief = { ...mergedContent, ...llmPrefills };
    if (Object.keys(llmPrefills).length > 0) {
      await prisma.livingBrief.update({
        where: { projectId: resolvedProjectId },
        data: { content: finalBrief as any },
      });
    }

    const completeness = discoveryAgent.calculateCompleteness(finalBrief);

    const response: DiscoveryResponse & {
      ingestionResults: any[];
      fieldsPreFilled: number;
    } = {
      projectId: resolvedProjectId,
      questions,
      brief: finalBrief,
      completeness,
      isComplete: questions.length === 0,
      ingestionResults,
      fieldsPreFilled,
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Ingestion error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during ingestion' },
      { status: 500 }
    );
  }
}
