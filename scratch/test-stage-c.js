import fs from 'fs';
import path from 'path';

async function testStageC() {
  // 1. Create a project via ingest
  const fileBuf = fs.readFileSync(path.resolve('scratch', 'test.docx'));
  const blob = new Blob([fileBuf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  
  const formData = new FormData();
  formData.append('prompt', 'A vintage mid-century furniture showcase');
  formData.append('files', blob, 'test.docx');

  console.log('--- 1. Ingesting Brief and Files ---');
  const ingestRes = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    body: formData
  });

  if (!ingestRes.ok) {
    console.error('Ingest failed:', await ingestRes.text());
    return;
  }

  const { projectId } = await ingestRes.json();
  console.log('Project ID initialized:', projectId);

  // 2. Select design direction first (needed by architect)
  console.log('\n--- 2. Setting Design Direction (editorial) ---');
  // First run divergence POST
  const divRes = await fetch('http://localhost:3000/api/divergence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  });
  const divData = await divRes.json();
  const selectedVariantId = divData.directions[0].id;

  // Then run PATCH selection
  await fetch('http://localhost:3000/api/divergence', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId, variantId: selectedVariantId })
  });
  console.log('Design Direction variant successfully chosen and tokens saved.');

  // 3. Trigger Architect Agent (POST /api/architect)
  console.log('\n--- 3. Ingesting Brief and DesignTokens into Architect Agent ---');
  const archRes = await fetch('http://localhost:3000/api/architect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  });

  if (!archRes.ok) {
    console.error('Architect failed:', await archRes.text());
    return;
  }

  const archData = await archRes.json();
  console.log('Architect generated ImplementationPlan successfully!');
  console.log('Pages generated:', archData.pages?.map(p => `${p.route} (${p.componentName})`));
  console.log('Tasks in sequential graph:', archData.tasks?.map(t => `${t.id} [${t.taskType}] -> ${t.assignedTo}`));

  // 4. Trigger Conflict Negotiation (POST /api/negotiation)
  console.log('\n--- 4. Creating Agent Negotiation (Scope-vs-Time Conflict) ---');
  const negRes = await fetch('http://localhost:3000/api/negotiation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId })
  });

  if (!negRes.ok) {
    console.error('Negotiation trigger failed:', await negRes.text());
    return;
  }

  const negData = await negRes.json();
  console.log('Conflict registered:');
  console.log(`- Summary: ${negData.conflictSummary}`);
  console.log(`- Status: PENDING`);

  // 5. Resolve Conflict (PATCH /api/negotiation)
  console.log('\n--- 5. Resolving Conflict with User Decision ---');
  const resolveRes = await fetch('http://localhost:3000/api/negotiation', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      negotiationId: negData.id,
      userDecision: 'Prioritize Timeline: drop heavy 3D assets'
    })
  });

  const resolveData = await resolveRes.json();
  console.log('Resolution saved:', resolveData.success);

  // 6. Run Synthetic Usability Walkthrough (POST /api/testing)
  console.log('\n--- 6. Running Persona Usability Walkthrough ---');
  const testRes = await fetch('http://localhost:3000/api/testing', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectId,
      previewUrl: 'http://localhost:3000/preview'
    })
  });

  if (!testRes.ok) {
    console.error('Usability test failed:', await testRes.text());
    return;
  }

  const report = await testRes.json();
  console.log('Received Usability Critique Report:');
  console.log(`- Persona: ${report.personaName}`);
  console.log(`- Rating: ${report.overallRating}/5 stars`);
  console.log(`- Friction Points:\n  * ${report.frictionPoints?.join('\n  * ')}`);
  console.log(`- Critique Recommendation: ${report.critiqueSummary}`);
}

testStageC().catch(console.error);
