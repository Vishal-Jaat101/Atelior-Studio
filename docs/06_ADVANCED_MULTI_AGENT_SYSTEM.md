# Advanced Architecture Addendum
## Atelier — The 11-Agent System: 1 Brain + 10 Specialists, Full Multi-Modal Intake, and the Creative Divergence Engine

**Version 0.1** · Extends 03_SYSTEM_ARCHITECTURE.md

This doc does three things: expands the agent roster to exactly the shape you asked for (one orchestrating brain, ten specialists), specifies real multi-modal ingestion (photos, video, PDFs, PPTs, PRDs, docs), and defines a concrete mechanism for getting genuinely unexpected output from a single sentence — not by claiming magic, but by deliberately engineering for creative variance instead of defaulting to the first safe answer.

## 1. The Brain — Unchanged in Kind, Expanded in Scope

The Orchestrator from 03_SYSTEM_ARCHITECTURE.md §3.1 is still the one brain. Nothing about what it is changes — it's still the classify → score → graph → dispatch → judge → re-plan loop. What's new is that it now has more specialists to route to, more input formats to classify, and one new responsibility: mediating disagreement between agents instead of only routing single-agent tasks.

**New Orchestrator responsibility — Cross-Agent Negotiation:** when two agents produce conflicting outputs against the same constraint (e.g., the Design Agent wants three more refinement passes for fidelity, the Architect Agent flags that this breaks the time budget), the Orchestrator doesn't silently pick a winner. It surfaces the tradeoff to you as a short, plain-language decision point — "Design wants more polish, Architect wants to ship faster — which matters more for this launch?" — and routes the answer back into both agents' constraints. This is the mechanism that makes an 11-agent system trustworthy instead of chaotic: more agents means more opinions, and opinions need a referee, not a coin flip.

## 2. The Ten Specialists

| # | Agent | Role | Primary Input | Primary Output |
|---|-------|------|---------------|----------------|
| 1 | Discovery Agent | PM-style clarifying interview | Text prompt + ingested docs (§3) | Living Brief |
| 2 | Ingestion Agent (new) | Multi-modal intake — parses photos, video, PDFs, PPTs, PRDs into structured brief evidence | Any uploaded file | Structured evidence merged into Living Brief |
| 3 | Architect Agent | Converts brief into build plan | Living Brief | Implementation Plan + Task Graph |
| 4 | Design Agent | Token system + anti-generic gate | Implementation Plan, ingested brand refs | Design Tokens |
| 5 | Divergence Agent (new) | Generates and tournament-selects multiple creative directions (§4) | Design brief + Design Tokens draft | Selected/blended concept direction |
| 6 | 3D/Asset Agent | Sources or generates 3D content | Brief + Design Tokens | Optimized glTF/GLB assets |
| 7 | Frontend Coder Agent | Builds UI against tokens/plan | Implementation Plan, Design Tokens | Frontend code (sandboxed, running) |
| 8 | Backend Coder Agent | Builds data/API layer | Implementation Plan | Backend code (sandboxed, running) |
| 9 | QA / Self-Healing Agent | Type-check, test, visual regression, auto-fix | Live sandbox build | Pass/fail + auto-fixed code |
| 10 | Synthetic User-Testing Agent (new) | Simulates real visitors from the brief's audience description against the live preview, before deploy | Live sandbox + audience profile from brief | Usability critique report |

(Deployment stays a function the Orchestrator dispatches directly to infra APIs rather than a full "agent" — provisioning/DNS/rollback is closer to a tool call than a reasoning task, so it doesn't need its own model-backed agent. If you want it as a formal 11th specialist with the Orchestrator as a 12th/meta role instead of the 1 brain, that's a one-line change — the roster is deliberately built so it can flex by ±1 without restructuring anything else.)

Three of these ten are genuinely new versus the original roster: the Ingestion Agent (multi-modal intake), the Divergence Agent (creative variance — §4), and the Synthetic User-Testing Agent (pre-deploy usability simulation, the most technically real of the "frontier" ideas from our last exchange). The rest are the original seven, unchanged.

## 3. Multi-Modal Ingestion — Concretely, Format by Format

The Ingestion Agent's job: turn anything you hand it into structured evidence for the Living Brief, so the Discovery Agent asks fewer, sharper questions instead of the same fixed list regardless of what you already gave it.

| Format | What actually happens | What it fills in the Brief |
|--------|----------------------|---------------------------|
| Photos | Vision analysis on each image. Product photos are tagged as 3D-generation reference material (routed to the 3D/Asset Agent's generation path). Mood-board/inspiration photos are analyzed for color, texture, and composition cues. Screenshots of competitor sites are treated as design benchmarks, not copied, but used to calibrate tone. | Visual Tone, 3D Features, Competitive Reference |
| Video | Sampled into keyframes at regular intervals + full audio transcription. A product demo video yields both the spoken narration (intent, feature list) and the visual flow (what the UI/product actually looks like in motion). A pitch-recording video is treated like an audio PRD. | Core User Flow, Must-Haves, Audience (from narration) |
| PDF | Text and table extraction, plus embedded images processed the same way as standalone photos. A PDF that is a PRD is parsed for structured requirement sections (scope, user stories, non-functional requirements) directly into the matching Brief fields, not treated as unstructured prose. | Directly maps requirement sections → Brief fields |
| PPT / slide decks | Slide-by-slide extraction: text content per slide, plus each slide's visual layout treated as a design reference (a pitch deck's brand slide is a strong design-direction signal — often stronger than a text description). | Visual Tone, Brand assets, Must-Haves |
| Word/Docs | Same structured-text extraction as PDF; if headings match common PRD sections (Problem, Users, Requirements, Success Metrics), map directly; otherwise treat as free-form context for the Discovery Agent to reason over. | Any/all Brief fields depending on content |

The key behavioral rule: the more evidence the Ingestion Agent extracts with high confidence, the shorter the Discovery Agent's question loop gets — if you upload a real PRD, Atelier should ask you almost nothing before proposing an Implementation Plan, because the work of answering was already done in the document. If you give one sentence and nothing else, the question loop runs in full. This makes "upload everything" and "just type a sentence" both first-class paths into the same system, not two different products.

**Honesty note on what's real today vs. harder:** photo/PDF/PPT extraction and video-frame + transcription pipelines are all buildable now with existing tools (vision-capable models for images/slides, off-the-shelf speech-to-text for audio, PDF/PPT parsing libraries for structured text). Nothing in this table requires a technology that doesn't exist. It's genuinely ambitious as a product surface — very few builders accept this range of input today — but it's an integration and engineering effort, not a research problem.

## 4. The Creative Divergence Engine — How a Single Sentence Produces Something Unexpected

This is the direct answer to "even if I just give a normal sentence it should create something outstanding no one can expect." The honest mechanism, not a magic claim:

**The problem with a single model call from a single sentence:** an LLM asked to design something from minimal input will, by default, converge on the statistically most likely / safest interpretation — which is precisely what produces the generic output the UX doc is designed to catch. One call, one direction, regression to the mean.

**The fix is structural, not a smarter prompt:**

1. **Generate N=5 genuinely divergent concept directions in parallel**, not five small variations of one idea — the Divergence Agent is explicitly prompted to make each direction differ on a different axis (one leans editorial/typographic, one leans spatial/3D-forward, one leans minimal/restrained, one leans bold/maximalist, one intentionally borrows a metaphor from outside the product's own category — e.g., designing a finance app's dashboard around a weather-map visual language instead of the expected chart-and-card pattern).
2. **Run each through the anti-generic critique pass independently** (per the UX doc's rubric) — directions that collapse into a known default get eliminated here, before you ever see them.
3. **Score survivors on distinctiveness and coherence with the actual brief** — the goal isn't "weirdest wins," it's "most specific-to-this-idea wins." A direction that's unusual but doesn't fit a vintage sneaker marketplace gets cut even if it's visually striking.
4. **Show you the top 2, not just 1**, with a one-line rationale for each, and let you pick or ask for a blend — this is also where the Orchestrator's negotiation mechanism (§1) is useful: if the Design and Divergence agents disagree about which survivor is stronger, that disagreement surfaces to you instead of being silently resolved.

This is what actually produces "no one could have expected that" output from one sentence: not a bigger model, but a process that refuses to stop at the first idea — generate wide, filter hard, then commit. It's the same brainstorm-critique-refine principle already in the UX doc, deliberately scaled from "one direction, self-checked" to "five directions, competitively filtered."

## 5. Data Model Additions

```
SourceDocument
 ├─ type (photo | video | pdf | pptx | docx)
 ├─ extractedContent (structured JSON: text, tables, detected sections)
 ├─ derivedBriefFields (which LivingBrief fields it populated, and confidence)
 └─ linkedAssets (photos/frames routed to the 3D/Asset Agent, if any)

ConceptVariant
 ├─ projectId
 ├─ axis (e.g. "editorial", "spatial", "outside-category-metaphor")
 ├─ passedCritiqueGate (bool)
 ├─ distinctivenessScore / coherenceScore
 └─ status (survivor | eliminated | selected)

AgentNegotiation
 ├─ taskId
 ├─ agentsInvolved
 ├─ conflictSummary (plain language)
 ├─ userDecision
 └─ resolvedAt
```
