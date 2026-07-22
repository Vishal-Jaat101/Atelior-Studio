export interface QATestResult {
  testName: string;
  passed: boolean;
  errorLog?: string;
}

export interface QAReport {
  passed: boolean;
  testResults: QATestResult[];
  fixSuggestions: string[];
  logs: string[];
}
