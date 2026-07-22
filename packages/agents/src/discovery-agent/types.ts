import { LivingBrief } from '../types.js';

export interface DiscoveryQuestion {
  id: string;
  field: keyof LivingBrief;
  text: string;
  type: 'open' | 'closed' | 'closed-multi';
  options?: string[];
  placeholder?: string;
}

export interface StartDiscoveryRequest {
  prompt: string;
}

export interface AnswerDiscoveryRequest {
  projectId: string;
  answers: Record<string, any>;
}

export interface UpdateBriefRequest {
  projectId: string;
  brief: Partial<LivingBrief>;
}

export interface DiscoveryResponse {
  projectId: string;
  questions: DiscoveryQuestion[];
  brief: Partial<LivingBrief>;
  completeness: number;
  isComplete: boolean;
}
