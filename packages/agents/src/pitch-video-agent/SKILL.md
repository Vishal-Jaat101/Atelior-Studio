---
name: pitch-video-agent
description: Generates a ~30-second pitch video for a deployed project by recording a Playwright screen walkthrough of the core user flow, synthesizing a voiceover from the Living Brief via ElevenLabs TTS, and stitching both tracks into a single MP4 using FFmpeg.
---

# Pitch Video Agent Skill

The Pitch Video Agent produces an auto-generated demo/pitch video that showcases a deployed Atelier project. It is triggered **manually** by the user from the Review & Deploy screen — never automatically.

## Pipeline Steps

1. **Script Generation** — Uses the Nemotron LLM (or template fallback) to write a ~30-second voiceover script (~400–600 characters) summarizing what was built and why, sourced from the Living Brief and Implementation Plan.

2. **Screen Recording** — Uses **Playwright** (`playwright-core`, reusing the same browser automation stack as the QA Agent) to:
   - Launch a headless Chromium browser with video recording enabled via `page.video()`.
   - Navigate to the deployed project URL.
   - Walk through each page listed in `ImplementationPlan.pages` (read from DB, never hardcoded), pausing 3–4 seconds per page for visual clarity.
   - Save the resulting `.webm` screen capture.

3. **TTS Synthesis** — Calls the ElevenLabs API to convert the voiceover script into an MP3 audio file.
   - If `ELEVENLABS_API_KEY` is not set, the agent falls back to **silent mode** and burns subtitle captions into the video instead.

4. **Video Stitching** — Uses the existing `fluent-ffmpeg` + `ffmpeg-static` dependencies to merge the screen recording and audio track into a single `.mp4` output file. In silent mode, overlays subtitles from the script.

## Dependencies (all pre-existing or approved)

| Dependency        | Purpose                        | Pre-existing? |
|-------------------|--------------------------------|---------------|
| `openai`          | Nemotron LLM for script gen    | ✅ Yes        |
| `playwright-core` | Browser screen recording       | 🆕 New (approved) |
| `fluent-ffmpeg`   | Video processing / stitching   | ✅ Yes        |
| `ffmpeg-static`   | Static FFmpeg binary           | ✅ Yes        |
| `elevenlabs`      | Text-to-speech voiceover       | 🆕 New (approved, optional) |

## Execution Rules

- **Manual trigger only** — never runs automatically after deploy.
- **Core user flow is read from the Implementation Plan** — the list of pages/routes to walk through comes from `plan.pages`, not hardcoded values.
- **Graceful degradation** — works without ElevenLabs (produces silent video with subtitles).
- **Output format** — MP4, ~30 seconds, stored in `.tmp/pitch-videos/`.
