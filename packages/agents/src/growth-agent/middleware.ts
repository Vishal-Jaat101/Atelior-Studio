export const MIDDLEWARE_TEMPLATE = `
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 1. Establish unique session/visitor cookie for bucketing
  let visitorId = request.cookies.get('atelier_visitor_id')?.value;
  const response = NextResponse.next();

  if (!visitorId) {
    visitorId = Math.random().toString(36).substring(2, 15);
    response.cookies.set('atelier_visitor_id', visitorId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
    });
  }

  // 2. Query active experiments for this project
  // In a real generated project, we call the Project API endpoint:
  // const res = await fetch(\`\${request.nextUrl.origin}/api/experiments/active\`);
  // const { experiments } = await res.json();
  
  // For the generated project middleware preview:
  // Determine bucket: Simple hash of visitorId to 0-99
  let hash = 0;
  for (let i = 0; i < visitorId.length; i++) {
    hash = visitorId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const bucket = Math.abs(hash) % 100;

  // Store bucket info in request header so page components can read it
  response.headers.set('x-visitor-bucket', bucket.toString());
  response.headers.set('x-visitor-id', visitorId);

  return response;
}

export const config = {
  matcher: ['/', '/gallery', '/checkout'],
};
`;

/**
 * A helper utility that page elements use to resolve active experiment values.
 */
export function getActiveExperimentValue(
  elementTargeted: string,
  experiments: any[],
  visitorBucket: number,
  fallbackText: string
): { text: string; experimentId?: string; isVariantServed: boolean } {
  const activeExp = experiments.find(
    exp => exp.elementTargeted === elementTargeted && exp.status === 'TESTING'
  );

  if (!activeExp) {
    // If promoted, serve promoted copy
    const promotedExp = experiments.find(
      exp => exp.elementTargeted === elementTargeted && exp.status === 'PROMOTED'
    );
    if (promotedExp) {
      const content = promotedExp.variantContent;
      return { text: content.variant || fallbackText, isVariantServed: true };
    }
    return { text: fallbackText, isVariantServed: false };
  }

  const content = activeExp.variantContent;
  const trafficPercent = activeExp.trafficPercent || 10; // e.g. 10%

  // Bucket check: if visitorBucket is in the variant traffic slot (e.g. 0 to trafficPercent-1)
  const serveVariant = visitorBucket < trafficPercent;

  return {
    text: serveVariant ? (content.variant || fallbackText) : (content.original || fallbackText),
    experimentId: activeExp.id,
    isVariantServed: serveVariant,
  };
}
