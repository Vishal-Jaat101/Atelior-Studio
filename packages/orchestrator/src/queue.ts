import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient, TaskStatus } from '@atelier/db';

const prisma = new PrismaClient();

let _taskQueue: Queue | null = null;
export const taskQueue = new Proxy({} as Queue, {
  get(target, prop, receiver) {
    if (!_taskQueue) {
      console.log('Lazy initializing BullMQ taskQueue and Redis connection...');
      const conn = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
        maxRetriesPerRequest: null,
      });
      conn.on('error', (err) => {
        console.warn('[Redis connection error]:', err.message);
      });
      _taskQueue = new Queue('atelier-tasks', {
        connection: conn,
      });
    }
    return Reflect.get(_taskQueue, prop, receiver);
  }
});

export interface TaskPayload {
  taskId: String;
  projectId: String;
  taskType: String;
  payload: any;
}

import { CoderAgent, CoderResult, QAAgent, QAReport } from '@atelier/agents';

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

      // 2. Fetch project context (tokens, brief, plan)
      let brief: any = {};
      let plan: any = { pages: [], dataModelSketch: '', integrations: [], designDirection: '', tasks: [] };
      let tokens: any = {};

      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId.toString() },
          include: {
            livingBrief: true,
            implementationPlan: true,
            designTokens: true
          }
        });
        if (project) {
          brief = project.livingBrief?.content as any || {};
          plan = project.implementationPlan?.content as any || plan;
          tokens = project.designTokens?.tokens as any || {};
        }
      } catch (err) {
        console.warn(`[Job ${job.id}] Failed to fetch project context:`, err);
      }

      // 3. Perform code generation using CoderAgent
      let coderResult: CoderResult = { files: [], logs: [] };
      try {
        const coderAgent = new CoderAgent();
        coderResult = await coderAgent.generateCode(
          taskType.toString(),
          tokens,
          brief,
          plan,
          payload
        );
      } catch (err) {
        console.error(`[Job ${job.id}] CoderAgent execution failed:`, err);
      }

      // 3.5. Perform QA Agent review and test generation
      let qaReport: QAReport = { passed: true, testResults: [], fixSuggestions: [], logs: [] };
      try {
        const qaAgent = new QAAgent();
        qaReport = await qaAgent.check(
          coderResult.files,
          payload.title || '',
          payload.instructions || ''
        );
      } catch (err) {
        console.error(`[Job ${job.id}] QAAgent validation failed:`, err);
        qaReport = {
          passed: false,
          testResults: [{ testName: 'QA System Exception', passed: false, errorLog: String(err) }],
          fixSuggestions: ['Verify the Nvidia NIM LLM configuration.'],
          logs: ['QA system crashed during run.']
        };
      }

      console.log(`[Job ${job.id}] Finished task ${taskId} (QA passed: ${qaReport.passed})`);
      
      // Get current retry count
      let dbNode: any = null;
      try {
        dbNode = await prisma.taskNode.findUnique({
          where: { id: taskId.toString() },
        });
      } catch (err) {
        console.warn('Failed to retrieve task node for retry check:', err);
      }
      const currentRetries = dbNode?.retries ?? 0;

      // 4. Update status in DB and process self-healing re-queues
      if (qaReport.passed) {
        try {
          await prisma.taskNode.update({
            where: { id: taskId.toString() },
            data: {
              status: TaskStatus.COMPLETED,
              result: {
                files: coderResult.files,
                logs: coderResult.logs,
                qaReport
              } as any
            },
          });

          // 5. Queue next unblocked tasks
          await unblockAndQueueNextTasks(projectId.toString());
        } catch (err) {
          console.warn(`[Job ${job.id}] Failed to update status to COMPLETED or queue next tasks:`, err);
        }
      } else {
        // QA Failed: self-heal and re-queue up to 2 times
        if (currentRetries < 2) {
          const nextRetry = currentRetries + 1;
          console.log(`[Self-Healing Loop] Task ${taskId} failed QA. Re-queueing. Retry #${nextRetry}/2`);
          
          try {
            // Update node status to PENDING and increment retry counter
            await prisma.taskNode.update({
              where: { id: taskId.toString() },
              data: {
                status: TaskStatus.PENDING,
                retries: nextRetry,
                result: {
                  files: coderResult.files,
                  logs: coderResult.logs,
                  qaReport
                } as any
              },
            });

            // Prepare self-healing instruction payload for CoderAgent
            const selfHealingPayload = {
              ...payload,
              errorContext: {
                failedFiles: coderResult.files,
                qaLogs: qaReport.logs,
                testResults: qaReport.testResults,
                fixSuggestions: qaReport.fixSuggestions,
                retryCount: nextRetry
              }
            };

            // Re-add to BullMQ queue
            await taskQueue.add(`task-${taskId}-retry-${nextRetry}`, {
              taskId,
              projectId,
              taskType,
              payload: selfHealingPayload
            });

          } catch (err) {
            console.error(`[Job ${job.id}] Failed to re-enqueue task for self-healing:`, err);
          }
        } else {
          console.warn(`[Self-Healing Loop] Task ${taskId} failed QA after ${currentRetries} retries. Marking FAILED.`);
          try {
            await prisma.taskNode.update({
              where: { id: taskId.toString() },
              data: {
                status: TaskStatus.FAILED,
                result: {
                  files: coderResult.files,
                  logs: coderResult.logs,
                  qaReport
                } as any
              },
            });
          } catch (err) {
            console.error(`[Job ${job.id}] Failed to mark task status as FAILED:`, err);
          }
        }
      }

      return { success: true };
    },
    {
      connection: (() => {
        const conn = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
          maxRetriesPerRequest: null,
        });
        conn.on('error', (err) => {
          console.warn('[Redis connection error]:', err.message);
        });
        return conn;
      })(),
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[Job ${job?.id}] Failed with error:`, err);
  });

  return worker;
}

export async function unblockAndQueueNextTasks(projectId: string) {
  // Fetch all tasks in the project's task graph
  const taskGraph = await prisma.taskGraph.findUnique({
    where: { projectId },
    include: { nodes: true }
  });

  if (!taskGraph) return;

  const nodes = taskGraph.nodes;

  // Check if all tasks are completed. If so, update reachedDeployment = true in ProjectOutcomeSignal!
  const allCompleted = nodes.every(n => n.status === 'COMPLETED');
  if (allCompleted) {
    try {
      await prisma.projectOutcomeSignal.upsert({
        where: { projectId },
        update: {
          reachedDeployment: true
        },
        create: {
          projectId,
          briefFieldReworkCounts: {},
          discoveryQuestionsSkipped: [],
          selectedConceptAxis: '',
          iterationRounds: 1,
          reachedDeployment: true
        }
      });
      console.log(`[Project ${projectId}] All tasks completed! Marked reachedDeployment=true.`);
    } catch (err) {
      console.warn('Failed to mark deployment success in ProjectOutcomeSignal:', err);
    }
    return;
  }

  // Find all tasks that are currently PENDING
  const pendingNodes = nodes.filter(n => n.status === 'PENDING');

  for (const node of pendingNodes) {
    // A task is unblocked if all its dependencies are COMPLETED
    const deps = node.dependencies || [];
    const depsMet = deps.every(depId => {
      const depNode = nodes.find(n => n.id === depId);
      return depNode && depNode.status === 'COMPLETED';
    });

    if (depsMet) {
      console.log(`[Project ${projectId}] Unblocking task ${node.id} (${node.taskType})`);
      // Update status to PENDING/QUEUEING and add to BullMQ queue
      await prisma.taskNode.update({
        where: { id: node.id },
        data: { status: 'PENDING' }
      });

      await taskQueue.add(`task-${node.id}`, {
        taskId: node.id,
        projectId,
        taskType: node.taskType,
        payload: node.payload
      });
    }
  }
}

