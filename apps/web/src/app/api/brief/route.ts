import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { DiscoveryAgent, UpdateBriefRequest, DiscoveryResponse } from '@atelier/agents';

const agent = new DiscoveryAgent();

export async function PATCH(req: NextRequest) {
  try {
    const body: UpdateBriefRequest = await req.json();
    const { projectId, brief } = body;

    if (!projectId || !brief) {
      return NextResponse.json({ error: 'projectId and brief updates are required' }, { status: 400 });
    }

    // 1. Fetch current brief and project
    const briefRecord = await prisma.livingBrief.findUnique({
      where: { projectId }
    });

    const projectRecord = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!briefRecord || !projectRecord) {
      return NextResponse.json({ error: 'Project or brief not found' }, { status: 404 });
    }

    const currentBriefContent = (briefRecord.content || {}) as Record<string, any>;

    // 2. Apply updates (overwrite key values)
    const updatedBriefContent = { ...currentBriefContent };
    for (const key of Object.keys(brief)) {
      const val = (brief as any)[key];
      if (val !== undefined) {
        updatedBriefContent[key] = val;
      }
    }

    // 3. Save to database
    await prisma.livingBrief.update({
      where: { projectId },
      data: { content: updatedBriefContent as any }
    });

    // Track Rework in ProjectOutcomeSignal
    try {
      const outcome = await prisma.projectOutcomeSignal.findUnique({
        where: { projectId }
      });
      const rework = outcome ? ((outcome.briefFieldReworkCounts as Record<string, number>) || {}) : {};
      for (const field of Object.keys(brief)) {
        rework[field] = (rework[field] || 0) + 1;
      }
      await prisma.projectOutcomeSignal.upsert({
        where: { projectId },
        update: {
          briefFieldReworkCounts: rework as any
        },
        create: {
          projectId,
          briefFieldReworkCounts: rework as any,
          discoveryQuestionsSkipped: [],
          selectedConceptAxis: '',
          iterationRounds: 1,
          reachedDeployment: false
        }
      });
    } catch (err) {
      console.warn('Failed to update ProjectOutcomeSignal for brief edit:', err);
    }


    // 4. Update project description or name if visualTone or audience changes, optional nice touch
    if (brief.targetAudience) {
      const firstWord = brief.targetAudience.split(' ')[0] || '';
      if (firstWord && firstWord.length > 2) {
        await prisma.project.update({
          where: { id: projectId },
          data: { name: `${firstWord} Studio Project` }
        });
      }
    }

    // 5. Generate next questions batch based on the new brief state
    const { questions, prefills: llmPrefills } = await agent.generateQuestions(
      projectRecord.description || '',
      updatedBriefContent
    );

    // Merge any new automatic LLM pre-fills (if any)
    const finalBrief = { ...updatedBriefContent, ...llmPrefills };
    if (Object.keys(llmPrefills).length > 0) {
      await prisma.livingBrief.update({
        where: { projectId },
        data: { content: finalBrief as any }
      });
    }

    const completeness = agent.calculateCompleteness(finalBrief);

    const response: DiscoveryResponse = {
      projectId,
      questions,
      brief: finalBrief,
      completeness,
      isComplete: questions.length === 0
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error updating brief directly:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
