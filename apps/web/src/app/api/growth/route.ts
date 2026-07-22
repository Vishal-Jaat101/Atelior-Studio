import { NextRequest, NextResponse } from 'next/server';
import { GrowthAgent } from '@atelier/agents';

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const growthAgent = new GrowthAgent();
    const logs: string[] = ['Initializing automated Growth Agent optimization cycle...'];

    // 1. Gather current performance analytics
    logs.push('Fetching analytics from PostHog telemetry...');
    const analytics = await growthAgent.getAnalytics(projectId);
    logs.push(`Retrieved stats: Page views = ${analytics.pageViews}, unique visitors = ${analytics.uniqueVisitors}.`);

    // 2. Evaluate currently active A/B tests (simulated traffic flow + statistical checks)
    logs.push('Auditing active experiment variants...');
    const evalLogs = await growthAgent.evaluateActiveExperiments(projectId);
    if (evalLogs.length > 0) {
      logs.push(...evalLogs);
    } else {
      logs.push('No active testing cycles found.');
    }

    // 3. Propose new optimization ideas
    logs.push('Analyzing content conversion gaps using Nemotron model...');
    const { proposals, logs: proposalLogs } = await growthAgent.proposeExperiments(projectId);
    if (proposalLogs.length > 0) {
      logs.push(...proposalLogs);
    }

    logs.push('Growth Agent execution sweep completed successfully.');

    return NextResponse.json({
      success: true,
      proposals,
      logs
    });
  } catch (err: any) {
    console.error('Error running Growth Agent:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
