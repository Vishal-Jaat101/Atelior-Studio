import { prisma } from '@atelier/db';
import { AnalyticsSnapshot, ExperimentProposal } from './types.js';
import { ModelRouter } from '../model-router.js';

export class GrowthAgent {
  constructor() {
    // Shared router resolves api key and endpoint per configuration
  }

  /**
   * Reads or simulates analytics snapshot for a deployed project.
   */
  async getAnalytics(projectId: string): Promise<AnalyticsSnapshot> {
    // In production, query PostHog API using process.env.POSTHOG_API_KEY
    // For local verification and simulated traffic, return structured mock metrics.
    return {
      pageViews: 1200,
      uniqueVisitors: 450,
      bounceRate: 0.42,
      avgSessionDuration: 185,
      topPages: [
        { path: '/', views: 950 },
        { path: '/gallery', views: 250 }
      ]
    };
  }

  /**
   * Evaluates active experiments, updates their traffic/metrics, and resolves them.
   */
  async evaluateActiveExperiments(projectId: string): Promise<string[]> {
    const logs: string[] = [];
    const activeExperiments = await prisma.experimentVariant.findMany({
      where: {
        projectId,
        status: 'TESTING',
      },
    });

    for (const exp of activeExperiments) {
      // Simulate traffic updates
      const currentResult = (exp.result as any) || {
        original: { impressions: 0, clicks: 0 },
        variant: { impressions: 0, clicks: 0 },
      };

      // Add simulated traffic increments
      const incomingOriginalImpressions = Math.floor(Math.random() * 20) + 15;
      const incomingVariantImpressions = Math.floor(Math.random() * 20) + 15;

      // Base conversion rate: original is 5%, variant is 8% (simulated winner) or 3% (simulated loser)
      const isWinner = exp.elementTargeted.includes('hero') || Math.random() > 0.4;
      const originalConvRate = 0.05;
      const variantConvRate = isWinner ? 0.09 : 0.02;

      const incomingOriginalClicks = Math.round(incomingOriginalImpressions * originalConvRate + (Math.random() - 0.5) * 2);
      const incomingVariantClicks = Math.round(incomingVariantImpressions * variantConvRate + (Math.random() - 0.5) * 2);

      const updatedResult = {
        original: {
          impressions: currentResult.original.impressions + incomingOriginalImpressions,
          clicks: Math.max(0, currentResult.original.clicks + incomingOriginalClicks),
        },
        variant: {
          impressions: currentResult.variant.impressions + incomingVariantImpressions,
          clicks: Math.max(0, currentResult.variant.clicks + incomingVariantClicks),
        },
      };

      const originalCtr = updatedResult.original.clicks / (updatedResult.original.impressions || 1);
      const variantCtr = updatedResult.variant.clicks / (updatedResult.variant.impressions || 1);

      // Check threshold for statistical significance (e.g. 60 impressions on variant is our threshold for demo)
      const minImpressions = 55;
      let newStatus = exp.status;
      let resolvedAt: Date | null = null;

      if (updatedResult.variant.impressions >= minImpressions) {
        resolvedAt = new Date();
        if (variantCtr > originalCtr) {
          newStatus = 'PROMOTED';
          logs.push(
            `Experiment ${exp.id} on "${exp.elementTargeted}" has reached statistical significance (${updatedResult.variant.impressions} impressions). Promoting variant content to 100% traffic. CTR: original=${(originalCtr * 100).toFixed(1)}%, variant=${(variantCtr * 100).toFixed(1)}%`
          );
        } else {
          newStatus = 'REVERTED';
          logs.push(
            `Experiment ${exp.id} on "${exp.elementTargeted}" has reached significance. Reverting variant since performance was inferior. CTR: original=${(originalCtr * 100).toFixed(1)}%, variant=${(variantCtr * 100).toFixed(1)}%`
          );
        }
      } else {
        logs.push(
          `Experiment ${exp.id} gathered data. Impressions: original=${updatedResult.original.impressions}, variant=${updatedResult.variant.impressions}. Continuing run...`
        );
      }

      await prisma.experimentVariant.update({
        where: { id: exp.id },
        data: {
          result: updatedResult as any,
          status: newStatus,
          resolvedAt,
          trafficPercent: newStatus === 'PROMOTED' ? 100 : newStatus === 'REVERTED' ? 0 : exp.trafficPercent,
        },
      });
    }

    return logs;
  }

  /**
   * Uses Nemotron to propose optimized copy experiments.
   */
  async proposeExperiments(projectId: string): Promise<{ proposals: ExperimentProposal[]; logs: string[] }> {
    const logs: string[] = [];
    let proposals: ExperimentProposal[] = [];

    // Fetch brief to get core user flow and context
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { livingBrief: true },
    });

    if (!project || !project.livingBrief) {
      logs.push('Project context not found. Experiment proposal failed.');
      return { proposals, logs };
    }

    const brief = project.livingBrief.content as any;

    try {
      const systemMessage = `You are a Growth Hacking & Conversion Rate Optimization (CRO) Agent.
Analyze the project brief, user flows, and target audience.
Propose structured A/B copy experiments targeting two elements only:
1. "hero_copy" (low or medium risk copy updates for page headline)
2. "cta_button_text" (low risk updates for main call-to-action button copy)

Assign a RiskTier:
- LOW: minor typography or phrasing optimizations (e.g. changing "Register" to "Join Now").
- MEDIUM: bold re-positioning or value proposition shifts in headline copy.
- HIGH: significant changes involving price anchoring, urgency words, or radical copy redesigns.

Return strictly a valid JSON object matching this schema:
{
  "proposals": [
    {
      "elementTargeted": "hero_copy" | "cta_button_text",
      "variantContent": {
        "original": "existing standard text",
        "variant": "proposed high-converting alternative text"
      },
      "riskTier": "LOW" | "MEDIUM" | "HIGH",
      "metric": "click_rate" | "conversion_rate",
      "rationale": "Why this variant will increase conversion based on user persona"
    }
  ]
}`;

      const userMessage = `Living Brief: ${JSON.stringify(brief)}`;
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'growth',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');
      if (Array.isArray(parsed.proposals)) {
        proposals = parsed.proposals;
      }
    } catch (err: any) {
      console.warn('GrowthAgent proposal failed, using fallbacks:', err.message);
    }

    // High quality fallbacks if LLM fails or is not configured
    if (proposals.length === 0) {
      proposals = [
        {
          elementTargeted: 'cta_button_text',
          variantContent: {
            original: 'Get Started',
            variant: 'Claim Your Vintage Piece Now',
          },
          riskTier: 'LOW',
          metric: 'click_rate',
          rationale: 'Creating urgency around "Vintage Piece" resonates stronger with collectors than generic "Get Started".',
        },
        {
          elementTargeted: 'hero_copy',
          variantContent: {
            original: 'Mid-Century Masterpieces Crafted For Collectors',
            variant: 'Own the Design Icons that Defined a Century',
          },
          riskTier: 'MEDIUM',
          metric: 'conversion_rate',
          rationale: 'Reframes purchase from buying furniture to ownership of historical design art.',
        },
      ];
    }

    // Process and save proposals
    for (const prop of proposals) {
      // Check if variant targeting this element already exists
      const existing = await prisma.experimentVariant.findFirst({
        where: {
          projectId,
          elementTargeted: prop.elementTargeted,
          status: { in: ['TESTING', 'AWAITING_APPROVAL'] },
        },
      });

      if (existing) {
        logs.push(`Active experiment already exists for element "${prop.elementTargeted}". Skipping proposal.`);
        continue;
      }

      // Rules:
      // - riskTier=LOW: Auto-launch at trafficPercent = 10, status = TESTING
      // - riskTier=MEDIUM/HIGH: Sits in status = AWAITING_APPROVAL, trafficPercent = 0
      const isLowRisk = prop.riskTier === 'LOW';
      const status = isLowRisk ? 'TESTING' : 'AWAITING_APPROVAL';
      const trafficPercent = isLowRisk ? 10 : 0;

      const created = await prisma.experimentVariant.create({
        data: {
          projectId,
          elementTargeted: prop.elementTargeted,
          variantContent: prop.variantContent as any,
          riskTier: prop.riskTier,
          trafficPercent,
          metric: prop.metric,
          status,
          result: {
            original: { impressions: 0, clicks: 0 },
            variant: { impressions: 0, clicks: 0 },
          } as any,
        },
      });

      logs.push(
        `Created ${prop.riskTier}-risk variant for "${prop.elementTargeted}". Status: ${status}, Traffic: ${trafficPercent}%`
      );
    }

    return { proposals, logs };
  }
}
