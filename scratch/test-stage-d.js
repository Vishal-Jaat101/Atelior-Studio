import { prisma } from '../packages/db/src/client.js';
import { LearningAgent, DiscoveryAgent } from '../packages/agents/src/index.js';

async function main() {
  console.log('=== STARTING STAGE D END-TO-END VERIFICATION ===\n');

  // Clear existing outcomes to ensure a clean demo run
  await prisma.projectOutcomeSignal.deleteMany({});
  await prisma.learnedPrior.deleteMany({});
  await prisma.project.deleteMany({
    where: {
      name: {
        startsWith: 'Demo Keyboard'
      }
    }
  });

  // 1. Create 3 mock completed/reworked projects to feed the learning layer
  console.log('--- 1. Creating 3 historical projects with varying reworks & outcomes ---');
  
  const mockProjects = [
    {
      name: 'Demo Keyboard Project A',
      brief: {
        targetAudience: 'Mechanical keyboard collectors',
        platforms: ['web'],
        coreUserFlow: 'Customize keycaps → preview layout → add to cart → checkout',
        has3DApplicability: true,
        visualTone: 'Minimalist & Clean',
        mustHaveFeatures: ['Interactive 3D Hero Canvas', 'Product Search & Filter Grid'],
        niceToHaveFeatures: ['Stripe Payment Gateway']
      },
      reworks: { mustHaveFeatures: 4, targetAudience: 2 },
      skipped: ['niceToHaveFeatures'],
      selectedAxis: 'metaphor',
      rounds: 2,
    },
    {
      name: 'Demo Keyboard Project B',
      brief: {
        targetAudience: 'Premium custom keyboard builders',
        platforms: ['web'],
        coreUserFlow: 'Assemble parts → view 3D rotation → buy',
        has3DApplicability: true,
        visualTone: 'Dark Cyberpunk',
        mustHaveFeatures: ['Interactive 3D Hero Canvas'],
        niceToHaveFeatures: ['Stripe Payment Gateway']
      },
      reworks: { mustHaveFeatures: 3, coreUserFlow: 1 },
      skipped: ['niceToHaveFeatures'],
      selectedAxis: 'metaphor',
      rounds: 3,
    },
    {
      name: 'Demo Keyboard Project C',
      brief: {
        targetAudience: 'B2B mechanical keyboard clients',
        platforms: ['web'],
        coreUserFlow: 'Request bulk order → view materials → confirm order',
        has3DApplicability: false,
        visualTone: 'Classic Serif Editorial',
        mustHaveFeatures: ['Product Search & Filter Grid'],
        niceToHaveFeatures: ['Live Chat Support']
      },
      reworks: { niceToHaveFeatures: 2 },
      skipped: [],
      selectedAxis: 'editorial',
      rounds: 1,
    }
  ];

  for (let i = 0; i < mockProjects.length; i++) {
    const pData = mockProjects[i];
    
    // Create project
    const project = await prisma.project.create({
      data: {
        name: pData.name,
        description: 'Test keyboard builder prompt description'
      }
    });

    // Create brief
    await prisma.livingBrief.create({
      data: {
        projectId: project.id,
        content: pData.brief as any
      }
    });

    // Create outcome signal
    await prisma.projectOutcomeSignal.create({
      data: {
        projectId: project.id,
        briefFieldReworkCounts: pData.reworks as any,
        discoveryQuestionsSkipped: pData.skipped as any,
        selectedConceptAxis: pData.selectedAxis,
        iterationRounds: pData.rounds,
        reachedDeployment: true
      }
    });

    console.log(`Created historical Project: "${pData.name}" with ID: ${project.id}`);
  }

  // 2. Fetch and print the ProjectOutcomeSignal table
  console.log('\n--- 2. Verifying ProjectOutcomeSignal Table ---');
  const signals = await prisma.projectOutcomeSignal.findMany();
  console.log('ProjectOutcomeSignal Records in Database:');
  console.log(JSON.stringify(signals, null, 2));

  // 3. Run the LearningAgent batch job
  console.log('\n--- 3. Running LearningAgent Batch Job ---');
  const learningAgent = new LearningAgent();
  const batchResult = await learningAgent.runBatchJob();
  console.log('Batch Job Result:', batchResult);

  // 4. Fetch and print the LearnedPrior table
  console.log('\n--- 4. Verifying LearnedPrior Table ---');
  const priors = await prisma.learnedPrior.findMany();
  console.log('LearnedPrior Records in Database:');
  console.log(JSON.stringify(priors, null, 2));

  // 5. Test a NEW project and show Discovery Agent prompt augmentation
  console.log('\n--- 5. Bootstrapping a NEW project to show prior influence ---');
  const newPrompt = "A casual consumer mechanical keyboard shop";
  
  // We can classify the new brief beforehand or pass the condition key
  // The new brief has targetAudience (casual consumer) -> classified as 'consumer'
  // platform -> 'web' by default
  const newBrief = {
    targetAudience: 'casual consumers',
    platforms: ['web']
  };

  const conditionKey = 'audience=consumer,platform=web';
  const matchingPriors = await prisma.learnedPrior.findMany({
    where: { scope: 'discovery', conditionKey }
  });

  console.log(`Condition Key evaluated for new project: "${conditionKey}"`);
  console.log(`Matching Discovery Prior loaded:`, JSON.stringify(matchingPriors, null, 2));

  console.log('\nInvoking Discovery Agent to generate clarifying questions under this prior...');
  const discoveryAgent = new DiscoveryAgent();
  const discoveryResult = await discoveryAgent.generateQuestions(
    newPrompt,
    newBrief,
    matchingPriors
  );

  console.log('\nDiscovery Agent Questions Generated (Influenced by Priors):');
  console.log(JSON.stringify(discoveryResult.questions, null, 2));

  console.log('\n=== STAGE D END-TO-END VERIFICATION COMPLETED ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
