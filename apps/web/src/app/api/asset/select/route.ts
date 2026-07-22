import { NextResponse } from 'next/server';
import { AssetAgent } from '@atelier/agents';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modelUid, projectId, customName } = body;

    if (!modelUid || !projectId) {
      return NextResponse.json(
        { error: 'Missing modelUid or projectId parameter' },
        { status: 400 }
      );
    }

    const agent = new AssetAgent();
    const processedAsset = await agent.downloadAndPostProcess(
      modelUid,
      projectId,
      customName
    );

    return NextResponse.json({
      success: true,
      asset: processedAsset,
    });
  } catch (error: any) {
    console.error('[API /api/asset/select Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Asset selection/post-processing failed' },
      { status: 500 }
    );
  }
}
