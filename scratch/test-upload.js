import fs from 'fs';
import path from 'path';

async function testUpload() {
  const fileBuf = fs.readFileSync(path.resolve('scratch', 'test.docx'));
  const blob = new Blob([fileBuf], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  
  const formData = new FormData();
  formData.append('prompt', 'A vintage mid-century furniture showcase');
  formData.append('files', blob, 'test.docx');

  console.log('Sending request to /api/ingest...');
  const res = await fetch('http://localhost:3000/api/ingest', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    console.error('Request failed:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log('Successfully received response:');
  console.log(JSON.stringify(data, null, 2));

  // Check database persistence of SourceDocument
  const { prisma } = await import('@atelier/db');
  const sourceDoc = await prisma.sourceDocument.findFirst({
    where: { projectId: data.projectId }
  });
  console.log('\nVerified database SourceDocument record:');
  console.log(JSON.stringify(sourceDoc, null, 2));
}

testUpload().catch(console.error);
