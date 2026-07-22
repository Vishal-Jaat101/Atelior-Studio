import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { DiscoveryAgent, StartDiscoveryRequest, AnswerDiscoveryRequest, DiscoveryResponse, getConditionKey } from '@atelier/agents';

// Single instance of the DiscoveryAgent
const agent = new DiscoveryAgent();

export async function POST(req: NextRequest) {
  try {
    const body: StartDiscoveryRequest = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // 1. Parse initial keywords from user prompt
    const initialPrefills = agent.parsePromptKeywords(prompt);

    // 2. Create the Project
    const name = initialPrefills.targetAudience 
      ? `${initialPrefills.targetAudience.split(' ')[0]} Studio` 
      : 'New Studio Project';

    const project = await prisma.project.create({
      data: {
        name,
        description: prompt
      }
    });

    // 3. Create the Living Brief with initial pre-fills
    await prisma.livingBrief.create({
      data: {
        projectId: project.id,
        content: initialPrefills as any
      }
    });

    // Fetch matching priors
    const conditionKey = getConditionKey(initialPrefills);
    const priors = await prisma.learnedPrior.findMany({
      where: { scope: 'discovery', conditionKey }
    });

    // 4. Generate the first batch of clarifying questions
    const { questions, prefills: llmPrefills } = await agent.generateQuestions(prompt, initialPrefills, priors);

    // 5. Merge prefilled fields and save to DB
    const finalBrief = { ...initialPrefills, ...llmPrefills };
    if (Object.keys(llmPrefills).length > 0) {
      await prisma.livingBrief.update({
        where: { projectId: project.id },
        data: { content: finalBrief as any }
      });
    }

    const completeness = agent.calculateCompleteness(finalBrief);

    const response: DiscoveryResponse = {
      projectId: project.id,
      questions,
      brief: finalBrief,
      completeness,
      isComplete: questions.length === 0
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error starting discovery:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: AnswerDiscoveryRequest = await req.json();
    const { projectId, answers } = body;

    if (!projectId || !answers) {
      return NextResponse.json({ error: 'projectId and answers are required' }, { status: 400 });
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

    // 2. Merge old content with new answers
    const currentBrief = (briefRecord.content || {}) as Record<string, any>;
    
    // Clean up empty answers if any
    const updatedBriefContent = { ...currentBrief };
    for (const key of Object.keys(answers)) {
      const val = answers[key];
      if (val !== undefined && val !== null) {
        updatedBriefContent[key] = val;
      }
    }

    // 3. Persist updated brief to DB
    await prisma.livingBrief.update({
      where: { projectId },
      data: { content: updatedBriefContent as any }
    });

    // Track skipped questions in ProjectOutcomeSignal
    try {
      const skippedFields = Object.keys(answers).filter(key => {
        const val = answers[key];
        return val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
      });
      if (skippedFields.length > 0) {
        const outcome = await prisma.projectOutcomeSignal.findUnique({
          where: { projectId }
        });
        const currentSkipped = outcome ? ((outcome.discoveryQuestionsSkipped as string[]) || []) : [];
        const newSkipped = Array.from(new Set([...currentSkipped, ...skippedFields]));
        await prisma.projectOutcomeSignal.upsert({
          where: { projectId },
          update: {
            discoveryQuestionsSkipped: newSkipped as any
          },
          create: {
            projectId,
            briefFieldReworkCounts: {},
            discoveryQuestionsSkipped: newSkipped as any,
            selectedConceptAxis: '',
            iterationRounds: 1,
            reachedDeployment: false
          }
        });
      }
    } catch (err) {
      console.warn('Failed to update ProjectOutcomeSignal for skipped questions:', err);
    }


    // Fetch matching priors
    const conditionKey = getConditionKey(updatedBriefContent);
    const priors = await prisma.learnedPrior.findMany({
      where: { scope: 'discovery', conditionKey }
    });

    // 4. Generate next questions batch
    const { questions, prefills: llmPrefills } = await agent.generateQuestions(
      projectRecord.description || '',
      updatedBriefContent,
      priors
    );

    // Merge any new automatic LLM pre-fills
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
    console.error('Error answering questions:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
