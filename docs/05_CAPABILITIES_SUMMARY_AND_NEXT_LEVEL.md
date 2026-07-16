# Complete Capabilities Summary
**Atelier** — What It Does, How It Thinks, and Where It Can Go Next  
**Version:** 0.1 · Companion to the PRD, UX/Frontend, Architecture, and Tech Stack docs

This doc exists to answer three things directly: can it make its own 3D content or only find existing ones, does it have "its own brain" deciding who does what, and what does the whole system do, end to end, in plain language.

---

## 1. Short Answer to Both Questions
* **3D Content — both, by design.** Atelier isn't limited to "search a library and hope something matches." The 3D/Asset Agent tries Sketchfab first for a fast, cheap match; if nothing fits — or the brief is inherently custom (your specific product, a brand mascot, something with no real-world stock equivalent) — it generates an original 3D model from scratch, from a text description or a photo you upload, using text-to-3D/image-to-3D generation models (detailed in §4 of the Architecture doc and the Tech Stack doc). So "make this a 3D website for my sneaker brand" genuinely produces a model of your sneaker, not a generic stand-in.
* **Yes, it has a "brain" — but it's not one model, it's a supervisor.** The Orchestrator is the closest thing to a central brain: it doesn't write code or design anything itself, it decides who works on what, in what order, with how much freedom, and when to check with you. That decision logic is concrete and repeatable (§3 of the Architecture doc), not a vague "the AI figures it out." This is what makes the system refinable — you can see exactly which step to improve when something goes wrong, instead of debugging one giant undifferentiated model call.

---

## 2. What Atelier Is, in One Paragraph
Atelier is an AI product studio, not a code generator. You describe an idea; a Discovery Agent interviews you like a product manager before anything is built; an Architect Agent turns your answers into an explicit, approvable plan; then a team of specialist agents — design, frontend, backend, and 3D — build against that plan in parallel inside a live sandbox; a QA agent catches and self-heals problems before you ever see them; and a Deployment Agent ships the result to a real URL. Every stage produces something you can read and approve, not a black box you have to trust blindly.

---

## 3. The "Brain": How Tasks Get Assigned (Plain-Language Version)
Think of it less like "asking an AI" and more like a small studio's project manager running the same six-step loop on every piece of work, all day:
1. **Classify** — what kind of task is this? (design, frontend code, backend code, 3D content, copywriting, QA)
2. **Score it** — how complex and how risky is it? (touches payments/auth = higher risk; a static content block = low risk)
3. **Sequence it** — what does it depend on? Independent tasks (like "generate the 3D hero model" and "build the auth flow") run at the same time, in separate sandboxes; dependent tasks (like "checkout page" needing the data model first) wait their turn.
4. **Hand it off** — send it to the one specialist agent built for that task type, with only the information that task actually needs.
5. **Check the work** — don't just trust "I'm done" from the agent; run it through independent automated checks (does it compile, does it look right, does it pass tests).
6. **Adjust the plan if something surprising comes up** — if a task reveals the original plan was wrong somewhere, go back and fix the plan itself, rather than letting agents quietly disagree with each other.

This loop is what decides, for example: is this task simple enough to run on a fast model with no check-in, or important/risky enough that it should pause and ask you first? That's the "how it can" behind "how it can assign tasks to different agents so the work is refined" — it's a repeatable procedure, which is exactly what lets you (or Antigravity, building this) improve it piece by piece instead of it being one opaque decision.

---

## 4. Complete Capability Map

### 4.1 Discovery & Planning
* Asks targeted clarifying questions in small batches (chips for closed questions, free text for open ones) instead of one long form.
* Maintains a live, user-editable brief you can correct directly, not just through more chat.
* Produces an explicit Implementation Plan (pages, data model, integrations, design direction) that you approve before anything is built.

### 4.2 Design
* Ingests real Figma files (token/structure extraction) or screenshots (vision-based fallback) for design-to-code.
* Proposes a genuinely distinctive design token system per project (color, type, layout, one signature element) and self-critiques it against known generic AI-design patterns before building — this is the mechanism behind "shouldn't look AI-generated," not a one-time style choice.
* Enforces accessibility (contrast, focus states, semantics) as a hard gate.

### 4.3 3D & Immersive Content
* Searches and embeds licensed, attributed 3D models from Sketchfab.
* Generates original 3D models from text or an uploaded photo when nothing suitable exists or the brief calls for something custom-specific.
* Auto-optimizes any 3D asset (compression, re-centering, LOD) and lazy-loads it so it never slows down the page.
* Chooses the right embed technology automatically (simple viewer vs. fully interactive scene).

### 4.4 Building
* Runs multiple coder agents in parallel against a shared design system and data model, inside a live, isolated sandbox so code is continuously running, not just generated.
* Self-heals: reads real errors and fixes them automatically, within a bounded retry budget, before anything reaches you as "broken."
* Runs a visual-regression check so a change that's technically working but visually wrong gets caught before you see it.

### 4.5 Review & Iteration
* Click-to-comment directly on the live preview to request a change, instead of re-describing it from scratch in chat.
* Plain-language changelog before every deploy ("Added checkout page. Fixed a broken image link.").
* Full version history — any step (a bad design pass, a bad deploy) can be rolled back independently.

### 4.6 Deployment & Operations
* One-click deploy to a live URL with a custom domain, database, auth, and (optionally) payments pre-wired.
* Full code export at any time — no lock-in.

---

## 5. Worked Example: "Build me a 3D website for my sneaker brand"
1. **Discovery Agent asks a few quick questions:** Who's the customer (collectors? everyday buyers?) · Is this a store (with checkout) or a showcase? · Do you have a logo/brand colors, or should Atelier propose a direction? · Do you have actual product photos?
2. **You answer** via chips + one free-text note ("streetwear brand, bold, a bit rebellious"). The living brief fills in live.
3. **Architect Agent proposes an Implementation Plan:** a landing page with a 3D hero, a product grid, a product-detail page with an interactive 3D viewer, and (if you said "store") a checkout flow — you approve it.
4. **Design Agent proposes a token system** matching "bold, rebellious streetwear" (not a default palette), self-critiques it against generic patterns, and you approve the direction.
5. **3D/Asset Agent checks Sketchfab** for a close sneaker match; if you uploaded a real photo of your actual shoe, it instead generates a 3D model from that photo so the site shows your product, not a stand-in — then optimizes and embeds it with an orbit-camera viewer on the product page.
6. **Coder Agents build** the landing page, product grid, and product-detail page in parallel, against the shared design tokens.
7. **QA Agent runs** type-checks, tests, a headless browser pass, and a visual-regression check continuously; if something breaks, it fixes it itself, within a retry budget, before you ever see a broken preview.
8. **You review the live result,** click directly on the hero headline to request a tweak, approve the change.
9. **Deployment Agent ships** it to a live URL with your custom domain.
* **Total human involvement:** A handful of chip-taps, one design-direction approval, one plan approval, one optional photo upload, and one deploy confirmation — everything else runs autonomously inside the checkpoints from Architecture doc §7.

---

## 6. What Actually Makes This Different (Recap)
No competitor reviewed (Bolt.new, Lovable, v0, Replit Agent, Antigravity/Cursor) combines all of: an upfront PM-style discovery loop, real design-fidelity ingestion, a native 3D layer (sourced and generated), and an enforced anti-generic design gate. Most are strong on one or two of these. The durable differentiation is the combination, and the "brain" loop in §3 is what makes that combination coherent instead of four bolted-together features.

---

## 7. Next-Level Ideas (Full List, See PRD §12 for Detail)
| Idea | One-line Summary |
| :--- | :--- |
| **Brand Identity Agent** | Generates logo, favicon, and a coordinated image set alongside the design tokens. |
| **Growth/Analytics Agent** | Watches real traffic post-launch and proposes specific, data-backed changes. |
| **Competitive Research Sub-step** | Briefly scans named competitor sites during Discovery to sharpen the first plan. |
| **Voice-First Discovery Mode** | Lets the clarifying-question loop happen by voice. |
| **Localization Agent** | Auto-translates and culturally adapts a project for new markets. |
| **Continuous "Digital Employee" Mode** | An always-on agent that keeps content fresh post-launch, with human approval on publish. |
| **Multiplayer Live Collaboration** | Multiple humans and agents on one project simultaneously, with presence and comments. |
| **User-Facing "Trust Slider"** | Exposes the autonomy levels (autonomous/collaborative/supervised) as a control you can set. |
| **Plugin/MCP Marketplace** | Lets third parties add new specialist agents as installable tools. |

---

## 8. Document Map (Where Everything Lives)
| Doc | Covers |
| :--- | :--- |
| **[01_PRD.md](file:///e:/Aucor%20AI/docs/01_PRD.md)** | Product requirements, all pillars (including native 3D generation), competitive analysis, roadmap, next-level ideas |
| **[02_UX_FRONTEND_DESIGN.md](file:///e:/Aucor%20AI/docs/02_UX_FRONTEND_DESIGN.md)** | Atelier's own visual identity, core screens, the anti-generic-design rubric, accessibility/motion rules |
| **[03_SYSTEM_ARCHITECTURE.md](file:///e:/Aucor%20AI/docs/03_SYSTEM_ARCHITECTURE.md)** | The full agent roster, the Orchestrator "brain" logic in technical detail, reliability/failure handling, data model |
| **[04_TECH_STACK.md](file:///e:/Aucor%20AI/docs/04_TECH_STACK.md)** | Concrete technology choices, including the 3D generation API routing layer, structured for building in Antigravity |
| **[05_CAPABILITIES_SUMMARY_AND_NEXT_LEVEL.md](file:///e:/Aucor%20AI/docs/05_CAPABILITIES_SUMMARY_AND_NEXT_LEVEL.md)** | (this doc) Plain-language summary of everything above, worked example, next-level index |
