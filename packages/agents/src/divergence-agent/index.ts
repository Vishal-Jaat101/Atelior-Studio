import { LivingBrief, DesignTokens } from '../types.js';
import { DesignAgent } from '../index.js';
import { ConceptDirection } from './types.js';
import { ModelRouter } from '../model-router.js';

const AXES: { axis: 'editorial' | 'spatial' | 'minimal' | 'bold' | 'metaphor'; directionPrompt: string; desc: string }[] = [
  {
    axis: 'editorial',
    directionPrompt: 'elegant serif-heavy typography, newspaper grid, high-contrast dark ink on premium cream paper, structured editorial layouts',
    desc: 'Focuses on elegant serif typography, clean editorial margins, and a publishing-house feel.'
  },
  {
    axis: 'spatial',
    directionPrompt: '3D spatial canvases, smooth panning transitions, physics-based UI elements, immersive rotating shoe/product viewer, futuristic glow',
    desc: 'Prioritizes 3D depth, interactive canvas scenes, and kinetic motion effects.'
  },
  {
    axis: 'minimal',
    directionPrompt: 'ultra-stripped layout, monochromatic colors, single high-energy neon accent color, extreme whitespace, minimal fine borders',
    desc: 'Emphasizes extreme restraint, high contrast space, and pure typographic focus.'
  },
  {
    axis: 'bold',
    directionPrompt: 'maximalist visual clutter, massive blocky cards with heavy offset shadows, hyper-saturated streetwear colors (hot pink/cyber yellow), raw industrial typography',
    desc: 'Injects high-vibe streetwear aesthetic, thick card borders, and highly saturated action elements.'
  },
  {
    axis: 'metaphor',
    directionPrompt: 'outside-category layout styled like a technical retro blueprint drawing board, technical blueprint colors (blueprint blue/pencil gray/correction orange), dot-matrix annotation overlays',
    desc: 'Leverages an out-of-industry concept, styled specifically as a technical engineering blueprint board.'
  }
];

export class DivergenceAgent {
  private designAgent: DesignAgent;

  constructor() {
    this.designAgent = new DesignAgent();
  }

  /**
   * Generates 5 directions in parallel, runs them through the design agent's
   * anti-generic critique, and returns them with distinctiveness & coherence scores.
   */
  async generateDirections(brief: LivingBrief, priors?: any): Promise<ConceptDirection[]> {
    // We execute the 5 generation axes in parallel
    const promises = AXES.map(async ({ axis, directionPrompt, desc }) => {
      // 1. Propose design tokens
      let customPrompt = `${directionPrompt} matching brief description: ${brief.targetAudience} - Visual Tone preference: ${brief.visualTone}`;
      if (priors) {
        customPrompt += ` - Soft priorities from historical data: ${JSON.stringify(priors)}`;
      }
      const proposedTokens = await this.designAgent.proposeTokens(customPrompt);

      // 2. Run critique gate using DesignAgent
      const critique = await this.designAgent.critiqueTokens(axis, desc, proposedTokens);

      // 3. Compute coherence score based on brief alignment (LLM-based if key available, fallback otherwise)
      const coherenceScore = await this.evaluateCoherence(proposedTokens, brief);

      return {
        axis,
        name: `${axis.charAt(0).toUpperCase() + axis.slice(1)} Paradigm`,
        description: desc,
        passedCritiqueGate: critique.passedCritiqueGate,
        critiqueFeedback: critique.feedback,
        distinctivenessScore: critique.distinctivenessScore,
        coherenceScore,
        tokenPreview: proposedTokens,
      };
    });

    return Promise.all(promises);
  }

  private async evaluateCoherence(tokens: DesignTokens, brief: LivingBrief): Promise<number> {
    try {
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'divergence',
        messages: [
          {
            role: 'system',
            content: `Evaluate how well the proposed design tokens align with the product's Living Brief goals on a scale of 0.0 to 1.0.
Output strictly a JSON object with:
{
  "coherenceScore": 0.0 to 1.0,
  "rationale": "one sentence explanation"
}`
          },
          {
            role: 'user',
            content: `Living Brief: ${JSON.stringify(brief)}\nTokens: ${JSON.stringify(tokens)}`
          }
        ],
        temperature: 0.1,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');
      return Number(parsed.coherenceScore) || 0.8;
    } catch (err: any) {
      console.warn('Failed to evaluate coherence via ModelRouter:', err.message);
    }
    return 0.85; // fallback coherence score
  }
}
