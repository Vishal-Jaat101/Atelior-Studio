export interface AnalyticsSnapshot {
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
  avgSessionDuration: number;
  topPages: { path: string; views: number }[];
}

export interface ExperimentProposal {
  elementTargeted: string;
  variantContent: { original: string; variant: string };
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH';
  metric: string;
  rationale: string;
}
