import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const negotiations = await prisma.agentNegotiation.findMany({
      where: { projectId, resolvedAt: null },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(negotiations);
  } catch (err: any) {
    console.error('Error fetching negotiations:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Trigger a mock Scope-vs-Time conflict between DesignAgent and ArchitectAgent
    const negotiation = await prisma.agentNegotiation.create({
      data: {
        projectId,
        agentsInvolved: ['DesignAgent', 'ArchitectAgent'],
        conflictSummary: 'DesignAgent requested custom spatial 3D animations and particle effects for the product showcase. However, ArchitectAgent warns that incorporating a full three.js rendering engine and custom Blender asset optimizations will extend the MVP build timeline from 3 days to 10 days, violating the "Fast Responsive Site" constraint.',
      }
    });

    return NextResponse.json(negotiation);
  } catch (err: any) {
    console.error('Error creating negotiation:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { negotiationId, userDecision } = await req.json();
    if (!negotiationId || !userDecision) {
      return NextResponse.json({ error: 'negotiationId and userDecision are required' }, { status: 400 });
    }

    const updated = await prisma.agentNegotiation.update({
      where: { id: negotiationId },
      data: {
        userDecision,
        resolvedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, updated });
  } catch (err: any) {
    console.error('Error resolving negotiation:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
