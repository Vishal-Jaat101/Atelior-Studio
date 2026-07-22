import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { Prisma } from '@prisma/client';
import { taskQueue, startWorker } from '@atelier/orchestrator';

export async function POST(req: NextRequest) {
  try {
    // Ensure the BullMQ worker runs globally inside the Next.js process
    if (!(global as any).atelierWorker) {
      (global as any).atelierWorker = startWorker();
    }

    const { projectId, injectFailureTaskId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // 1. Fetch the project's task graph
    const taskGraph = await prisma.taskGraph.findUnique({
      where: { projectId },
      include: { nodes: true }
    });

    if (!taskGraph || !taskGraph.nodes || taskGraph.nodes.length === 0) {
      return NextResponse.json({ error: 'Task graph or nodes not found' }, { status: 404 });
    }

    // 2. Reset all task node statuses to PENDING and wipe results for clean run
    for (const node of taskGraph.nodes) {
      const payloadObj = (node.payload as any) || {};
      
      // If this task was targeted for simulated failure injection, mark it
      const shouldFail = injectFailureTaskId === node.id;
      const updatedPayload = {
        ...payloadObj,
        injectFailure: shouldFail ? true : undefined
      };

      await prisma.taskNode.update({
        where: { id: node.id },
        data: {
          status: 'PENDING',
          result: Prisma.JsonNull,
          retries: 0,
          payload: updatedPayload as any
        }
      });
    }

    // Refresh nodes list after updates
    const refreshedNodes = await prisma.taskNode.findMany({
      where: { graphId: taskGraph.id }
    });

    // 3. Identify and queue root tasks (tasks with no dependencies)
    const rootNodes = refreshedNodes.filter(node => !node.dependencies || node.dependencies.length === 0);

    for (const node of rootNodes) {
      console.log(`[Queueing Root Task] adding task-${node.id} to BullMQ queue`);
      await taskQueue.add(`task-${node.id}`, {
        taskId: node.id,
        projectId,
        taskType: node.taskType,
        payload: node.payload
      });
    }

    return NextResponse.json({
      success: true,
      message: `Enqueued ${rootNodes.length} root task(s).`,
      rootTaskIds: rootNodes.map(n => n.id)
    });
  } catch (err: any) {
    console.error('Error starting execution:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const taskGraph = await prisma.taskGraph.findUnique({
      where: { projectId },
      include: {
        nodes: true
      }
    });

    if (!taskGraph) {
      return NextResponse.json({ error: 'Task graph not found' }, { status: 404 });
    }

    // Return the list of nodes
    return NextResponse.json({
      projectId,
      tasks: taskGraph.nodes
    });
  } catch (err: any) {
    console.error('Error fetching execution status:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
