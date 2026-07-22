---
name: growth-agent
description: Proposes copy A/B test experiments (hero title, CTA button) and schedules automated promotional/reversion decisions based on simulated or PostHog traffic metrics.
---

# Growth Agent Skill

The Growth Agent acts as an automated Conversion Rate Optimization (CRO) engineer inside the Atelier Studio suite. It analyzes user outcomes and automates low-risk changes while gating medium-risk and high-risk proposals.

## Objectives
1. Read project performance statistics or simulate traffic sessions.
2. Formulate optimization hypothesis using the Nemotron model.
3. Automatically launch low-risk variants (traffic = 10%).
4. Queue medium-risk or high-risk variants for manual approval.
5. Promote variants that reach statistical significance, or revert back to the control copy.

## Execution Rules
- **Targeting Scope**: Hero headlines (`hero_copy`) and Action button text (`cta_button_text`).
- **Autopilot Gates**:
  - `riskTier: LOW` -> Immediately set status to `TESTING`, split traffic to 10% on the variant.
  - `riskTier: MEDIUM | HIGH` -> Set status to `AWAITING_APPROVAL`, split traffic to 0% until the user interacts with the UI.
- **Statistical Resolution**:
  - Minimum sample size threshold: 55 impressions on the variant branch.
  - Performance calculation: CTR = `clicks / impressions`.
  - Action on resolution:
    - If `variantCtr > originalCtr` -> Set status to `PROMOTED`, allocate 100% traffic to the variant.
    - If `variantCtr <= originalCtr` -> Set status to `REVERTED`, allocate 0% traffic (return control to 100%).
