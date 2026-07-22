import { NextResponse } from 'next/server';
import { AssetAgent } from '@atelier/agents';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, query } = body;

    if (!prompt && !query) {
      return NextResponse.json(
        { error: 'Missing prompt or query parameter' },
        { status: 400 }
      );
    }

    const agent = new AssetAgent();
    const searchQuery = query || (await agent.generateSearchQuery(prompt));
    const results = await agent.searchSketchfab(searchQuery, 10);

    return NextResponse.json({
      success: true,
      queryUsed: results.queryUsed,
      models: results.models,
    });
  } catch (error: any) {
    console.error('[API /api/asset/search Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Asset search failed' },
      { status: 500 }
    );
  }
}
