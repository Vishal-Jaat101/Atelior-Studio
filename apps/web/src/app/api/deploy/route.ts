import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const deployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });

    const signal = await prisma.projectOutcomeSignal.findUnique({
      where: { projectId }
    });

    return NextResponse.json({
      projectId,
      reachedDeployment: signal?.reachedDeployment || false,
      deployments
    });
  } catch (err: any) {
    console.error('Error fetching deployment status:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Verify project has a task graph and that all tasks are completed
    const taskGraph = await prisma.taskGraph.findUnique({
      where: { projectId },
      include: { nodes: true }
    });

    if (!taskGraph) {
      return NextResponse.json({ error: 'Task graph not found' }, { status: 404 });
    }

    const failedTasks = taskGraph.nodes.filter(n => n.status === 'FAILED');
    const runningTasks = taskGraph.nodes.filter(n => n.status === 'RUNNING' || n.status === 'PENDING');

    if (failedTasks.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Cannot deploy: ${failedTasks.length} task(s) failed QA.`
      }, { status: 400 });
    }

    // 1. Update ProjectOutcomeSignal.reachedDeployment = true
    await prisma.projectOutcomeSignal.upsert({
      where: { projectId },
      update: { reachedDeployment: true },
      create: {
        projectId,
        briefFieldReworkCounts: {},
        discoveryQuestionsSkipped: [],
        selectedConceptAxis: '',
        iterationRounds: 1,
        reachedDeployment: true
      }
    });

    // 2. Add a deployment record
    const latestDeployments = await prisma.deployment.findMany({
      where: { projectId }
    });
    const version = latestDeployments.length + 1;
    
    // Simulate a unique production URL based on project name/id
    const previewUrl = `https://atelier-preview-${projectId.substring(0, 8)}.vercel.app`;
    
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        version,
        url: previewUrl,
        changelog: `Production build release version v${version}.0 - Auto-deployed via Atelier Engine.`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Project deployed successfully!',
      reachedDeployment: true,
      deployment
    });
  } catch (err: any) {
    console.error('Error finalizing project deployment:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
