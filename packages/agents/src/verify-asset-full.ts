/**
 * Create a test project for asset agent verification, then run the full pipeline.
 * Run with: bun --env-file=../../.env src/verify-asset-full.ts
 */
import { PrismaClient } from '@prisma/client';
import { AssetAgent } from './asset-agent/index.js';

const prisma = new PrismaClient();

async function verifyAssetAgentFull() {
  console.log("==================================================");
  console.log("🔍 Stage H.1: Full Asset Agent Pipeline Verification");
  console.log("==================================================\n");

  // 0. Create a real test project in the database
  console.log("0. Creating test project in database...");
  const project = await prisma.project.create({
    data: {
      name: 'Asset Agent Test Project',
      description: 'Temporary project for Stage H.1 verification',
    },
  });
  console.log(`   Project ID: ${project.id}\n`);

  const agent = new AssetAgent();

  try {
    // 1. LLM Query Formulation
    console.log("1. Testing LLM Search Query Formulation...");
    const prompt = "A modern mid-century lounge chair with brown leather and walnut wood frame";
    const formulatedQuery = await agent.generateSearchQuery(prompt);
    console.log(`   Formulated Query: "${formulatedQuery}"\n`);

    // 2. Sketchfab Search (commercial-safe CC only)
    console.log("2. Searching Sketchfab (CC-BY, CC-BY-SA, CC0 ONLY)...");
    let searchResults = await agent.searchSketchfab(formulatedQuery, 5);
    if (searchResults.models.length === 0) {
      console.log(`   Fallback search: "chair"`);
      searchResults = await agent.searchSketchfab("chair", 5);
    }
    console.log(`   Query: "${searchResults.queryUsed}" → ${searchResults.models.length} results`);

    if (searchResults.models.length === 0) {
      console.log("   ❌ No models found. Cannot test download pipeline.");
      return;
    }

    const topModel = searchResults.models[0];
    console.log(`   Selected: "${topModel.name}" by ${topModel.user.username} (${topModel.license.fullName || topModel.license.slug})\n`);

    // 3. generate() stub
    console.log("3. Testing generate() stub...");
    try {
      await agent.generate("test");
      console.error("   ❌ generate() did NOT throw!");
    } catch (err: any) {
      console.log(`   ✅ Throws: "${err.message}"\n`);
    }

    // 4. Download + Post-Process + DB Persist
    console.log("4. Download → Post-Process → DB Persist...");
    const processed = await agent.downloadAndPostProcess(
      topModel.uid,
      project.id,
      `Test: ${topModel.name}`
    );

    console.log(`   ✅ Asset persisted!`);
    console.log(`     DB Record ID: ${processed.id}`);
    console.log(`     Is real DB ID (not local-): ${!processed.id.startsWith('local-')}`);
    console.log(`     GLB Path: ${processed.url}`);
    console.log(`     File Size: ${(processed.metadata.sizeBytes / 1024).toFixed(0)} KB`);
    console.log(`     Draco: ${processed.metadata.dracoCompressed} | Center: ${processed.metadata.centerNormalized} | Scale: ${processed.metadata.scaleNormalized}`);
    console.log(`     Attribution:`);
    console.log(`       Author: ${processed.attribution.authorName}`);
    console.log(`       URL: ${processed.attribution.authorUrl}`);
    console.log(`       License: ${processed.attribution.licenseName}`);
    console.log(`       Model: ${processed.attribution.modelUrl}`);

    // 5. Verify DB record actually exists
    console.log("\n5. Verifying DB record...");
    const dbAsset = await prisma.asset.findUnique({ where: { id: processed.id } });
    if (dbAsset) {
      console.log(`   ✅ Asset record confirmed in PostgreSQL:`);
      console.log(`     - name: ${dbAsset.name}`);
      console.log(`     - source: ${dbAsset.source}`);
      console.log(`     - attribution: ${dbAsset.attribution}`);
    } else {
      console.log(`   ❌ Asset record NOT found in database for ID: ${processed.id}`);
    }
  } finally {
    // Cleanup test data
    console.log("\n6. Cleaning up test project...");
    await prisma.asset.deleteMany({ where: { projectId: project.id } });
    await prisma.project.delete({ where: { id: project.id } });
    console.log("   ✅ Test project and assets cleaned up.");
    await prisma.$disconnect();
  }

  console.log("\n==================================================");
  console.log("✅ FULL PIPELINE VERIFICATION COMPLETE");
  console.log("==================================================");
}

verifyAssetAgentFull();
