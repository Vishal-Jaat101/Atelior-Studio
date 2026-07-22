import OpenAI from 'openai';
import { LivingBrief, ImplementationPlan, DesignTokens, CoderResult, QAResult } from './types.js';

export * from './types.js';
export * from './discovery-agent/types.js';
export { DiscoveryAgent } from './discovery-agent/index.js';
export { IngestionAgent } from './ingestion-agent/index.js';
export * from './ingestion-agent/types.js';
export { DivergenceAgent } from './divergence-agent/index.js';
export * from './divergence-agent/types.js';
export { TestingAgent } from './testing-agent/index.js';
export * from './testing-agent/types.js';


import { ModelRouter } from './model-router.js';

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
        taskType: 'schema',
        assignedTo: 'CoderAgent',
        dependencies: [],
        payload: {
          title: 'Database Schema Setup',
          instructions: 'Define the Product and Cart schema models to support mid-century catalog browsing.'
        }
      },
      {
        id: 'task-fe-landing',
        taskType: 'frontend',
        assignedTo: 'CoderAgent',
        dependencies: ['task-schema'],
        payload: {
          title: 'Landing Page Component',
          instructions: `Construct the LandingPage component. Incorporate active font ${tokens?.typography?.headingFont || 'Outfit'} and colors: background ${tokens?.colors?.background || '#0d0d11'}, accent ${tokens?.colors?.accentPrimary || '#ff0055'}.`
        }
      },
      {
        id: 'task-be-api',
        taskType: 'backend',
        assignedTo: 'CoderAgent',
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

export class DesignAgent {
  constructor() {
    // Shared router resolves api key and endpoint per configuration
  }

  async proposeTokens(direction: string): Promise<DesignTokens> {
    try {
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'design',
        messages: [
          {
            role: 'system',
            content: `You are a design system engineer. Generate a cohesive, distinctive set of design tokens matching the requested visual direction: "${direction}".
You must output strictly valid JSON conforming to this schema, with no additional text or markdown code blocks:
{
  "colors": {
    "background": "hex color",
    "cardBackground": "hex color",
    "textPrimary": "hex color",
    "textSecondary": "hex color",
    "accentPrimary": "hex color",
    "accentSecondary": "hex color"
  },
  "typography": {
    "headingFont": "font name (e.g., Space Grotesk, Playfair Display, Outfit)",
    "bodyFont": "font name (e.g., Inter, Plus Jakarta Sans, Instrument Sans)",
    "baseSize": "e.g., 16px"
  },
  "spacing": {
    "baseUnit": "e.g., 4px",
    "layoutPadding": "e.g., 24px"
  },
  "motion": {
    "hoverDuration": "e.g., 150ms",
    "panelTransition": "e.g., 300ms"
  },
  "signatureElement": "e.g., slant-border, technical-dots, glass-blur"
}`
          },
          {
            role: 'user',
            content: `Generate tokens for direction: ${direction}`
          }
        ],
        temperature: 0.3,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');
      if (parsed.colors && parsed.typography && parsed.spacing) {
        return parsed as DesignTokens;
      }
    } catch (err: any) {
      console.warn('Failed to propose tokens via Design Agent, using defaults:', err.message);
    }

    // Default Fallbacks by direction keywords
    const isDark = direction.toLowerCase().includes('dark') || direction.toLowerCase().includes('cyber') || direction.toLowerCase().includes('rebellious');
    const accent = direction.toLowerCase().includes('bold') ? '#ff0055' : direction.toLowerCase().includes('editorial') ? '#28456b' : '#8a93a3';
    
    return {
      colors: {
        background: isDark ? '#0d0d11' : '#fcfbf9',
        cardBackground: isDark ? '#16161e' : '#f3f2ee',
        textPrimary: isDark ? '#ffffff' : '#161b22',
        textSecondary: isDark ? '#a0a0ab' : '#8a93a3',
        accentPrimary: accent,
        accentSecondary: isDark ? '#00e5ff' : '#e8a33d',
      },
      typography: {
        headingFont: direction.toLowerCase().includes('editorial') ? 'Playfair Display' : 'Space Grotesk',
        bodyFont: 'Inter',
        baseSize: '16px',
      },
      spacing: {
        baseUnit: '4px',
        layoutPadding: '24px',
      },
      motion: {
        hoverDuration: '150ms',
        panelTransition: '300ms',
      },
      signatureElement: direction.toLowerCase().includes('spatial') ? 'glass-blur' : 'slant-border',
    };
  }

  async critiqueTokens(
    axis: string,
    description: string,
    tokens: DesignTokens
  ): Promise<{ passedCritiqueGate: boolean; feedback: string; distinctivenessScore: number }> {
    try {
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'design',
        messages: [
          {
            role: 'system',
            content: `You are an anti-generic design critic. Evaluate if the proposed design tokens and concept direction represent a premium, distinct design system, or a generic, stock template.
Reject directions that use standard default gray/blue combinations, default sans fonts (like system default Arial/Helvetica with no styling), or lack breathing room and character.
Return strictly a JSON object with:
{
  "passedCritiqueGate": true | false,
  "feedback": "detailed critique about visual hierarchy, palette choice, and typography",
  "distinctivenessScore": 0.0 to 1.0
}`
          },
          {
            role: 'user',
            content: `Axis: ${axis}\nDescription: ${description}\nTokens: ${JSON.stringify(tokens, null, 2)}`
          }
        ],
        temperature: 0.2,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');
      return {
        passedCritiqueGate: parsed.passedCritiqueGate ?? true,
        feedback: parsed.feedback || 'Looks premium.',
        distinctivenessScore: Number(parsed.distinctivenessScore) || 0.8,
      };
    } catch (err: any) {
      console.warn('Critique LLM call failed, using fallback rubric:', err.message);
    }

    // Local Fallback Rubric
    const isGeneric = 
      tokens.colors.background === '#ffffff' && 
      tokens.colors.accentPrimary === '#0000ff'; // typical generic blue

    return {
      passedCritiqueGate: !isGeneric,
      feedback: isGeneric 
        ? 'Rejected: The palette uses stock blue and plain white background. It lacks premium styling.'
        : 'Approved: Non-standard visual palette with custom typography pairings.',
      distinctivenessScore: isGeneric ? 0.3 : 0.75,
    };
  }
}
export { CoderAgent } from './coder-agent/index.js';
export { LearningAgent, getConditionKey } from './learning-agent/index.js';

export { QAAgent } from './qa-agent/index.js';
export * from './qa-agent/types.js';

export { GrowthAgent } from './growth-agent/index.js';
export * from './growth-agent/types.js';
export { MIDDLEWARE_TEMPLATE, getActiveExperimentValue } from './growth-agent/middleware.js';

export { PitchVideoAgent } from './pitch-video-agent/index.js';
export type { PitchVideoInput } from './pitch-video-agent/index.js';
export * from './pitch-video-agent/types.js';

export { ModelRouter, ROUTER_CONFIG } from './model-router.js';
