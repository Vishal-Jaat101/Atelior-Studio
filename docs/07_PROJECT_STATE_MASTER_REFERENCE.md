# Atelier — Master Project Reference

**Version 1.0** · Complete state of the project from concept to current build

This document exists so nothing about this project lives only in chat history. It covers the vision, every design decision made, the full build history in Antigravity, and — most importantly — an honest accounting of what's actually confirmed working versus what's only been claimed in a walkthrough.

## 1. The Original Vision

Atelier (working codename) is not a text-prompt-to-code generator. It's positioned as an Autonomous Digital Product Team — the product studio equivalent of Bolt.new/Lovable/v0/Cursor/Antigravity/Codex, but built around a different bet: that the winning move isn't generating faster, it's consulting first, building from real design/spatial assets, and refusing to ship anything that reads as generic AI output.

Four original pillars, refined to six across the doc set:

1. **Discovery Agent** — PM-style clarifying question loop before any code is written
2. **Design-to-Code Translation** — real Figma/screenshot ingestion, not guesswork
3. **3D & Immersive Asset Integration** — sourced (Sketchfab) and generated (text-to-3D) content
4. **End-to-End Execution** — plan → build → deploy with no infrastructure left to the user
5. **Design Quality Gate** (added) — an enforced anti-generic-design rubric, not a one-time style pass
6. **Self-Healing Reliability Loop** (added) — failures are caught and auto-fixed before they reach the user

Later expanded (see §3) into an 11-agent system: 1 Orchestrator ("brain") + 10 specialists, with real multi-modal intake (photos, video, PDF, PPT, docs) and a "Creative Divergence Engine" designed to produce genuinely varied output from a single sentence instead of one safe default.

**Explicit non-goal**, stated early and worth keeping visible: this project does not claim to "surpass all AI, current or future" — that framing was raised once and deliberately rejected in favor of concrete, buildable capability gaps being closed one at a time.

## 2. The Complete Document Set

| Doc | Contents |
|-----|----------|
| 01_PRD.md | Product requirements, competitive analysis (Bolt.new, Lovable, v0, Replit Agent, Antigravity/Cursor), all 6 pillars, user flows, NFRs, success metrics, phased roadmap, risks, "Next-Level Differentiators" brainstorm |
| 02_UX_FRONTEND_DESIGN.md | The Drafting Table design system (see §4), core screens, anti-generic design rubric, accessibility/motion rules, competitive UX teardown |
| 03_SYSTEM_ARCHITECTURE.md | Original 8-agent roster, Orchestrator "brain" decision logic (classify→score→graph→dispatch→judge→re-plan), reliability/failure handling, data model |
| 04_TECH_STACK.md | Full technology choices (see §5), build-order sequencing for Antigravity |
| 05_CAPABILITIES_SUMMARY_AND_NEXT_LEVEL.md | Plain-language capability map, worked example, next-level idea index |
| 06_ADVANCED_MULTI_AGENT_SYSTEM.md | Expansion to the 11-agent system, multi-modal ingestion spec, Creative Divergence Engine mechanism, new data models |
| 07_PROJECT_STATE_MASTER_REFERENCE.md | This document |

## 3. The 11-Agent System (Current Target Architecture)

| # | Agent | Role | Assigned Model Provider (target) |
|---|-------|------|----------------------------------|
| — | Orchestrator ("the brain") | Classifies/scores/sequences/dispatches all work; mediates cross-agent conflicts | N/A — coordination logic, not a single model |
| 1 | Discovery Agent | PM-style clarifying interview → Living Brief | Google AI Studio (Gemini Flash) |
| 2 | Ingestion Agent | Multi-modal intake — photos, video, PDF, PPT, docs → structured brief evidence | GitHub Models (vision-capable) — the priority fix, see §7 |
| 3 | Architect Agent | Living Brief → Implementation Plan + Task Graph | Mistral (Magistral, reasoning model) |
| 4 | Design Agent | Design tokens + anti-generic critique gate | Cohere (Command R+) |
| 5 | Divergence Agent | Generates 5 parallel creative directions on forced axes, critique-filters, selects top 2 | Groq (fast, ideal for parallel drafts) |
| 6 | 3D/Asset Agent | Sources (Sketchfab) or generates (text-to-3D) 3D content | Not yet built — see §7 |
| 7 | Frontend Coder Agent | Builds UI against tokens/plan | Mistral (Codestral/Devstral) |
| 8 | Backend Coder Agent | Builds data/API layer | Mistral (Codestral/Devstral) |
| 9 | QA / Self-Healing Agent | Type-check, lint, test, visual regression, auto-fix with bounded retries | Cerebras |
| 10 | Synthetic User-Testing Agent | Simulates persona-based walkthrough of live preview, pre-deploy | NVIDIA NIM (needs vision — see §7) |

Plus cross-cutting, non-core additions built during the "frontier" expansion:

- **Orchestrator Negotiation** — surfaces agent disagreements (e.g. Design vs. Architect scope/time conflicts) to the user instead of silently resolving them → Cloudflare Workers AI
- **Learning Agent** — batch job aggregating ProjectOutcomeSignal across all projects into LearnedPrior rows, fed back into Discovery/Divergence as soft priorities → OpenRouter
- **Growth Agent** — post-launch, risk-tiered experiment proposals (low-risk copy auto-launches at 10% traffic; medium/high-risk require approval) → Hugging Face Inference API
- **Pitch Video Agent** — auto-generates a 30-second walkthrough video (Playwright recording + TTS voiceover + FFmpeg stitching) on demand from the deploy screen

**The Creative Divergence mechanism**, specifically (why "one sentence → unexpected output" is a real mechanism, not a promise): generate 5 directions forced to differ on distinct axes (editorial, spatial, minimal, bold, outside-category-metaphor) → run each through the anti-generic critique gate independently → score survivors on distinctiveness and coherence with the brief → show the top 2, not just 1.

## 4. Design System — Two Systems, One Built, One Proposed

### Built and confirmed correct in the codebase: "Drafting Table"

- `ink-900 #161B22` (primary text/dark surface) · `paper-050 #F1EEE7` (light surface) · `blueprint-600 #28456B` (primary brand ink) · `pencil-400 #8A93A3` (secondary text) · `correction-500 #E8A33D` (single signature accent) · `verified-600 #2F6F6B` (success state)
- **Typography:** technical grotesk display (shipped as Space Grotesk) + humanist sans body (shipped as Plus Jakarta Sans) + monospace for data/annotations (JetBrains Mono)
- **Signature elements:** dot-grid canvas texture, corner registration marks, "spec marker" leader-line annotations — caution noted at build time: an early pass over-applied multiple spec markers per screen, violating the "one signature moment, not decoration throughout" rule; a screenshot to confirm this was corrected was requested but never delivered — status unverified.

### Proposed, not yet built: "Nocturne"

Raised as a deliberate pivot after feedback that the shipped UI felt generic/not premium despite correct tokens (a real distinction: matching a token spec and passing the anti-generic design gate are two different checks, and only the first had happened). Designed for "premium, trustworthy, mysterious," built to showcase 3D content as the actual hero element:

- `obsidian-950 #0B0D12` · `charcoal-900 #14171F` · `warm-white-050 #F2F0EC` · `antique-gold-500 #C9A227` (single signature accent) · `sapphire-700 #2B4C7E` (secondary/interactive)
- **Typography:** editorial serif display (Fraunces or Canela) + humanist sans body (Inter or Neue Montreal) + monospace for data

This is a full visual replacement, not a tweak, and has not been started. It's part of the still-pending "Stage H."

## 5. Tech Stack (As Specified — See §6 for What's Actually Running)

- **Frontend:** Next.js (App Router), TypeScript strict, Tailwind (custom tokens, not shadcn defaults), Radix primitives, Framer Motion, React Three Fiber (3D), Monaco Editor (code panel), Zustand, TanStack Query
- **Backend:** Bun runtime, Route Handlers (tRPC was specified but deferred for a plain-Next.js shortcut — flagged as a conscious tradeoff, not yet revisited), PostgreSQL via Neon + Prisma, Redis via Upstash + BullMQ
- **AI/Agent layer:** Originally specified as Claude (Sonnet 4.6 primary, Opus for hard reasoning); actually built on NVIDIA NIM/Nemotron, now mid-migration to a multi-provider router (§3, §7)
- **3D pipeline (specified, not yet built):** Sketchfab Data/Download API for sourcing (CC-licensed, attribution-enforced) + text-to-3D generation (Meshy/Tripo/Rodin-class APIs) for custom assets, glTF-Transform + Draco compression before embedding
- **Sandboxed execution:** WebContainers (primary) with microVM fallback for heavier workloads
- **Deployment:** Vercel/Cloudflare APIs, Supabase Auth default for generated projects
- **Repo structure:** Turborepo monorepo, /docs holding this doc set as living agent context, per-agent SKILL.md files mirroring Antigravity's own Skills pattern

## 6. Build History — Stage by Stage, What's Actually Been Built

| Stage | What it covers | Status |
|-------|---------------|--------|
| Skeleton | Bun workspace monorepo, Turborepo, Prisma+Neon, BullMQ+Upstash, design-system package, per-agent SKILL.md stubs, Next.js web app | Built |
| Discovery Agent v1 | Chip-based Q&A loop, Living Brief panel, Prisma persistence | Built, then caught as pure keyword-matching, not real LLM reasoning — corrected to call NIM/Nemotron with local rule-based fallback |
| Drafting Table UI pass | Dot-grid, registration marks, spec markers, collapsible sidebar | Built — see §4 caveat on marker over-application |
| Stage A | Ingestion Agent — multi-modal file intake (PDF/DOCX/PPTX/image/video), /api/ingest, upload dropzone | Built and tested with a real DOCX file; vision path for images was never confirmed real — see §7 |
| Stage B | Divergence Agent — 5 parallel design directions, critique-filtered, top-2 picker UI | Built and tested; direction-picker screen confirmed working |
| Stage C | Orchestrator Negotiation (conflict banner + resolution) + Synthetic User-Testing Agent | Built and tested end-to-end with a real usability critique report generated |
| Stage D | Coder Agents (Schema/Backend/Frontend), BullMQ DAG execution, Cross-Project Learning Layer | Built; E2E script confirmed ProjectOutcomeSignal/LearnedPrior populating and influencing a new project's question order; a Redis WRONGPASS error surfaced during this stage and was patched with a lazy-proxy connection pattern |
| Stage E | QA Agent + self-healing loop (2-retry cap) + Deployment Engine + Growth Agent + ExperimentVariant risk-tiering | Plan approved; build passed after fixing a missing `<motion.div>` wrapper and a Prisma JsonValue type error |
| Stage F | Auto-Generated Pitch Video (Playwright recording + TTS + FFmpeg stitch) | Built; shipped using ElevenLabs despite an earlier decision to default to OpenAI TTS / silent fallback — this is an unresolved inconsistency, see §8 |
| Stage G | Critical fixes: Architect transaction-timeout bug, brief-edit bug, test-data cleanup, page.tsx refactor into 9 components | Refactor and cleanup confirmed; transaction fix and brief-edit fix were only "verified," not proven with a diff — unconfirmed, see §8 |
| Stage G.5 | Multi-provider model router (8 free-tier providers replacing single-vendor NIM dependency) | Router code built; .env confirmed still has zero new provider keys and the NIM model string is still the deprecated one — see §7, this is the most urgent open item |
| Stage H | 3D/Asset Agent, Atelier landing page, "Nocturne" visual identity | Not started |

## 7. The Most Important Open Facts Right Now

1. **NIM_MODEL_NAME in .env is still `nvidia/llama-3.1-nemotron-70b-instruct`** — the confirmed-deprecated, text-only model. This was independently verified by inspecting the actual file, not by trusting a walkthrough. Every agent is currently running on this one model regardless of what the router code does, because no other provider keys exist yet. **Fix:** replace with a current Nemotron 3 model ID copied directly from build.nvidia.com — takes minutes, costs nothing, and is the single highest-priority action item in this entire project.

2. **None of the 8 new provider accounts** (Google AI Studio, GitHub, Mistral, Cohere, Groq, Cerebras, Cloudflare, Hugging Face) have confirmed keys in .env. The multi-provider router exists in code but is not yet live in practice.

3. **The Ingestion Agent's vision capability has never been confirmed real.** The original text-only Nemotron model cannot process images at all — meaning early "image classification" results were fabricated or silently falling back. The fix (routing Ingestion through a vision-capable provider) was specified but the last walkthrough's list of "agents wired to the router" did not include Ingestion by name — unconfirmed whether this actually happened.

4. **The Architect Agent transaction-timeout fix and the Living Brief edit-save bug** were both reported "fixed" without a diff or reproduction proof. Standing request, still open: see the actual code change, not a description of one.

## 8. Other Confirmed Bugs and Their Status

| Issue | Status |
|-------|--------|
| Design tokens initially shipped as generic violet/glassmorphism, not the Drafting Table spec | Fixed and confirmed against literal hex values |
| .gitignore was ignoring bun.lockb and /prisma/migrations/ (should be committed) | Fixed and confirmed |
| DATABASE_URL not loading in apps/web (Next.js doesn't read root-level .env in a monorepo) | Fixed via a custom loader in next.config.ts |
| Raw Prisma/Turbopack stack traces rendering directly in the UI on error | Fix requested; status not reconfirmed since |
| Bun EPERM install errors on Windows (Defender/file-locking) | Worked around repeatedly; root cause (Windows file locking) likely still present — a permanent Defender exclusion was recommended but never confirmed done |
| Package-manager thrashing incident — agent tried Bun→npm→pnpm→npm(pinned fake versions)→pnpm in sequence, corrupting internal workspace version specifiers ("*" → "0.1.0") | Reverted per instruction; final clean state not independently reconfirmed |
| Upstash Redis TCP connection string — port and password were assembled by guessing rather than reading the actual TCP tab | Flagged; never confirmed corrected against the real console value |
| Redis WRONGPASS error during Stage D | Patched with lazy-proxy Redis connection pattern; build passed after |
| Unauthenticated /api/debug-cleanup data-deletion route | Created, used once, then deleted — confirmed |
| page.tsx monolith (~2,600 lines) | Refactored into 9 typed components, confirmed |
| TTS vendor: OpenAI TTS was the agreed default over ElevenLabs due to cost sensitivity | Inconsistent — Stage F shipped using ElevenLabs anyway; needs an explicit decision, not another silent default |

## 9. Immediate Next Steps, In Order

1. **Replace the deprecated NIM_MODEL_NAME value** with a real current Nemotron 3 model ID (2 minutes, $0, closes the biggest reliability risk in the project).
2. **Get direct proof** — actual code, not description — that Ingestion Agent sends real image data to a vision-capable endpoint.
3. **Create the GitHub Models account first** (highest-impact of the 8 pending providers, since it's tied to the vision fix); the other 7 in whatever order is convenient.
4. **Resolve the Pitch Video TTS vendor question explicitly** — approve ElevenLabs's free tier or force the silent/subtitle fallback — don't leave it ambiguous.
5. **Get the Architect transaction-fix and brief-edit-fix diffs**, confirmed by actually reproducing both bugs and watching them not happen.
6. **Only after 1–5:** begin Stage H (3D/Asset Agent, landing page, Nocturne visual identity) — this is genuinely new, unbuilt scope, not a fix.
