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
  "integrations": ["list of third party APIs or integrations needed"],
  "designDirection": "description of typography/style matching chosen tokens",
  "tasks": [
    {
      "id": "unique-task-id (e.g. task-db-schema, task-fe-landing, task-be-api)",
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
        return parsed as ImplementationPlan;
      }
    } catch (err: any) {
      console.warn('Architect planning failed, using fallback planner:', err.message);
    }

    // Dynamic Fallback Planner
    const has3D = brief.has3DApplicability ?? false;
    const pages = [
      { route: '/', componentName: 'LandingPage', description: `Hero showcase landing page with target audience: ${brief.targetAudience || 'visitors'}.`, has3D },
      { route: '/gallery', componentName: 'ProductGallery', description: 'Interactive gallery showing item listings.', has3D: false },
      { route: '/checkout', componentName: 'CheckoutFlow', description: 'Checkout forms with state management.', has3D: false }
    ];

    const tasks = [
      {
        id: 'task-schema',
        taskType: 'schema' as const,
        assignedTo: 'CoderAgent' as const,
        dependencies: [],
        payload: {
          title: 'Database Schema Setup',
          instructions: 'Define the Product and Cart schema models to support mid-century catalog browsing.'
        }
      },
      {
        id: 'task-fe-landing',
        taskType: 'frontend' as const,
        assignedTo: 'CoderAgent' as const,
        dependencies: ['task-schema'],
        payload: {
          title: 'Landing Page Component',
          instructions: `Construct the LandingPage component. Incorporate active font ${tokens?.typography?.headingFont || 'Outfit'} and colors: background ${tokens?.colors?.background || '#0d0d11'}, accent ${tokens?.colors?.accentPrimary || '#ff0055'}.`
        }
      },
      {
        id: 'task-be-api',
        taskType: 'backend' as const,
        assignedTo: 'CoderAgent' as const,
        dependencies: ['task-schema'],
        payload: {
          title: 'Product Catalog APIs',
          instructions: 'Build GET /api/products route to fetch item lists and mock seed data.'
        }
      }
    ];

    return {
      pages,
      dataModelSketch: 'model Product { id String @id, name String, price Float, image String }',
      integrations: ['Prisma DB', 'Local Storage preview'],
      designDirection: brief.visualTone || 'Minimalist & Clean',
      tasks
    };
  }
}
