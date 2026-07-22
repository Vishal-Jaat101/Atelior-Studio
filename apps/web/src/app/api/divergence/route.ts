import { NextRequest, NextResponse } from 'next/server';
import { prisma, ConceptStatus } from '@atelier/db';
import { DivergenceAgent, getConditionKey } from '@atelier/agents';

const divergenceAgent = new DivergenceAgent();

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // 1. Fetch Living Brief
    const briefRecord = await prisma.livingBrief.findUnique({
      where: { projectId }
    });

    if (!briefRecord) {
      return NextResponse.json({ error: 'Living Brief not found for this project' }, { status: 404 });
    }

    const briefContent = briefRecord.content as any;

    // Fetch matching design priors
    const conditionKey = getConditionKey(briefContent);
    const priors = await prisma.learnedPrior.findMany({
      where: { scope: 'divergence', conditionKey }
    });

    // 2. Run Divergence Agent to generate 5 parallel axes
    const rawDirections = await divergenceAgent.generateDirections(briefContent, priors);

    // 3. Clear any existing variants for this project to start fresh
    await prisma.conceptVariant.deleteMany({
      where: { projectId }
    });

    // 4. Save variants to the database and identify top 2 survivors
    // Sort directions by passedCritiqueGate first, then by combined score (distinctiveness + coherence)
    const sortedDirections = [...rawDirections].sort((a, b) => {
      if (a.passedCritiqueGate !== b.passedCritiqueGate) {
        return a.passedCritiqueGate ? -1 : 1;
      }
      const scoreA = a.distinctivenessScore + a.coherenceScore;
      const scoreB = b.distinctivenessScore + b.coherenceScore;
      return scoreB - scoreA;
    });

    const savedVariants = [];
    for (let i = 0; i < sortedDirections.length; i++) {
      const dir = sortedDirections[i];
      // Top 2 that passed critique are survivors, others are eliminated
      const status: ConceptStatus = (dir.passedCritiqueGate && i < 2)
        ? ConceptStatus.SURVIVOR
        : ConceptStatus.ELIMINATED;

      const variant = await prisma.conceptVariant.create({
        data: {
          projectId,
          axis: dir.axis,
          passedCritiqueGate: dir.passedCritiqueGate,
          distinctivenessScore: dir.distinctivenessScore,
          coherenceScore: dir.coherenceScore,
          status,
          tokenPreview: dir.tokenPreview as any,
        }
      });
      savedVariants.push({
        ...variant,
        name: dir.name,
        description: dir.description
      });
    }

    // Return the top survivors
    const survivors = savedVariants.filter(v => v.status === ConceptStatus.SURVIVOR);

    return NextResponse.json({
      projectId,
      directions: survivors.length > 0 ? survivors : savedVariants.slice(0, 2), // fallback to top 2 if none survived critique
    });
  } catch (err: any) {
    console.error('Error generating design directions:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { projectId, variantId } = await req.json();
    if (!projectId || !variantId) {
      return NextResponse.json({ error: 'projectId and variantId are required' }, { status: 400 });
    }

    // 1. Verify variant exists
    const variant = await prisma.conceptVariant.findFirst({
      where: { id: variantId, projectId }
    });

    if (!variant) {
      return NextResponse.json({ error: 'Concept variant not found' }, { status: 404 });
    }

    // 2. Mark this variant as SELECTED and others as SURVIVOR / ELIMINATED
    await prisma.conceptVariant.updateMany({
      where: { projectId, status: ConceptStatus.SELECTED },
      data: { status: ConceptStatus.SURVIVOR }
    });

    await prisma.conceptVariant.update({
      where: { id: variantId },
      data: { status: ConceptStatus.SELECTED }
    });

    // Track selected axis in ProjectOutcomeSignal
    try {
      await prisma.projectOutcomeSignal.upsert({
        where: { projectId },
        update: {
          selectedConceptAxis: variant.axis
        },
        create: {
          projectId,
          briefFieldReworkCounts: {},
          discoveryQuestionsSkipped: [],
          selectedConceptAxis: variant.axis,
          iterationRounds: 1,
          reachedDeployment: false
        }
      });
    } catch (err) {
      console.warn('Failed to update ProjectOutcomeSignal for selected variant axis:', err);
    }

    // 3. Update or create Project DesignTokens model in the database
    const existingTokens = await prisma.designTokens.findUnique({
      where: { projectId }
    });

    if (existingTokens) {
      await prisma.designTokens.update({
        where: { projectId },
        data: {
          tokens: variant.tokenPreview as any,
          version: existingTokens.version + 1
        }
      });
    } else {
      await prisma.designTokens.create({
        data: {
          projectId,
          tokens: variant.tokenPreview as any,
          version: 1
        }
      });
    }

    return NextResponse.json({ success: true, selectedAxis: variant.axis });
  } catch (err: any) {
    console.error('Error selecting design direction:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
