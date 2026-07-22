/**
 * Create a permanent 3D asset fixture for Nocturne 3D Viewer testing.
 * Run with: bun --env-file=.env scratch/create-permanent-fixture-asset.ts
 */
import { PrismaClient } from '@prisma/client';
import { AssetAgent } from './packages/agents/src/asset-agent/index.js';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function createPermanentFixture() {
  console.log("==================================================");
  console.log("🛋️ Creating Permanent 3D Asset Fixture for Nocturne Viewer");
  console.log("==================================================\n");

  // 1. Ensure permanent project exists in PostgreSQL
  let project = await prisma.project.findFirst({
    where: { name: 'Nocturne System Fixture Project' }
  });

  if (!project) {
    console.log("1. Creating permanent system project in database...");
    project = await prisma.project.create({
      data: {
        name: 'Nocturne System Fixture Project',
        description: 'Permanent system project holding default 3D model fixtures',
      }
    });
  }
  console.log(`   Project ID: ${project.id}\n`);

  // 2. Run AssetAgent to download & post-process the Harvey Probber Armchair
  const agent = new AssetAgent();
  const modelUid = 'e54f711755a54b119b364fe6fcbfd821'; // Midcentury Harvey Probber Armchair

  console.log("2. Downloading & post-processing Sketchfab model...");
  const assetResult = await agent.downloadAndPostProcess(
    modelUid,
    project.id,
    'Midcentury Harvey Probber Armchair'
  );

  console.log(`   Asset ID: ${assetResult.id}`);
  console.log(`   Original URL: ${assetResult.url}\n`);

  // 3. Create permanent named fixture copy in apps/web/public/uploads/assets/
  const fixtureFilename = 'fixture-harvey-probber-armchair.glb';
  const webPublicDir = path.resolve(process.cwd(), 'apps/web/public/uploads/assets');
  const agentPublicDir = path.resolve(process.cwd(), 'packages/agents/public/uploads/assets');

  if (!fs.existsSync(webPublicDir)) {
    fs.mkdirSync(webPublicDir, { recursive: true });
  }
  if (!fs.existsSync(agentPublicDir)) {
    fs.mkdirSync(agentPublicDir, { recursive: true });
  }

  // Read the generated buffer from assetResult.url
  const sourcePath = path.resolve(process.cwd(), `apps/web${assetResult.url}`);
  const webTargetPath = path.join(webPublicDir, fixtureFilename);
  const agentTargetPath = path.join(agentPublicDir, fixtureFilename);

  fs.copyFileSync(sourcePath, webTargetPath);
  fs.copyFileSync(sourcePath, agentTargetPath);

  const fixturePublicUrl = `/uploads/assets/${fixtureFilename}`;

  console.log("3. Permanent Fixture File Created on Disk:");
  console.log(`   Web Path: ${webTargetPath}`);
  console.log(`   Exists on disk: ${fs.existsSync(webTargetPath)}`);
  console.log(`   File Size: ${(fs.statSync(webTargetPath).size / 1024).toFixed(0)} KB`);
  console.log(`   Public URL: ${fixturePublicUrl}\n`);

  // 4. Upsert permanent DB record
  const existingFixtureAsset = await prisma.asset.findFirst({
    where: { url: fixturePublicUrl }
  });

  if (!existingFixtureAsset) {
    await prisma.asset.create({
      data: {
        projectId: project.id,
        name: 'Midcentury Harvey Probber Armchair (Fixture)',
        source: 'sketchfab',
        url: fixturePublicUrl,
        attribution: JSON.stringify(assetResult.attribution),
        metadata: assetResult.metadata,
      }
    });
    console.log("4. Permanent Asset Record Saved to PostgreSQL database.");
  } else {
    console.log("4. Permanent Asset Record already exists in PostgreSQL database.");
  }

  await prisma.$disconnect();

  console.log("\n==================================================");
  console.log("✅ PERMANENT FIXTURE CREATED SUCCESSFULLY");
  console.log("==================================================");
}

createPermanentFixture().catch(err => {
  console.error("Error creating permanent fixture:", err);
  process.exit(1);
});
