import { DesignTokens } from '../types.js';

export interface ConceptDirection {
  axis: 'editorial' | 'spatial' | 'minimal' | 'bold' | 'metaphor';
  name: string;
  description: string;
  passedCritiqueGate: boolean;
  critiqueFeedback?: string;
  distinctivenessScore: number;
  coherenceScore: number;
  tokenPreview: DesignTokens;
}

export interface DivergenceResponse {
  projectId: string;
  directions: ConceptDirection[];
}
