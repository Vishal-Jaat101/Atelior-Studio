# Tech Stack Document
**Atelier** — Build Plan for Antigravity IDE  
**Version:** 0.1 · Companion to the PRD, UX/Frontend, and Architecture docs

---

## 1. Why This Stack, Given You're Building in Antigravity
Antigravity is an agent-first IDE: it works in an Editor view (synchronous, tab-completion style) and a Manager view where you spawn and orchestrate multiple autonomous agents in parallel across workspaces, each producing verifiable Artifacts (implementation plans, task lists, screenshots, walkthroughs) before you approve their work. It also has its own Skills system — scoped `SKILL.md` packages loaded only when relevant, to avoid dumping your whole ruleset into every agent call.

Three consequences for how this stack is chosen and organized:
1. **Strong typing and automated verification aren't optional** — they're what let Antigravity's agents (and Atelier's own internal agents, once built) self-check their work instead of guessing. TypeScript-strict, linting, and test gates are load-bearing, not nice-to-haves.
2. **The repo should be structured so an agent can reason about one part without loading the whole thing** — a monorepo with clear package boundaries maps directly onto Antigravity's project-scoped context model and its parallel-agent workspace model (assign one agent per package/workspace).
3. **This PRD/Design/Architecture doc set should live in the repo as durable agent context** — put them under `/docs`, and mirror the pattern with per-package `SKILL.md` files, so any agent (Antigravity's or Atelier's own) working on a given package loads only what's relevant to it.

---

## 2. Frontend

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) + React 19 | Server components for fast initial loads on marketing/build-canvas pages; broad ecosystem support that every AI coding tool already reasons about well. |
| **Language** | TypeScript, strict mode | Type errors are a cheap, deterministic signal agents can self-correct against — central to the self-healing loop. |
| **Styling** | Tailwind CSS with custom token config | Avoids the "looks AI-generated" trap that comes from using default component-library styling untouched. |
| **Component Primitives** | Radix UI primitives | Accessible, unstyled foundation — styling stays intentional and flexible. |
| **Motion** | Framer Motion | Orchestrated entrance sequences and precise micro-interactions. |
| **3D Rendering** | React Three Fiber + @react-three/drei + Three.js | Two-tier approach: lightweight path `<model-viewer>` for simple cases, full scene-graph control for interactive/custom cases. |
| **Code Panel** | Monaco Editor | Familiar, fast, and the industry standard for in-browser code views. |
| **Terminal** | xterm.js | For technical users who expand the code drawer. |
| **Client State** | Zustand | Minimal boilerplate for canvas and task-rail UI state. |
| **Server/Data State** | TanStack Query (React Query) | Cache and sync project/task data from the backend. |

---

## 3. Backend & Orchestration

| Layer | Choice | Why |
| :--- | :--- | :--- |
| **Runtime** | Node.js (via Bun) | Fast cold starts for orchestration workloads; Bun's speed matters when coordinating many short agent calls. |
| **API Layer** | tRPC | End-to-end type safety between the orchestrator and the frontend, reducing integration bugs agents would otherwise have to self-heal. |
| **Database** | PostgreSQL (Neon or Supabase) + `pgvector` | Relational core for Projects/TaskGraph/Deployments, with `pgvector` for the project knowledge base's embedding search. |
| **Queue / Job Orchestration** | Redis (Upstash) + BullMQ | Backs the Task Graph — scheduling, retries, concurrency limiting, and rate-limiting. |
| **Agent Runner Engine** | Custom TypeScript Orchestrator | A light, predictable state machine running LLM routing and workspace management. |

---

## 4. AI & Model Routing Layer

| Service | Choice | Why |
| :--- | :--- | :--- |
| **LLM Router** | Vercel AI SDK (`ai` package) | Framework-agnostic agent and model interaction layer; simplifies switching models. |
| **Reasoning Model** | Claude 3.5 Sonnet / Gemini 1.5 Pro | Best-in-class code logic, planning, and design-token structuring. |
| **Fast / Utility Model** | Gemini 1.5 Flash / GPT-4o-mini | Low-cost, fast response times for classification, simple QA checking, and copywriting. |
| **Embeddings Model** | `text-embedding-3-small` (OpenAI) / Gemini Embeddings | Used for semantic search of historical brief context, style guidelines, and codebase knowledge. |
| **Text-to-3D / Image-to-3D APIs** | Tripo3D API / Meshy API | Robust REST APIs that generate high-quality `.glb` models from text prompts or reference photos. |
| **3D Sourcing API** | Sketchfab Data API | Sourcing Creative Commons assets with automatic license metadata retrieval. |

---

## 5. Sandboxing & Dev Environment

| Component | Choice | Why |
| :--- | :--- | :--- |
| **Client-Side Sandbox** | WebContainers API (StackBlitz) | Allows running Node.js and Next.js dev server directly inside the user's browser for instant, cost-free preview rendering. |
| **Server-Side Sandbox** | E2B (Event-to-Branch) Sandbox / Docker in MicroVMs | Isolated secure environments for backend database migrations, long-running agent tasks, and running Playwright smoke tests. |

---

## 6. Deployment & Cloud Providers

| Resource | Provider / Tool | Why |
| :--- | :--- | :--- |
| **Web App Hosting** | Vercel / Netlify / custom VPS | Managed hosting for Next.js out-of-the-box, easily configurable via REST APIs. |
| **Database Provisioning** | Neon Database API | Allows dynamic provisioning of temporary PostgreSQL databases and branch isolation per project/deployment. |
| **DNS & Custom Domains** | Cloudflare API | Automates subdomain allocation, DNS routing, and SSL certificate management. |

---

## 7. Testing & Self-Healing QA

| Category | Choice | Why |
| :--- | :--- | :--- |
| **Static Verification** | TypeScript Compiler (`tsc`) | Quick command-line checks for syntax and type correctness before any code changes are previewed. |
| **Code Linting** | ESLint + Prettier | Enforces styling guidelines and catches simple programming antipatterns. |
| **Unit Testing** | Vitest | Extremely fast, runner-compatible unit testing to verify component logic. |
| **E2E Smoke Checking** | Playwright (Headless Browser) | Simulates page loading, clicking navigation, and verifying that the page renders without console crashes or exceptions. |
| **Visual Regression** | Pixelmatch / Resemble.js | Compares screenshots of newly generated components against their Figma source/approved mockup to detect visual drift. |
