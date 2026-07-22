import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { QAAgent } from '@atelier/agents';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const taskGraph = await prisma.taskGraph.findUnique({
      where: { projectId },
      include: { nodes: true }
    });

    if (!taskGraph) {
      return NextResponse.json({ error: 'Task graph not found' }, { status: 404 });
    }

    // Retrieve QA reports stored on the task nodes' result fields
    const qaReports = taskGraph.nodes.map(node => {
      const resultObj = (node.result as any) || {};
      return {
        taskId: node.id,
        taskType: node.taskType,
        status: node.status,
        retries: node.retries,
        qaReport: resultObj.qaReport || null,
        logs: resultObj.logs || [],
      };
    });

    return NextResponse.json({ projectId, qaReports });
  } catch (err: any) {
    console.error('Error fetching QA status:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, taskId, isSimulatedFailure } = await req.json();

    if (!projectId || !taskId) {
      return NextResponse.json({ error: 'projectId and taskId are required' }, { status: 400 });
    }

    const node = await prisma.taskNode.findUnique({
      where: { id: taskId }
    });

    if (!node) {
      return NextResponse.json({ error: 'TaskNode not found' }, { status: 404 });
    }

    // Prepare files list for checking
    const nodeResult = (node.result as any) || {};
    const files = nodeResult.files || [];

    // If simulating a failure for a demo/run, append an intentional crash call
    if (isSimulatedFailure && files.length > 0) {
      files[0].content += `\n// Intentional failure trigger\nthrow new Error("fail_smoke_test: Simulated runtime crash in layout check");\n`;
    }

    const nodePayload = (node.payload as any) || {};
    const qaAgent = new QAAgent();
    const qaReport = await qaAgent.check(
      files,
      nodePayload.title || 'API check',
      nodePayload.instructions || ''
    );

    // Save QA Report to Node result
    await prisma.taskNode.update({
      where: { id: taskId },
      data: {
        result: {
          ...nodeResult,
          qaReport
        } as any
      }
    });

    return NextResponse.json({
      success: true,
      qaReport
    });
  } catch (err: any) {
    console.error('Error triggering QA check:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
