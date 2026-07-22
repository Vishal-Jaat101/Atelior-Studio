import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { TestingAgent } from '@atelier/agents';

const testingAgent = new TestingAgent();

export async function POST(req: NextRequest) {
  try {
    const { projectId, previewUrl } = await req.json();
    if (!projectId || !previewUrl) {
      return NextResponse.json({ error: 'projectId and previewUrl are required' }, { status: 400 });
    }

    // 1. Fetch Living Brief
    const briefRecord = await prisma.livingBrief.findUnique({
      where: { projectId }
    });

    if (!briefRecord) {
      return NextResponse.json({ error: 'Living Brief not found' }, { status: 404 });
    }

    const brief = briefRecord.content as any;

    // 2. Run Synthetic User Test
    const report = await testingAgent.runTest(
      previewUrl,
      brief.targetAudience || 'general public',
      brief.coreUserFlow || 'browse website'
    );

    return NextResponse.json(report);
  } catch (err: any) {
    console.error('Synthetic test error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
