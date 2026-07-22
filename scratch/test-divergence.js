import fs from 'fs';
import path from 'path';

async function testDivergence() {
  // 1. Create a project via ingest first
  const fileBuf = fs.readFileSync(path.resolve('scratch', 'test.docx'));
  const blob = new Blob([fileBuf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  
  const formData = new FormData();
  formData.append('prompt', 'A vintage mid-century furniture showcase');
  formData.append('files', blob, 'test.docx');

  console.log('Ingesting file to initialize project...');
  const ingestRes = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    body: formData
  });

  if (!ingestRes.ok) {
    console.error('Ingest failed:', ingestRes.status, await ingestRes.text());
    return;
  }

  const { projectId } = await ingestRes.json();
  console.log('Project created:', projectId);

  // 2. Trigger Design Divergence (POST)
  console.log('\nRunning design divergence generation...');
  const divRes = await fetch('http://localhost:3000/api/divergence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  });

  if (!divRes.ok) {
    console.error('Divergence failed:', divRes.status, await divRes.text());
    return;
  }

  const divData = await divRes.json();
  console.log(`Divergence complete. Received ${divData.directions?.length} surviving directions:`);
  divData.directions?.forEach(d => {
    console.log(`- Axis: ${d.axis}, passed critique: ${d.passedCritiqueGate}, combined score: ${(d.distinctivenessScore + d.coherenceScore).toFixed(2)}`);
  });

  if (!divData.directions || divData.directions.length === 0) {
    console.error('No directions generated!');
    return;
  }

  // 3. Select the first variant (PATCH)
  const selectedVariantId = divData.directions[0].id;
  console.log(`\nSelecting design direction variant ID: ${selectedVariantId} (axis: ${divData.directions[0].axis})...`);
  
  const selectRes = await fetch('http://localhost:3000/api/divergence', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, variantId: selectedVariantId })
  });

  if (!selectRes.ok) {
    console.error('Selection failed:', selectRes.status, await selectRes.text());
    return;
  }

  const selectData = await selectRes.json();
  console.log('Selection success:', selectData);

  // 4. Verify Database Persistence of DesignTokens
  const { prisma } = await import('@atelier/db');
  
  // Inject DATABASE_URL so prisma client resolves
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_gpI8K6ShFUPl@ep-late-fire-avydjfp8.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  const tokensRecord = await prisma.designTokens.findUnique({
    where: { projectId }
  });

  console.log('\nVerified DesignTokens model in Database:');
  console.log(JSON.stringify(tokensRecord, null, 2));

  const variantsRecord = await prisma.conceptVariant.findMany({
    where: { projectId }
  });
  console.log(`\nVerified ConceptVariant rows in Database (${variantsRecord.length} found):`);
  variantsRecord.forEach(v => {
    console.log(`- Axis: ${v.axis}, status: ${v.status}`);
  });
}

testDivergence().catch(console.error);
