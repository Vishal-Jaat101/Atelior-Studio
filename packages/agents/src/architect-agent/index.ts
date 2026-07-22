import { LivingBrief, ImplementationPlan, DesignTokens } from '../types.js';
import { ModelRouter } from '../model-router.js';

export class ArchitectAgent {
  constructor() {
    // Shared router resolves api key and endpoint per configuration
  }

  async plan(brief: LivingBrief, tokens?: DesignTokens): Promise<ImplementationPlan> {
    try {
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'architect',
        messages: [
          {
            role: 'system',
            content: `You are a system architect. Ingest the Living Brief and Design Tokens, and design a structured Technical Blueprint.

STRICT SCOPE RULE (ANTI-SCOPE CREEP):
- You MUST ONLY include integrations, third-party APIs, and features that are EXPLICITLY requested in the Living Brief's mustHaveFeatures or niceToHaveFeatures.
- DO NOT add unrequested integrations (such as Stripe, Payments, Auth0, Firebase) unless explicitly written in the brief.
- If monetization or payments are NOT mentioned in the brief, DO NOT include a Checkout page or Stripe integration.
- If you believe an architectural element is missing, put it into the "unresolvedQuestions" list for the user to review. Never add unscoped features silently.

You must return strictly valid JSON matching this schema:
{
  "pages": [
    {
      "route": "URL path",
      "componentName": "ReactComponentName",
      "description": "visual and functional description",
      "has3D": true | false
    }
  ],
  "dataModelSketch": "SQL/Prisma Schema snippet for the custom data models needed",
  "integrations": ["list of third party APIs or integrations explicitly present in the brief"],
  "designDirection": "description of typography/style matching chosen tokens",
  "unresolvedQuestions": ["list of missing dependencies or scope questions for the user"],
  "tasks": [
    {
      "id": "unique-task-id",
      "taskType": "schema" | "frontend" | "backend" | "qa" | "deploy",
      "assignedTo": "CoderAgent" | "QAAgent" | "DeployAgent",
      "dependencies": ["prerequisite task ids"],
      "payload": {
        "title": "Short title",
        "instructions": "detailed coding instructions for this component/feature"
      }
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Living Brief: ${JSON.stringify(brief)}\nDesign Tokens: ${JSON.stringify(tokens || {})}`
          }
        ],
        temperature: 0.2,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');
      if (parsed.pages && parsed.tasks) {
        // Enforce anti-scope creep filter on integrations: remove Stripe/payments unless in brief
        const requestedFeaturesStr = JSON.stringify([...(brief.mustHaveFeatures || []), ...(brief.niceToHaveFeatures || [])]).toLowerCase();
        const hasPaymentRequested = requestedFeaturesStr.includes('stripe') || requestedFeaturesStr.includes('payment') || requestedFeaturesStr.includes('checkout') || requestedFeaturesStr.includes('buy');

        if (!hasPaymentRequested && parsed.integrations) {
          parsed.integrations = parsed.integrations.filter((i: string) => !/stripe|payment|checkout|paypal|square/i.test(i));
        }
        if (!hasPaymentRequested && parsed.pages) {
          parsed.pages = parsed.pages.filter((p: any) => !/checkout|billing|payment/i.test(p.route || '') && !/checkout|billing|payment/i.test(p.componentName || ''));
        }

        return parsed as ImplementationPlan;
      }
    } catch (err: any) {
      console.warn('Architect planning failed, using fallback planner:', err.message);
    }

    // Dynamic Fallback Planner (strictly scoped to brief)
    const has3D = brief.has3DApplicability ?? false;
    const requestedFeaturesStr = JSON.stringify([...(brief.mustHaveFeatures || []), ...(brief.niceToHaveFeatures || [])]).toLowerCase();
    const hasPaymentRequested = requestedFeaturesStr.includes('stripe') || requestedFeaturesStr.includes('payment') || requestedFeaturesStr.includes('checkout');

    const pages = [
      { route: '/', componentName: 'LandingPage', description: `Hero showcase landing page targeting ${brief.targetAudience || 'visitors'}.`, has3D },
      { route: '/showcase', componentName: 'ProductShowcase', description: 'Interactive project gallery and features.', has3D: false }
    ];

    if (hasPaymentRequested) {
      pages.push({ route: '/checkout', componentName: 'CheckoutFlow', description: 'Payment checkout flow.', has3D: false });
    }

    const tasks = [
      {
        id: 'task-schema',
        taskType: 'schema' as const,
        assignedTo: 'CoderAgent' as const,
        dependencies: [],
        payload: {
          title: 'Database Schema Setup',
          instructions: 'Define the core database models matching the project brief.'
        }
      },
      {
        id: 'task-fe-landing',
        taskType: 'frontend' as const,
        assignedTo: 'CoderAgent' as const,
        dependencies: ['task-schema'],
        payload: {
          title: 'Landing Page Component',
          instructions: `Construct the LandingPage component. Incorporate heading font ${tokens?.typography?.headingFont || 'Inter'} and background ${tokens?.colors?.background || '#0B0D12'}.`
        }
      },
      {
        id: 'task-be-api',
        taskType: 'backend' as const,
        assignedTo: 'CoderAgent' as const,
        dependencies: ['task-schema'],
        payload: {
          title: 'Core API Endpoints',
          instructions: 'Build backend API routes to serve requested project features.'
        }
      }
    ];

    const integrations = ['Prisma Database'];
    if (hasPaymentRequested) {
      integrations.push('Stripe Payments');
    }

    return {
      pages,
      dataModelSketch: 'model ProjectData { id String @id, title String, createdAt DateTime @default(now()) }',
      integrations,
      designDirection: brief.visualTone || 'Minimalist & Modern',
      tasks
    };
  }
}
