import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@atelier/db';
import { PitchVideoAgent } from '@atelier/agents';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const pitchVideos = await prisma.pitchVideo.findMany({
      where: { projectId },
      orderBy: { generatedAt: 'desc' },
    });

    return NextResponse.json({ pitchVideos });
  } catch (err: any) {
    console.error('Error fetching pitch videos:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    // Fetch project data needed for the pitch video pipeline
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        livingBrief: true,
        implementationPlan: true,
        deployments: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (!project.deployments || project.deployments.length === 0) {
      return NextResponse.json({ error: 'Project has not been deployed yet' }, { status: 400 });
    }

    const deployUrl = project.deployments[0].url;
    const briefContent = (project.livingBrief?.content as any) || {};
    const planContent = (project.implementationPlan?.content as any) || {};

    // Run the pitch video generation pipeline
    const agent = new PitchVideoAgent();
    const result = await agent.generate({
      deployUrl,
      brief: {
        targetAudience: briefContent.targetAudience,
        coreUserFlow: briefContent.coreUserFlow,
        visualTone: briefContent.visualTone,
        mustHaveFeatures: briefContent.mustHaveFeatures,
        platforms: briefContent.platforms,
      },
      plan: {
        pages: planContent.pages,
        designDirection: planContent.designDirection,
      },
    });

    // Construct a servable URL for the video
    // In v1, serve from local .tmp directory via a relative path
    const videoFileName = result.videoPath.split(/[\\/]/).pop() || 'pitch.mp4';
    const videoUrl = `/api/pitch-video/file?name=${encodeURIComponent(videoFileName)}`;

    // Save PitchVideo record to the database
    const pitchVideo = await prisma.pitchVideo.create({
      data: {
        projectId,
        script: result.script,
        videoUrl,
        durationSeconds: result.durationSeconds,
      },
    });

    return NextResponse.json({
      success: true,
      pitchVideo,
      logs: result.logs,
    });
  } catch (err: any) {
    console.error('Error generating pitch video:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
