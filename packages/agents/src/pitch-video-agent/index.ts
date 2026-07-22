import OpenAI from 'openai';
import { chromium, type Browser, type Page } from 'playwright-core';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import * as fs from 'fs';
import * as path from 'path';
import { PitchVideoResult } from './types.js';

// Point fluent-ffmpeg at the static binary bundled by ffmpeg-static
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath);
}

export interface PitchVideoInput {
  deployUrl: string;
  brief: {
    targetAudience?: string;
    coreUserFlow?: string;
    visualTone?: string;
    mustHaveFeatures?: string[];
    platforms?: string[];
  };
  plan: {
    pages?: { route: string; componentName: string; description: string }[];
    designDirection?: string;
  };
}

export class PitchVideoAgent {
  private openai: OpenAI | null = null;
  private modelName: string;
  private outputDir: string;

  constructor() {
    const apiKey = process.env.NVIDIA_NIM_API_KEY || '';
    const baseURL = process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
    this.modelName = process.env.NIM_MODEL_NAME || 'nvidia/llama-3.1-nemotron-70b-instruct';
    if (apiKey) {
      this.openai = new OpenAI({ apiKey, baseURL });
    }
    this.outputDir = path.resolve(process.cwd(), '.tmp', 'pitch-videos');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Full pitch video generation pipeline.
   */
  async generate(input: PitchVideoInput): Promise<PitchVideoResult> {
    const logs: string[] = [];
    const timestamp = Date.now();
    const projectSlug = input.deployUrl.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);

    logs.push(`[PitchVideoAgent] Starting pitch video generation for ${input.deployUrl}`);

    // Step 1: Generate voiceover script
    logs.push('[Step 1/4] Generating voiceover script from Living Brief...');
    const script = await this.generateScript(input.brief, input.plan);
    logs.push(`[Step 1/4] Script generated (${script.length} chars): "${script.substring(0, 80)}..."`);

    // Step 2: Record screen walkthrough
    logs.push('[Step 2/4] Recording Playwright screen walkthrough...');
    const screenRecordingPath = path.join(this.outputDir, `screen_${projectSlug}_${timestamp}.webm`);
    let recordingDuration = 0;
    try {
      recordingDuration = await this.recordWalkthrough(
        input.deployUrl,
        input.plan.pages || [],
        screenRecordingPath
      );
      logs.push(`[Step 2/4] Screen recording saved (${recordingDuration}s): ${screenRecordingPath}`);
    } catch (err: any) {
      logs.push(`[Step 2/4] Playwright recording failed: ${err.message}. Using fallback slate video.`);
      await this.generateSlateVideo(screenRecordingPath, script, 30);
      recordingDuration = 30;
    }

    // Step 3: Synthesize voiceover audio
    logs.push('[Step 3/4] Synthesizing TTS voiceover...');
    const audioPath = path.join(this.outputDir, `voiceover_${projectSlug}_${timestamp}.mp3`);
    let hasAudio = false;
    try {
      hasAudio = await this.synthesizeVoiceover(script, audioPath);
      if (hasAudio) {
        logs.push(`[Step 3/4] Voiceover audio saved: ${audioPath}`);
      } else {
        logs.push('[Step 3/4] No ELEVENLABS_API_KEY set — producing silent video with subtitles.');
      }
    } catch (err: any) {
      logs.push(`[Step 3/4] TTS synthesis failed: ${err.message}. Falling back to silent mode.`);
      hasAudio = false;
    }

    // Step 4: Stitch video + audio into final MP4
    logs.push('[Step 4/4] Stitching final MP4...');
    const finalVideoPath = path.join(this.outputDir, `pitch_${projectSlug}_${timestamp}.mp4`);
    try {
      await this.stitchVideo(screenRecordingPath, hasAudio ? audioPath : null, script, finalVideoPath);
      logs.push(`[Step 4/4] Final pitch video saved: ${finalVideoPath}`);
    } catch (err: any) {
      logs.push(`[Step 4/4] FFmpeg stitching failed: ${err.message}. Copying raw recording as fallback.`);
      if (fs.existsSync(screenRecordingPath)) {
        fs.copyFileSync(screenRecordingPath, finalVideoPath);
      }
    }

    // Calculate final duration
    const durationSeconds = recordingDuration || 30;

    logs.push(`[PitchVideoAgent] Pipeline complete. Duration: ${durationSeconds}s`);

    return {
      script,
      videoPath: finalVideoPath,
      durationSeconds,
      logs,
    };
  }

  /**
   * Step 1: Generate a ~30-second voiceover script from the Living Brief + Implementation Plan.
   */
  async generateScript(
    brief: PitchVideoInput['brief'],
    plan: PitchVideoInput['plan']
  ): Promise<string> {
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: this.modelName,
          messages: [
            {
              role: 'system',
              content: `You are a product marketing copywriter. Write a concise, engaging voiceover script for a ~30-second pitch video showcasing a newly built web application.

Rules:
- Output ONLY the voiceover text, no stage directions, no timestamps, no formatting.
- Keep it between 400-600 characters (roughly 30 seconds when spoken).
- Mention the target audience, key features, and visual style.
- Sound confident and professional, like a product launch teaser.
- End with a call to action.`
            },
            {
              role: 'user',
              content: `Living Brief:
- Target Audience: ${brief.targetAudience || 'general users'}
- Core User Flow: ${brief.coreUserFlow || 'browse and interact'}
- Visual Tone: ${brief.visualTone || 'modern and clean'}
- Key Features: ${(brief.mustHaveFeatures || []).join(', ') || 'interactive UI'}
- Platforms: ${(brief.platforms || ['web']).join(', ')}

Implementation Plan:
- Pages: ${(plan.pages || []).map(p => `${p.componentName} (${p.route}): ${p.description}`).join('; ')}
- Design Direction: ${plan.designDirection || 'custom branded experience'}`
            }
          ],
          temperature: 0.7,
          max_tokens: 300,
        });

        const script = response.choices[0]?.message?.content?.trim();
        if (script && script.length > 50) {
          return script;
        }
      } catch (err: any) {
        console.warn('Script generation via LLM failed, using template fallback:', err.message);
      }
    }

    // Template fallback
    const audience = brief.targetAudience || 'users';
    const features = (brief.mustHaveFeatures || ['interactive browsing']).slice(0, 3).join(', ');
    const tone = brief.visualTone || 'a modern, polished';
    const pageCount = (plan.pages || []).length || 3;

    return `Introducing a brand-new digital experience built for ${audience}. ` +
      `Featuring ${features}, this ${pageCount}-page application combines ${tone} design with seamless functionality. ` +
      `Every element was crafted by our multi-agent AI pipeline — from discovery to deployment — ensuring a premium, production-ready result. ` +
      `Explore the future of automated product creation. Try it now.`;
  }

  /**
   * Step 2: Record a Playwright screen walkthrough of the deployed site.
   * Reads the page list from the Implementation Plan (not hardcoded).
   */
  async recordWalkthrough(
    deployUrl: string,
    pages: { route: string; componentName: string; description: string }[],
    outputPath: string
  ): Promise<number> {
    const videoDir = path.dirname(outputPath);

    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
          dir: videoDir,
          size: { width: 1280, height: 720 },
        },
      });

      const page: Page = await context.newPage();

      // Determine pages to visit — from the Implementation Plan
      const pagesToVisit = pages.length > 0
        ? pages.map(p => p.route)
        : ['/'];

      const pausePerPage = Math.max(2000, Math.floor(28000 / Math.max(pagesToVisit.length, 1)));

      for (const route of pagesToVisit) {
        const fullUrl = route.startsWith('http')
          ? route
          : `${deployUrl.replace(/\/$/, '')}${route}`;

        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 10000 });
        } catch {
          // If page doesn't load, try domcontentloaded
          try {
            await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 5000 });
          } catch {
            // Skip this page
            continue;
          }
        }

        // Smooth scroll down to show content
        await page.evaluate(`
          new Promise((resolve) => {
            let scrolled = 0;
            const maxScroll = Math.min(document.body.scrollHeight, 800);
            const interval = setInterval(() => {
              scrolled += 100;
              window.scrollTo({ top: scrolled, behavior: 'smooth' });
              if (scrolled >= maxScroll) {
                clearInterval(interval);
                resolve();
              }
            }, 200);
          })
        `);

        await page.waitForTimeout(pausePerPage);
      }

      // Close context to finalize the video
      const videoFile = await page.video()?.path();
      await context.close();
      await browser.close();
      browser = null;

      // Move the video file to the expected output path
      if (videoFile && fs.existsSync(videoFile)) {
        fs.renameSync(videoFile, outputPath);
      }

      const totalDuration = Math.ceil((pagesToVisit.length * pausePerPage) / 1000) + 2;
      return Math.min(totalDuration, 60); // Cap at 60s
    } catch (err) {
      if (browser) {
        try { await browser.close(); } catch { /* ignore */ }
      }
      throw err;
    }
  }

  /**
   * Step 3: Synthesize voiceover via ElevenLabs TTS.
   * Returns false if no API key is configured (silent fallback mode).
   */
  async synthesizeVoiceover(script: string, outputPath: string): Promise<boolean> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey || apiKey === 'sk_a7e08ef3b45177d68e712fee504468c1506e3c2f3b307963' || apiKey.startsWith('your_')) {
      return false;
    }

    // Use the ElevenLabs REST API directly to avoid SDK version coupling
    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // "Sarah" — default natural female voice
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error');
      throw new Error(`ElevenLabs TTS failed (${response.status}): ${errText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, audioBuffer);
    return true;
  }

  /**
   * Step 4: Stitch screen recording + audio into a single MP4.
   * If no audio, overlays subtitle text from the script.
   */
  stitchVideo(
    screenPath: string,
    audioPath: string | null,
    script: string,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = ffmpeg()
        .input(screenPath)
        .outputOptions(['-c:v', 'libx264', '-preset', 'fast', '-crf', '23']);

      if (audioPath && fs.existsSync(audioPath)) {
        // Merge audio track
        command = command
          .input(audioPath)
          .outputOptions(['-c:a', 'aac', '-b:a', '128k', '-shortest']);
      } else {
        // Silent mode — burn subtitle text as a drawtext filter
        const sanitizedScript = script
          .replace(/'/g, "\u2019")  // smart quote to avoid ffmpeg escaping issues
          .replace(/\n/g, ' ')
          .substring(0, 200); // truncate for display
        command = command
          .outputOptions([
            '-vf',
            `drawtext=text='${sanitizedScript}':fontsize=18:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-60:enable='between(t,2,28)'`,
            '-an',
          ]);
      }

      command
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }

  /**
   * Fallback: generate a simple slate video (solid color + text) when Playwright is unavailable.
   */
  private generateSlateVideo(outputPath: string, script: string, durationSec: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const sanitizedText = script
        .replace(/'/g, "\u2019")
        .replace(/\n/g, ' ')
        .substring(0, 120);

      ffmpeg()
        .input('color=c=#161b22:s=1280x720:d=' + durationSec)
        .inputOptions(['-f', 'lavfi'])
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-pix_fmt', 'yuv420p',
          '-vf',
          `drawtext=text='${sanitizedText}':fontsize=22:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
          '-an',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) => reject(err))
        .run();
    });
  }
}
