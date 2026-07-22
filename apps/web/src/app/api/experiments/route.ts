import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const experiments = await prisma.experimentVariant.findMany({
      where: { projectId },
      orderBy: { startedAt: 'desc' }
    });

    return NextResponse.json({ projectId, experiments });
  } catch (err: any) {
    console.error('Error fetching experiments:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, elementTargeted, variantContent, riskTier, metric } = await req.json();

    if (!projectId || !elementTargeted || !variantContent || !riskTier || !metric) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Determine status and traffic percent by RiskTier
    // LOW risk -> TESTING immediately at 10% traffic
    // MEDIUM/HIGH risk -> AWAITING_APPROVAL at 0% traffic
    const isLowRisk = riskTier === 'LOW';
    const status = isLowRisk ? 'TESTING' : 'AWAITING_APPROVAL';
    const trafficPercent = isLowRisk ? 10 : 0;

    const experiment = await prisma.experimentVariant.create({
      data: {
        projectId,
        elementTargeted,
        variantContent,
        riskTier,
        trafficPercent,
        metric,
        status,
        result: {
          original: { impressions: 0, clicks: 0 },
          variant: { impressions: 0, clicks: 0 }
        } as any
      }
    });

    return NextResponse.json({ success: true, experiment });
  } catch (err: any) {
    console.error('Error creating experiment:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { experimentId, status, trafficPercent, action } = await req.json();

    if (!experimentId) {
      return NextResponse.json({ error: 'experimentId is required' }, { status: 400 });
    }

    const current = await prisma.experimentVariant.findUnique({
      where: { id: experimentId }
    });

    if (!current) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 });
    }

    let updatedStatus = status || current.status;
    let updatedTraffic = trafficPercent !== undefined ? trafficPercent : current.trafficPercent;
    let resolvedAt = current.resolvedAt;

    // Handle approval actions
    if (action === 'approve') {
      updatedStatus = 'TESTING';
      updatedTraffic = 10; // start approved tests at 10%
    } else if (action === 'reject') {
      updatedStatus = 'REVERTED';
      updatedTraffic = 0;
      resolvedAt = new Date();
    } else if (action === 'promote') {
      updatedStatus = 'PROMOTED';
      updatedTraffic = 100;
      resolvedAt = new Date();
    } else if (action === 'revert') {
      updatedStatus = 'REVERTED';
      updatedTraffic = 0;
      resolvedAt = new Date();
    }

    const updated = await prisma.experimentVariant.update({
      where: { id: experimentId },
      data: {
        status: updatedStatus,
        trafficPercent: updatedTraffic,
        resolvedAt
      }
    });

    return NextResponse.json({ success: true, experiment: updated });
  } catch (err: any) {
    console.error('Error updating experiment:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
