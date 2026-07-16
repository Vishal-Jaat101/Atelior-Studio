# Product Requirements Document (PRD)
**Codename:** Atelier — an Autonomous Digital Product Team  
**Version:** 0.1 · Draft for build planning in Antigravity IDE · July 2026

"Atelier" is a working codename (French for "workshop/studio") — it signals a team of specialists, not a text box. Rename freely; every doc in this set uses it as a placeholder.

---

## 1. Executive Summary
Atelier is an AI platform that behaves like a small, senior digital product studio rather than a code-generation text box. Where today's AI builders (Bolt.new, Lovable, v0, Replit Agent) optimize for speed from prompt to running app, Atelier optimizes for correctness of what gets built and quality of the final surface — by interrogating the idea before writing code, ingesting real design artifacts, embedding real 3D/spatial content, and refusing to hand back a broken or generic-looking result.

Four pillars define the product:
1. **Discovery Agent** — a clarifying-question loop that behaves like a product manager, not an order-taker.
2. **Design-to-Code Engine** — ingests Figma files (or screenshots) and produces pixel-faithful, responsive code, not an approximation.
3. **Immersive Asset Layer** — sources, licenses, optimizes, and embeds interactive 3D (`.glb`/`glTF`) content from Sketchfab and other libraries.
4. **End-to-End Execution** — architecture, build, self-healing QA, and one-click deployment, with no infrastructure left for the user to configure.

A fifth pillar, added in this refinement, is what actually differentiates Atelier from the current market: a **Design Quality Gate** — every generated surface is checked against an explicit "does not look AI-generated" rubric before it reaches the user, and a **Self-Healing Reliability Loop** that means a broken build is treated as an internal agent failure to recover from, not a result the user has to debug.

---

## 2. Problem & Opportunity
Reviewing the current generation of AI builders as of mid-2026:
* **Bolt.new (StackBlitz)** runs on WebContainers, supports Figma import and an agentic error-recovery loop, and has pushed hard into "Bolt Cloud" for hosting/DB — but it is fundamentally reactive: you prompt, it builds, and design fidelity depends on how well you structure your Figma frames.
* **Lovable** has the most mature agent/plan-mode split (Plan Mode reasons and asks clarifying questions before Agent/Build Mode writes code) and Visual Edits for click-to-modify UI — but it has no native 3D/immersive layer, and its output — like most of the category — defaults to recognizable shadcn/Tailwind patterns.
* **v0 (Vercel)** has the best design-to-code fidelity via its Figma integration (extracts real tokens, not just a screenshot) but is scoped to component/page generation, not full product delivery, and has no discovery phase or 3D layer.
* **Replit Agent** offers language-agnostic, glass-box code generation with strong autonomy, but is developer-facing and not oriented around design fidelity or asset richness.
* **Google Antigravity and Cursor** are IDE-layer agentic tools (excellent for the "how do I build this" problem) but are not product-builder platforms — they don't do market-facing discovery, design import, or deployment for non-technical founders.
* **OpenAI Codex** is a strong autonomous coding agent, again IDE/CLI-facing, not a product studio.

**The gap:** nobody combines (a) an upfront discovery/consultation phase, (b) high-fidelity design ingestion, (c) a 3D/immersive asset pipeline, and (d) a hard quality bar against "looks AI-generated," in one workflow. Most tools compress time-to-first-preview; none of them compress time-to-something-a-paying-customer-would-trust.

---

## 3. Vision & Positioning
Atelier turns a rough idea into a product a design agency would be proud to have shipped — by consulting first, building with real design and spatial assets, and refusing to ship anything that reads as a generic AI output.

**Positioning statement:** For non-technical founders and lean teams who want agency-grade digital products without hiring an agency, Atelier is an autonomous product team — unlike Bolt, Lovable, or v0, which generate from a prompt and hope, Atelier interviews you like a PM, builds from your real designs and 3D assets, and self-corrects until the result passes a professional quality bar.

---

## 4. Target Users & Personas
| Persona | Description | Primary Need |
| :--- | :--- | :--- |
| **Non-technical founder** | Has validated an idea, no engineering team | A live, credible product to show investors/users without hiring |
| **Indie hacker / solo developer** | Can code, but wants 10x leverage on scaffolding, design, and 3D work they're not fast at | Speed without sacrificing polish |
| **Design agency / freelancer** | Sells "premium" web experiences to clients | A tool that turns their Figma files into real, deployed products without an eng handoff |
| **Product manager (enterprise/startup)** | Needs to validate a feature or flow before committing eng resources | Fast, faithful prototypes that don't look like throwaway mockups |

---

## 5. Competitive Landscape (Summary Table)
| Capability | Bolt.new | Lovable | v0 | Replit Agent | Antigravity/Cursor | Atelier |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Clarifying PM discovery phase** | Prompt enhancer only | Plan Mode (partial) | No | No | No (dev-facing) | **Yes** — structured PM interview |
| **Figma → code fidelity** | Frame-based import | No native Figma | Best-in-class token extraction | No | No | **Token extraction + vision fallback** |
| **Native 3D/immersive embedding** | No | No | No | No | No | **Yes** — Sketchfab-sourced & text/image-to-3D generated |
| **Self-healing build loop** | Yes (v2 agent) | Yes (Agent Mode) | N/A (component-scope) | Yes | Partial (staged approval) | **Yes** + visual-regression gate |
| **Explicit "anti-AI" design gate** | No | No | No | No | No | **Yes** — enforced design-token + critique pass |
| **One-click deploy & custom domain** | Yes | Yes | Via Vercel | Yes | No | **Yes** |
| **Target user** | Prototypers | Non-technical founders | Frontend devs | Developers | Professional engineers | **Non-technical founders + agencies + devs** |

---

## 6. Product Pillars & Detailed Requirements

### Pillar 1 — Discovery Agent (Clarifying Question Loop)
* **User story:** As a founder with a vague idea, I want the AI to ask me the right questions before building, so I don't get a generic result I have to redo.
* **Requirements:**
  * On a new project, the Discovery Agent parses the initial prompt and identifies ambiguity across: target audience, core user flow, must-have vs. nice-to-have features, visual tone/brand references, data model complexity, and platform target (web/mobile/both).
  * Questions are asked in short batches (1–3 at a time), using quick-select chips for closed questions and free text for open ones — never a single wall of 10 questions.
  * The agent maintains a visible, editable living brief (a structured PRD-lite) that updates as questions are answered; the user can jump in and edit it directly rather than only answering via chat.
  * The loop ends when the agent proposes an Implementation Plan (scope, pages, data model, integrations, design direction) that the user explicitly approves before any code is generated — mirroring the "propose plan → confirm → execute" trust pattern.
* **Acceptance criteria:** A user with a 10-word prompt ("a marketplace for vintage furniture") reaches an approved Implementation Plan within 5 conversational turns or fewer for an MVP-scope project.

### Pillar 2 — Design-to-Code Translation
* **User story:** As a designer, I want to hand Atelier my Figma file and get code that actually looks like my design, not a reinterpretation.
* **Requirements:**
  * Support two ingestion modes: (a) Figma link + token extraction (colors, spacing, type scale, component structure) for structured fidelity, and (b) image/screenshot fallback with vision-model layout parsing for cases without clean Figma access.
  * Large designs are automatically decomposed into per-component/per-frame generation passes (nav, hero, forms, cards) rather than one monolithic generation, improving fidelity.
  * Generated components map to the platform's own design-system primitives (not a raw one-off recreation each time), so iteration stays consistent.
  * A fidelity score (structural diff between source design and rendered output) is shown to the user, with one-click "tighten fidelity" re-passes on low-scoring sections.

### Pillar 3 — 3D & Immersive Content: Sourced and Generated
* **User story:** As a founder building a product page, I want an interactive 3D model embedded, not another static hero image — and if it's my own product, I want a model of my product, not a generic stand-in.
* **Requirements:**
  * Natural-language or visual search against Sketchfab's catalog (e.g., "find a rotating sneaker model") using the Sketchfab Data API, filtered by default to Creative-Commons-licensed, downloadable models only.
  * Automatic attribution insertion (author + license) wherever a sourced model is embedded.
  * Native generation as a first-class path: when no existing library asset is a good enough match — or the request is inherently custom ("a 3D model of our ceramic mug", "a low-poly mascot") — the platform generates an original 3D asset from a text description or an uploaded reference photo via a text-to-3D/image-to-3D model, rather than forcing the user to accept a generic substitute.
  * The agent decides source-vs-generate automatically based on match quality and brief specificity, providing full transparency to the user.
  * Retrieved or generated glTF/GLB assets are auto-optimized (compression, texture downscaling, LOD generation, re-centering/scale normalization) before embedding, and lazy-loaded.
  * Embedding renders via lightweight `<model-viewer>` for simple viewers, and React Three Fiber for interactive/animated scenes.
  * The agent proactively suggests 3D placement where it improves the product.

### Pillar 4 — End-to-End Execution
* **User story:** As a non-technical founder, I want to go from idea to a live URL without touching a terminal, a cloud console, or a DNS setting.
* **Requirements:**
  * Full pipeline: brief → architecture plan → parallel build (frontend/backend/design/3D) → automated QA → one-click deploy → custom domain.
  * Every generated project ships with hosting, a managed database, auth, and (optionally) payments pre-wired, matching the "batteries included" bar.
  * Users can export the full source at any time (no lock-in).

### Pillar 5 — Design Quality Gate (New)
* **User story:** As anyone shipping a customer-facing product, I don't want it to look like it came out of an AI builder.
* **Requirements:**
  * Before any UI is presented, it passes an internal anti-generic-design critique pass: checking for templated patterns (default color pairings, default type pairing, decorative-only structure, over-animated pages) and flagging/re-generating sections that fail.
  * A design brainstorm-and-critique loop runs before code generation: the Design Agent proposes a token system (color, type, layout, one signature element), critiques it against known generic patterns, and only proceeds once the plan is judged distinctive and appropriate.

### Pillar 6 — Self-Healing Reliability Loop (New)
* **User story:** As a user, if something breaks during generation, I want it fixed automatically, not handed to me as an error.
* **Requirements:**
  * Every code change passes automated gates before reaching the live preview: type-check, lint, unit tests where applicable, and a headless browser smoke test.
  * On failure, the responsible agent reads the error/stack trace and retries with a bounded budget (e.g., 3 attempts) before escalating to the user.
  * A visual regression check compares rendered output against the approved design spec/screenshot on every change, flagging unintended visual drift.
  * Full task/version history is kept so any step can be rolled back without cascading breakage.

---

## 7. Key User Flow (End-to-End)
1. User enters an idea (text, optionally + Figma link/screenshots/reference sites).
2. Discovery Agent asks 2–4 rounds of targeted questions; living brief updates in real time.
3. User approves an Implementation Plan (scope, pages, data model, design direction, whether 3D content applies).
4. Design Agent proposes a design token system; runs it through the anti-generic critique; user can nudge direction.
5. Build phase: frontend, backend, and 3D/asset agents work in parallel on a task graph; user watches live progress (task list + streaming preview).
6. Self-healing QA loop runs continuously; user sees a pass/fail status per task, not raw logs.
7. User reviews the live preview, leaves inline comments on specific elements (click-to-comment, not just chat), and requests changes — looping back to step 5 for affected scope only.
8. One-click deploy to a production URL with a custom domain; ongoing edits after launch follow the same loop.

---

## 8. Non-Functional Requirements
* **Performance:** First live preview within 60 seconds of an approved plan for a standard MVP scope; Lighthouse performance score ≥ 90 on generated marketing pages by default.
* **Reliability:** Self-healing loop must resolve ≥ 80% of build errors without human intervention.
* **Accessibility:** WCAG 2.1 AA by default on all generated UI — visible focus states, semantic landmarks, color contrast — enforced as a gate.
* **Security:** Sandboxed, isolated execution per project; no cross-tenant data or secret leakage; secrets never exposed to client-side code.
* **Portability:** Full code export at any project stage.
* **Licensing compliance:** 3D assets restricted by default to properly licensed sources with attribution enforced automatically.

---

## 9. Success Metrics
| Metric | Target (12 months post-launch) |
| :--- | :--- |
| **Time from prompt to approved plan** | < 5 minutes median |
| **Time from approved plan to live URL** | < 20 minutes median for MVP-scope projects |
| **Self-healing resolution rate** | ≥ 80% (errors fixed without human help) |
| **Pass rate of internal "distinctive design" rubric** | ≥ 70% on first pass |
| **3D asset layer utilization rate** | ≥ 30% of projects |
| **30-day project retention** | ≥ 50% (user returns to iterate) |

---

## 10. Roadmap / Scope Phasing

### Phase 1 — MVP (Core Loop, Web Only)
* Discovery Agent, text + screenshot design ingestion, basic Sketchfab 3D embedding, single-agent sequential build (not yet parallelized), self-healing loop v1 (retry + type/lint gates), one-click deploy to subdomain.

### Phase 2 — Fidelity & Scale
* Native Figma token extraction, parallel multi-agent build graph, visual regression gate, custom domains, payments/auth templates, design critique rubric fully automated.

### Phase 3 — Platform
* Mobile (React Native/Expo) export target, team collaboration, versioned design system per account, enterprise SSO/compliance, plugin/MCP marketplace for third-party tool integration.

---

## 11. Risks & Mitigations
* **Risk: Discovery loop feels like friction.**  
  * *Mitigation:* Allow "skip to build with defaults" escape hatch at every step; keep rounds short.
* **Risk: Design-to-code fidelity gap (Figma API limits).**  
  * *Mitigation:* Dual-path ingestion (token extraction + vision fallback); show fidelity score transparently.
* **Risk: 3D assets add page weight / hurt performance.**  
  * *Mitigation:* Enforced compression pipeline + lazy loading + performance budget gate.
* **Risk: Self-healing loop masks real, recurring bugs.**  
  * *Mitigation:* Cap retries, log root causes, surface a "recurring issue" pattern report to the engineering team.
* **Risk: Category is crowded and fast-moving.**  
  * *Mitigation:* Differentiate on the combination (discovery + design fidelity + 3D + quality gate), not raw generation speed.
* **Risk: Licensing/legal exposure from 3D asset sourcing.**  
  * *Mitigation:* Default to CC-licensed + attribution-enforced sources only; block paid/restricted assets by default.

---

## 12. Next-Level Differentiators (Post-Phase-3 Brainstorm)
1. **Brand Identity Agent:** Generates logo marks, favicon, and a coordinated image set alongside design tokens.
2. **Growth/Analytics Agent:** Watches real post-launch traffic and proposes specific, data-backed changes.
3. **Competitive Research Sub-step:** Scans named competitor sites during Discovery to sharpen the first plan.
4. **Voice-First Discovery Mode:** Lets the clarifying-question loop happen by voice.
5. **Localization Agent:** Auto-translates and culturally adapts copy/layout for new markets.
6. **Continuous "Digital Employee" Mode:** An always-on agent that keeps content fresh post-launch, with human approval.
7. **Multiplayer Live Collaboration:** Multiple humans and agents on one project simultaneously.
8. **User-Facing "Trust Slider":** Exposes autonomy levels (autonomous/collaborative/supervised) as a control.
9. **Plugin/MCP Marketplace:** Lets third parties add new specialist agents as installable tools.

---

## 13. Out of Scope (v1)
* Native mobile app builds, offline/on-device generation, multiplayer real-time collaboration on the canvas, enterprise compliance certifications (SOC 2 etc.) — planned but explicitly deferred past MVP.
