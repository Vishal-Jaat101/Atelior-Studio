import { PrismaClient } from '@prisma/client';

export function getConditionKey(brief: any): string {
  if (!brief) return 'audience=consumer,platform=web';
  const targetAudience = String(brief.targetAudience || '').toLowerCase();
  const audience = (
    targetAudience.includes('collector') ||
    targetAudience.includes('professional') ||
    targetAudience.includes('b2b') ||
    targetAudience.includes('recruiter') ||
    targetAudience.includes('enterprise')
  ) ? 'professional' : 'consumer';

  const platforms = Array.isArray(brief.platforms) ? brief.platforms : [];
  const platform = platforms.includes('mobile') ? 'mobile' : 'web';

  return `audience=${audience},platform=${platform}`;
}

export class LearningAgent {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Run the periodic learning job to aggregate ProjectOutcomeSignals
   * and upsert LearnedPriors.
   */
  async runBatchJob(): Promise<{ success: boolean; aggregatedCount: number }> {
    console.log('Running LearningAgent Batch Job...');

    // 1. Fetch all outcome signals with project brief context
    const signals = await this.prisma.projectOutcomeSignal.findMany({
      include: {
        project: {
          include: {
            livingBrief: true
          }
        }
      }
    });

    if (signals.length === 0) {
      console.log('No ProjectOutcomeSignals found. LearnedPrior generation skipped.');
      return { success: true, aggregatedCount: 0 };
    }

    // Group signals by condition key
    const groups: Record<string, typeof signals> = {};
    for (const signal of signals) {
      const brief = signal.project?.livingBrief?.content as any;
      const key = getConditionKey(brief);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(signal);
    }

    let generatedPriorsCount = 0;

    // 2. Compute aggregate metrics per condition key group
    for (const [conditionKey, groupSignals] of Object.entries(groups)) {
      const sampleSize = groupSignals.length;

      // Group 1: Discovery scope (rework analysis)
      const fieldReworkTotals: Record<string, number> = {};
      const skippedQuestionsTotals: Record<string, number> = {};

      // Group 2: Divergence scope (axis preference analysis)
      const axisSelectionCounts: Record<string, number> = {};

      for (const sig of groupSignals) {
        // Rework counts
        const reworks = (sig.briefFieldReworkCounts || {}) as Record<string, number>;
        for (const [field, count] of Object.entries(reworks)) {
          fieldReworkTotals[field] = (fieldReworkTotals[field] || 0) + Number(count);
        }

        // Skipped questions
        const skipped = (sig.discoveryQuestionsSkipped || []) as string[];
        for (const field of skipped) {
          skippedQuestionsTotals[field] = (skippedQuestionsTotals[field] || 0) + 1;
        }

        // Winning axis selection
        if (sig.selectedConceptAxis) {
          axisSelectionCounts[sig.selectedConceptAxis] = (axisSelectionCounts[sig.selectedConceptAxis] || 0) + 1;
        }
      }

      // Calculate priority fields (fields that had the most rework or skipped and need early clarification)
      const sortedReworkFields = Object.entries(fieldReworkTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([field]) => field);

      // Discovery Prior
      const discoveryInsight = {
        priorityFields: sortedReworkFields.slice(0, 3),
        averageReworkPerField: Object.fromEntries(
          Object.entries(fieldReworkTotals).map(([f, total]) => [f, Number((total / sampleSize).toFixed(2))])
        ),
        skippedRate: Object.fromEntries(
          Object.entries(skippedQuestionsTotals).map(([f, total]) => [f, Number((total / sampleSize).toFixed(2))])
        )
      };

      await this.prisma.learnedPrior.upsert({
        where: {
          id: `prior-discovery-${conditionKey}` // Determinisic ID based on scope & key
        },
        update: {
          insight: discoveryInsight as any,
          sampleSize,
          updatedAt: new Date()
        },
        create: {
          id: `prior-discovery-${conditionKey}`,
          scope: 'discovery',
          conditionKey,
          insight: discoveryInsight as any,
          sampleSize
        }
      });

      // Divergence Prior
      const totalSelected = Object.values(axisSelectionCounts).reduce((a, b) => a + b, 0) || 1;
      const preferredAxes = Object.entries(axisSelectionCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([axis]) => axis);

      const divergenceInsight = {
        preferredAxes,
        selectionRates: Object.fromEntries(
          Object.entries(axisSelectionCounts).map(([axis, count]) => [axis, Number((count / totalSelected).toFixed(2))])
        )
      };

      await this.prisma.learnedPrior.upsert({
        where: {
          id: `prior-divergence-${conditionKey}`
        },
        update: {
          insight: divergenceInsight as any,
          sampleSize,
          updatedAt: new Date()
        },
        create: {
          id: `prior-divergence-${conditionKey}`,
          scope: 'divergence',
          conditionKey,
          insight: divergenceInsight as any,
          sampleSize
        }
      });

      generatedPriorsCount += 2;
    }

    console.log(`LearningAgent Batch Job successfully generated ${generatedPriorsCount} LearnedPriors across ${signals.length} projects.`);
    return { success: true, aggregatedCount: signals.length };
  }
}
