import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Serves generated pitch video files from the local .tmp/pitch-videos/ directory.
 * In production, these would be served from cloud storage (GCS/S3).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('name');

    if (!fileName) {
      return NextResponse.json({ error: 'name parameter is required' }, { status: 400 });
    }

    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(fileName);
    const filePath = path.resolve(process.cwd(), '.tmp', 'pitch-videos', safeName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(safeName).toLowerCase();
    const contentType = ext === '.mp4' ? 'video/mp4' : ext === '.webm' ? 'video/webm' : 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    console.error('Error serving pitch video file:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
