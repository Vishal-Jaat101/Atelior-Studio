import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename to prevent path traversal
    const safeFilename = path.basename(filename);

    // Find monorepo root
    const findRepoRoot = (startDir: string): string | null => {
      let curr = startDir;
      while (curr && curr !== path.dirname(curr)) {
        if (fs.existsSync(path.join(curr, 'turbo.json'))) {
          return curr;
        }
        curr = path.dirname(curr);
      }
      return null;
    };

    const repoRoot = findRepoRoot(process.cwd()) || findRepoRoot(__dirname) || process.cwd();

    // Check possible asset locations on disk
    const possiblePaths = [
      path.join(repoRoot, 'apps/web/public/uploads/assets', safeFilename),
      path.join(repoRoot, 'packages/agents/public/uploads/assets', safeFilename),
      path.join(process.cwd(), 'public/uploads/assets', safeFilename),
    ];

    let foundPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        foundPath = p;
        break;
      }
    }

    if (!foundPath) {
      console.warn(`[API /uploads/assets] File not found on disk: ${safeFilename}`);
      return NextResponse.json({ error: 'Asset file not found on disk' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(foundPath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err: any) {
    console.error('[API /uploads/assets Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to serve asset file' }, { status: 500 });
  }
}
