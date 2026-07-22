export interface PitchVideoResult {
  /** The generated voiceover script text */
  script: string;
  /** Local filesystem path to the final stitched video */
  videoPath: string;
  /** Duration of the final video in seconds */
  durationSeconds: number;
  /** Pipeline execution logs */
  logs: string[];
}
