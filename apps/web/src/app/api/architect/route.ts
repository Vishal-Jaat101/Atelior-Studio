import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { ArchitectAgent } from '@atelier/agents';

const architectAgent = new ArchitectAgent();

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // 1. Fetch Living Brief and Design Tokens
    const briefRecord = await prisma.livingBrief.findUnique({
      where: { projectId }
    });
    const tokensRecord = await prisma.designTokens.findUnique({
      where: { projectId }
    });

    if (!briefRecord) {
      return NextResponse.json({ error: 'Living Brief not found' }, { status: 404 });
    }

    const brief = briefRecord.content as any;
    const tokens = tokensRecord ? (tokensRecord.tokens as any) : undefined;

    // 2. Generate Technical Blueprint using ArchitectAgent
    const result = await architectAgent.plan(brief, tokens);

    // Track iteration in ProjectOutcomeSignal
    try {
      const outcome = await prisma.projectOutcomeSignal.findUnique({
        where: { projectId }
      });
      const currentRounds = outcome ? outcome.iterationRounds : 0;
      await prisma.projectOutcomeSignal.upsert({
        where: { projectId },
        update: {
          iterationRounds: currentRounds + 1
        },
        create: {
          projectId,
          briefFieldReworkCounts: {},
          discoveryQuestionsSkipped: [],
          selectedConceptAxis: '',
          iterationRounds: 1,
          reachedDeployment: false
        }
      });
    } catch (err) {
      console.warn('Failed to update ProjectOutcomeSignal for architect iteration:', err);
    }

    // 3. Save ImplementationPlan and TaskGraph to Database atomically
    const taskGraph = await prisma.$transaction(async (tx) => {
      // Clear existing ImplementationPlan
      await tx.implementationPlan.deleteMany({
        where: { projectId }
      });

      // Clear existing TaskNodes first to ensure no key conflicts or stale data
      await tx.taskNode.deleteMany({
        where: {
          graph: {
            projectId
          }
        }
      });

      // Clear existing TaskGraph
      await tx.taskGraph.deleteMany({
        where: { projectId }
      });

      // Create new ImplementationPlan
      await tx.implementationPlan.create({
        data: {
          projectId,
          content: {
            pages: result.pages,
            dataModelSketch: result.dataModelSketch,
            integrations: result.integrations,
            designDirection: result.designDirection,
          } as any
        }
      });

      // Create new TaskGraph and child TaskNodes
      return await tx.taskGraph.create({
        data: {
          projectId,
          nodes: {
            create: result.tasks.map(node => ({
              id: `${projectId}_${node.id}`,
              taskType: node.taskType,
              assignedTo: node.assignedTo,
              dependencies: node.dependencies.map(dep => `${projectId}_${dep}`),
              payload: node.payload as any,
              status: 'PENDING',
            }))
          }
        },
        include: {
          nodes: true
        }
      });
    });

    return NextResponse.json({
      projectId,
      pages: result.pages,
      dataModelSketch: result.dataModelSketch,
      integrations: result.integrations,
      tasks: taskGraph.nodes,
    });
  } catch (err: any) {
    console.error('Architect planning error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
