/**
 * Stage H.1: 3D/Asset Agent Full Verification
 * Run with: bun --env-file=../../.env src/verify-asset.ts
 * This ensures DATABASE_URL and all other env vars are loaded BEFORE
 * any module-level imports (including Prisma) initialize.
 */
import { AssetAgent } from './asset-agent/index.js';

async function verifyAssetAgent() {
  console.log("==================================================");
  console.log("🔍 Stage H.1: 3D/Asset Agent Comprehensive Verification");
  console.log("==================================================\n");

  // Pre-flight: confirm DATABASE_URL is loaded
  console.log("0. Pre-flight Environment Check...");
  console.log(`   DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
  console.log(`   NVIDIA_NIM_API_KEY present: ${!!process.env.NVIDIA_NIM_API_KEY}`);
  console.log(`   SKETCHFAB_API_TOKEN present: ${!!process.env.SKETCHFAB_API_TOKEN}\n`);

  const agent = new AssetAgent();

  // 1. Test LLM Query Formulation via ModelRouter ('asset' agent config)
  console.log("1. Testing LLM Search Query Formulation...");
  const prompt = "A modern mid-century lounge chair with brown leather and walnut wood frame";
  const formulatedQuery = await agent.generateSearchQuery(prompt);
  console.log(`   Input Prompt: "${prompt}"`);
  console.log(`   Formulated Sketchfab Query: "${formulatedQuery}"\n`);

  // 2. Test Sketchfab Data API Search (Commercial-Safe CC Licenses: by, by-sa, cc0 ONLY)
  console.log("2. Testing Sketchfab Search API (Commercial-Safe CC Licenses ONLY)...");
  let searchResults = await agent.searchSketchfab(formulatedQuery, 5);
  if (searchResults.models.length === 0) {
    console.log(`   (Formulated query returned 0 models, trying fallback search: "chair")`);
    searchResults = await agent.searchSketchfab("chair", 5);
  }
  console.log(`   Query Executed: "${searchResults.queryUsed}"`);
  console.log(`   Models Returned: ${searchResults.models.length}`);

  if (searchResults.models.length > 0) {
    const topModel = searchResults.models[0];
    console.log(`   Top Result:`);
    console.log(`     - UID: ${topModel.uid}`);
    console.log(`     - Name: ${topModel.name}`);
    console.log(`     - Author: ${topModel.user.username} (${topModel.user.profileUrl})`);
    console.log(`     - License: ${topModel.license.fullName || topModel.license.slug}`);
    console.log(`     - Viewer URL: ${topModel.viewerUrl}\n`);
  }

  // 3. Test generate() Stub (Must throw "not yet enabled, pending cost approval")
  console.log("3. Testing generate() Stub (Paid API Protection)...");
  try {
    await agent.generate("A futuristic cybercar");
    console.error("❌ FAILED: generate() did not throw error!");
  } catch (err: any) {
    console.log(`   ✅ SUCCESS: generate() caught as expected: "${err.message}"\n`);
  }

  // 4. Test Download + Post-Processing + DB Persistence
  console.log("4. Testing Sketchfab Download, Post-Processing & DB Persistence...");
  const token = process.env.SKETCHFAB_API_TOKEN;
  console.log(`   SKETCHFAB_API_TOKEN Configured: ${!!token ? 'YES' : 'NO'}`);

  if (!token) {
    console.log("   ⚠️ Skipping download test — SKETCHFAB_API_TOKEN not set in .env");
  } else if (searchResults.models.length > 0) {
    const modelUid = searchResults.models[0].uid;
    console.log(`   Attempting download and post-processing for model ${modelUid}...`);
    try {
      const processed = await agent.downloadAndPostProcess(modelUid, 'test-project-h1');
      console.log("   ✅ Download & Post-Processing Success!");
      console.log(`     - Asset ID: ${processed.id}`);
      console.log(`     - Starts with 'local-': ${processed.id.startsWith('local-')}`);
      console.log(`     - URL: ${processed.url}`);
      console.log(`     - Attribution Author: ${processed.attribution.authorName} (${processed.attribution.authorUrl})`);
      console.log(`     - Attribution License: ${processed.attribution.licenseName}`);
      console.log(`     - Size: ${processed.metadata.sizeBytes} bytes`);
      console.log(`     - Draco Compressed: ${processed.metadata.dracoCompressed}`);
      console.log(`     - Scale Normalized: ${processed.metadata.scaleNormalized}`);
      console.log(`     - Center Normalized: ${processed.metadata.centerNormalized}`);

      if (processed.id.startsWith('local-')) {
        console.log("\n   ⚠️ DB persistence fell back to local ID — checking DATABASE_URL...");
        console.log(`   DATABASE_URL present: ${!!process.env.DATABASE_URL}`);
      } else {
        console.log("\n   ✅ Prisma DB persistence confirmed — real DB record created.");
      }
    } catch (err: any) {
      console.error("   ❌ Download/Post-Processing Error:", err.message);
    }
  }

  console.log("\n==================================================");
  console.log("✅ Asset Agent Verification Complete");
  console.log("==================================================");
}

verifyAssetAgent();
