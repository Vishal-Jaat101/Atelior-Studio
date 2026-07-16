import { z } from 'zod';

export const LivingBriefSchema = z.object({
  targetAudience: z.string(),
  coreUserFlow: z.string(),
  mustHaveFeatures: z.array(z.string()),
  niceToHaveFeatures: z.array(z.string()),
  visualTone: z.string(),
  has3DApplicability: z.boolean(),
  platforms: z.array(z.enum(['web', 'mobile'])),
});

export type LivingBrief = z.infer<typeof LivingBriefSchema>;

export const ImplementationPlanSchema = z.object({
  pages: z.array(z.object({
    route: z.string(),
    componentName: z.string(),
    description: z.string(),
    has3D: z.boolean(),
  })),
  dataModelSketch: z.string(),
  integrations: z.array(z.string()),
  designDirection: z.string(),
  tasks: z.array(z.object({
    id: z.string(),
    taskType: z.string(),
    assignedTo: z.string(),
    dependencies: z.array(z.string()),
    payload: z.any(),
  })),
});

export type ImplementationPlan = z.infer<typeof ImplementationPlanSchema>;

export const DesignTokensSchema = z.object({
  colors: z.object({
    background: z.string(),
    cardBackground: z.string(),
    textPrimary: z.string(),
    textSecondary: z.string(),
    accentPrimary: z.string(),
    accentSecondary: z.string(),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    baseSize: z.string(),
  }),
  spacing: z.object({
    baseUnit: z.string(),
    layoutPadding: z.string(),
  }),
  motion: z.object({
    hoverDuration: z.string(),
    panelTransition: z.string(),
  }),
  signatureElement: z.string(),
});

export type DesignTokens = z.infer<typeof DesignTokensSchema>;

export interface CoderResult {
  files: {
    path: string;
    content: string;
  }[];
  logs: string[];
}

export interface QAResult {
  success: boolean;
  typeCheck: { passed: boolean; logs: string[] };
  lintCheck: { passed: boolean; logs: string[] };
  smokeTest: { passed: boolean; logs: string[] };
  visualDiff: { passed: boolean; driftPercentage: number; logs: string[] };
}
