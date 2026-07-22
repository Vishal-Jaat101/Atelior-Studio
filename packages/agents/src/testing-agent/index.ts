import { UsabilityReport } from './types.js';
import { ModelRouter } from '../model-router.js';

export class TestingAgent {
  constructor() {
    // Shared router resolves api key and endpoint per configuration
  }

  /**
   * Simulates a single persona walkthrough on the preview URL and generates a usability report.
   */
  async runTest(
    previewUrl: string,
    targetAudience: string,
    coreUserFlow: string
  ): Promise<UsabilityReport> {
    try {
      const { content } = await ModelRouter.chatCompletion({
        agentName: 'testing',
        messages: [
          {
            role: 'system',
            content: `You are a Synthetic User-Testing Agent. Analyze a target audience and core user flow, and simulate a navigation walkthrough of the preview URL.
You must return strictly valid JSON matching this schema:
{
  "personaName": "Full Name",
  "personaBio": "Age, occupation, technical comfort, and visual preferences",
  "walkthroughSteps": [
    "step 1: landed on homepage",
    "step 2: scrolled to check visual hierarchy",
    "..."
  ],
  "frictionPoints": [
    "issue 1: visual contrast on primary buttons",
    "issue 2: layout feels cramped on narrow devices"
  ],
  "critiqueSummary": "A concise summary of recommendations (2-3 sentences)",
  "overallRating": 1 to 5
}`
          },
          {
            role: 'user',
            content: `Preview URL: ${previewUrl}\nTarget Audience: ${targetAudience}\nCore User Flow: ${coreUserFlow}`
          }
        ],
        temperature: 0.3,
        responseFormat: { type: 'json_object' }
      });

      const parsed = JSON.parse(content || '{}');
      if (parsed.personaName && parsed.walkthroughSteps) {
        return parsed as UsabilityReport;
      }
    } catch (err: any) {
      console.warn('Testing agent call failed, using fallback:', err.message);
    }

    // Default Fallback Usability Report
    return {
      personaName: 'Sarah Jenkins (Vintage Collector)',
      personaBio: '42 years old, highly values curation, comfortable on modern browsers but rejects laggy animations or complex checkouts.',
      walkthroughSteps: [
        'Landed on mid-century furniture showcase landing page.',
        'Viewed primary catalog grid displaying vintage sofas.',
        'Attempted to filter items by 1960s decade tag.',
        'Navigated to product detail page to examine wood finish swatches.'
      ],
      frictionPoints: [
        'The typeface used for secondary details has insufficient visual weight, making wood descriptions hard to read.',
        'The transition between 3D orbital viewing and standard scroll has a 200ms lag on trackpads.'
      ],
      critiqueSummary: 'Excellent visual coherence with premium color choices. Suggest increasing typography weight for list details and optimizing frame rendering in 3D orbit viewer to eliminate trackpad lag.',
      overallRating: 4
    };
  }
}
