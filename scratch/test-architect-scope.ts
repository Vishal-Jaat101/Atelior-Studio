import { ArchitectAgent } from '../packages/agents/src/index.ts';

async function testArchitectScope() {
  console.log("==================================================");
  console.log("📐 Testing Architect Agent Scope Control (No Payments Brief)");
  console.log("==================================================\n");

  const nonCommercialBrief = {
    platforms: ['web'],
    mustHaveFeatures: ['Interactive Project Portfolio', 'Dark Mode Showcase', 'Contact Form'],
    niceToHaveFeatures: ['3D Model Showcase'],
    visualTone: 'Editorial & Dark',
    targetAudience: 'Design Enthusiasts & Clients',
    coreUserFlow: 'Browse portfolio projects and submit contact inquiry.',
    has3DApplicability: true,
  };

  const agent = new ArchitectAgent();
  const plan = await agent.plan(nonCommercialBrief as any);

  console.log("GENERATED BLUEPRINT:");
  console.log("Pages:", plan.pages.map(p => `${p.route} (${p.componentName})`));
  console.log("Integrations:", plan.integrations);
  console.log("Unresolved Questions:", plan.unresolvedQuestions || []);

  const hasStripe = plan.integrations.some((i: string) => /stripe|payment/i.test(i));
  const hasCheckoutPage = plan.pages.some((p: any) => /checkout|billing/i.test(p.route || '') || /checkout|billing/i.test(p.componentName || ''));

  if (hasStripe || hasCheckoutPage) {
    console.error("\n❌ FAILED: Scope creep detected! Stripe or Checkout was added to a non-commercial brief.");
    process.exit(1);
  } else {
    console.log("\n✅ PASSED: Zero scope creep! No Stripe or Checkout included in portfolio plan.");
  }
}

testArchitectScope().catch(err => {
  console.error(err);
  process.exit(1);
});
