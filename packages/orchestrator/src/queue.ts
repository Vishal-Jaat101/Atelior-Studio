import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient, TaskStatus } from '@atelier/db';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

export const taskQueue = new Queue('atelier-tasks', {
  connection: redisConnection,
});

export interface TaskPayload {
  taskId: String;
  projectId: String;
  taskType: String;
  payload: any;
}

export function startWorker() {
  console.log('Starting Atelier Task Orchestrator Worker...');

  const worker = new Worker(
    'atelier-tasks',
    async (job: Job<TaskPayload>) => {
      const { taskId, projectId, taskType, payload } = job.data;
      console.log(`[Job ${job.id}] Running task ${taskId} (${taskType}) for project ${projectId}`);

      // 1. Update task status in DB to RUNNING
      try {
        await prisma.taskNode.update({
          where: { id: taskId.toString() },
          data: { status: TaskStatus.RUNNING },
        });
      } catch (err) {
        console.warn(`[Job ${job.id}] Failed to update status to RUNNING in database:`, err);
      }

      // 2. Perform task routing (this will be wired up to packages/agents later)
      // For now, this is a stub simulating execution.
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log(`[Job ${job.id}] Finished task ${taskId}`);
      
      // 3. Update status in DB to COMPLETED
      try {
        await prisma.taskNode.update({
          where: { id: taskId.toString() },
          data: { status: TaskStatus.COMPLETED },
        });
      } catch (err) {
        console.warn(`[Job ${job.id}] Failed to update status to COMPLETED in database:`, err);
      }

      return { success: true };
    },
    {
      connection: redisConnection,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Job ${job?.id}] Failed with error:`, err);
  });

  return worker;
}
