export interface UsabilityReport {
  personaName: string;
  personaBio: string;
  walkthroughSteps: string[];
  frictionPoints: string[];
  critiqueSummary: string;
  overallRating: number; // 1-5 stars
}
