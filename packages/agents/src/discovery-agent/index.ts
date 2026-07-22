import { DiscoveryQuestion, DiscoveryResponse } from './types.js';
import { ModelRouter } from '../model-router.js';
import { LivingBrief } from '../types.js';

const FALLBACK_QUESTIONS: Record<keyof LivingBrief, Omit<DiscoveryQuestion, 'id' | 'field'>> = {
  targetAudience: {
    text: "Who is the primary target audience for your project?",
    type: "open",
    options: ["Everyday Consumers", "Professional Collectors", "B2B / Corporate Clients", "Developers & Tech Enthusiasts"],
    placeholder: "e.g. Sneaker collectors, casual shoppers, enterprise managers..."
  },
  platforms: {
    text: "What platforms do we need to target first?",
    type: "closed",
    options: ["Web Browser (Desktop & Mobile)", "Mobile App (iOS & Android)", "Both Web & Mobile"],
    placeholder: "Select target platforms"
  },
  coreUserFlow: {
    text: "What is the core user flow or main sequence of actions?",
    type: "open",
    options: [
      "Browse items → View in 3D → Add to cart → Checkout",
      "Sign up → Customize dashboard → Monitor builds → Live Deploy",
      "Landing Page → Explore designs → Contact agency"
    ],
    placeholder: "e.g. User lands, browses items, views in 3D, and checks out..."
  },
  has3DApplicability: {
    text: "Do you want to embed interactive 3D elements/viewers?",
    type: "closed",
    options: ["Yes, include 3D features", "No, keep it 2D only"],
    placeholder: "Select 3D preference"
  },
  visualTone: {
    text: "What visual vibe/style represents your brand tone?",
    type: "closed",
    options: ["Bold & Rebellious Street", "Minimalist & Clean", "Dark Cyberpunk", "Classic Serif Editorial"],
    placeholder: "Select visual tone"
  },
  mustHaveFeatures: {
    text: "Which features are absolute must-haves for this version?",
    type: "closed-multi",
    options: ["Interactive 3D Hero Canvas", "Product Search & Filter Grid", "Shopping Cart & Pre-Order Checkout", "Admin Process Logs Console", "Figma Design Token Importer"],
    placeholder: "Select must-have features"
  },
  niceToHaveFeatures: {
    text: "What nice-to-have features should we note for future phases?",
    type: "closed-multi",
    options: ["User Profiles & Saved Wishlist", "Stripe Payment Gateway", "Live Chat Support", "Analytics Dashboard"],
    placeholder: "Select nice-to-have features"
  }
};

const FIELDS: (keyof LivingBrief)[] = [
  'targetAudience',
  'platforms',
  'coreUserFlow',
  'has3DApplicability',
  'visualTone',
  'mustHaveFeatures',
  'niceToHaveFeatures'
];

export class DiscoveryAgent {
  constructor() {
    // Shared router resolves api key and endpoint per configuration
  }

  /**
   * Helper to parse initial prompt for obvious pre-fills (keyword matching).
   */
  public parsePromptKeywords(prompt: string): Partial<LivingBrief> {
    const brief: Partial<LivingBrief> = {};
    const lower = prompt.toLowerCase();

    // 3D applicability
    if (lower.includes('3d') || lower.includes('rotate') || lower.includes('rotating') || lower.includes('spatial') || lower.includes('immersive')) {
      brief.has3DApplicability = true;
    }

    // Platforms
    if (lower.includes('both web and mobile') || (lower.includes('web') && lower.includes('mobile'))) {
      brief.platforms = ['web', 'mobile'];
    } else if (lower.includes('mobile') || lower.includes('app') || lower.includes('phone') || lower.includes('ios') || lower.includes('android')) {
      brief.platforms = ['mobile'];
    } else if (lower.includes('web') || lower.includes('browser') || lower.includes('site') || lower.includes('website')) {
      brief.platforms = ['web'];
    }

    // Audience & Tone
    if (lower.includes('sneaker') || lower.includes('shoe')) {
      brief.targetAudience = 'Sneaker collectors and streetwear enthusiasts';
      brief.visualTone = 'Bold & Rebellious Street';
    } else if (lower.includes('furniture') || lower.includes('decor')) {
      brief.targetAudience = 'Interior design lovers and premium collectors';
      brief.visualTone = 'Minimalist & Clean';
    } else if (lower.includes('portfolio') || lower.includes('resume')) {
      brief.targetAudience = 'Recruiters and industry professionals';
      brief.visualTone = 'Classic Serif Editorial';
    } else if (lower.includes('saas') || lower.includes('dashboard') || lower.includes('analytics')) {
      brief.targetAudience = 'Business managers and operations teams';
      brief.visualTone = 'Minimalist & Clean';
    }

    return brief;
  }

  /**
   * Calculates brief completeness percentage (0 to 100).
   */
  public calculateCompleteness(brief: Partial<LivingBrief>): number {
    let filled = 0;
    for (const field of FIELDS) {
      const val = brief[field];
      if (val !== undefined && val !== null && val !== '') {
        if (Array.isArray(val) && val.length === 0) {
          // Empty array is considered unfilled
        } else {
          filled++;
        }
      }
    }
    return Math.round((filled / FIELDS.length) * 100);
  }

  /**
   * Generates a batch of 1-3 clarifying questions based on current brief state.
   */
  public async generateQuestions(
    prompt: string,
    currentBrief: Partial<LivingBrief>,
    priors?: any
  ): Promise<{ questions: DiscoveryQuestion[]; prefills: Partial<LivingBrief> }> {
    // 1. Determine which fields are missing/unfilled
    const missingFields = FIELDS.filter(field => {
      const val = currentBrief[field];
      if (val === undefined || val === null || val === '') return true;
      if (Array.isArray(val) && val.length === 0) return true;
      return false;
    });

    if (missingFields.length === 0) {
      return { questions: [], prefills: {} };
    }

    // 2. Call ModelRouter
    try {
      let priorsContext = '';
      if (priors && (Array.isArray(priors) ? priors.length > 0 : Object.keys(priors).length > 0)) {
        priorsContext = `\nSOFT PRIORITIES FROM HISTORICAL DATA:\n${JSON.stringify(priors)}\nUse these insights (e.g. priorityFields) to prioritize asking questions about those fields early to reduce rework.`;
      }

      const systemMessage = `You are a senior product manager conducting an intake interview for a new digital product.
Your goal is to complete a "Living Brief" containing these fields:
- targetAudience (string: who uses it)
- platforms (array of strings: 'web' or 'mobile')
- coreUserFlow (string: main step-by-step path)
- has3DApplicability (boolean: requires 3D models/views)
- visualTone (string: visual tone/style)
- mustHaveFeatures (array of strings: core launch features)
- niceToHaveFeatures (array of strings: future/nice-to-have features)
${priorsContext}

Based on the initial user prompt and current brief state, choose 1 to 3 fields that are still missing or ambiguous.
Generate exactly 1 to 3 clarifying questions for those fields.
For closed fields, provide structured selection options. For open fields, provide question text and useful prefill suggestions.

You MUST respond strictly with a valid JSON object matching the schema below. Do not output any markdown code blocks or wrapper text:
{
  "prefills": {
     // Optional: Any fields you can confidently auto-fill right now based on the prompt
  },
  "questions": [
    {
      "id": "unique-id",
      "field": "fieldName", // must be one of the missing fields: ${missingFields.join(', ')}
      "text": "Question text here?",
      "type": "open" | "closed" | "closed-multi",
      "options": ["Option A", "Option B", ...] // only if type is closed/closed-multi
    }
  ]
}`;

      const userMessage = `Initial user prompt: "${prompt}"
Current Living Brief state: ${JSON.stringify(currentBrief)}
Unfilled/Ambiguous fields: ${missingFields.join(', ')}`;

      const { content } = await ModelRouter.chatCompletion({
        agentName: 'discovery',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.2,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');

      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        // Validate fields are allowed
        const validQuestions = parsed.questions.filter((q: any) =>
          FIELDS.includes(q.field) &&
          missingFields.includes(q.field) &&
          ['open', 'closed', 'closed-multi'].includes(q.type)
        );

        if (validQuestions.length > 0) {
          return {
            questions: validQuestions,
            prefills: parsed.prefills || {}
          };
        }
      }
    } catch (err: any) {
      console.warn("Failed to generate questions via ModelRouter, falling back to local rule-base:", err.message);
    }

    // Fall back to rule-base if LLM fails or fails validation
    return this.generateFallbackQuestions(missingFields);
  }

  private generateFallbackQuestions(missingFields: (keyof LivingBrief)[]): { questions: DiscoveryQuestion[]; prefills: Partial<LivingBrief> } {
    // Select the first 1-3 missing fields to ask about
    const targetFields = missingFields.slice(0, 2);
    const questions: DiscoveryQuestion[] = targetFields.map((field, idx) => {
      const config = FALLBACK_QUESTIONS[field];
      return {
        id: `q-${field}-${idx}`,
        field,
        text: config.text,
        type: config.type as any,
        options: config.options,
        placeholder: config.placeholder
      };
    });

    return { questions, prefills: {} };
  }
}
