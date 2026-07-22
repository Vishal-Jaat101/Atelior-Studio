import { prisma } from './index.js';

async function main() {
  const docs = await prisma.sourceDocument.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  console.log('Last SourceDocument:', JSON.stringify(docs, null, 2));

  if (docs.length > 0) {
    const projectId = docs[0].projectId;
    const variants = await prisma.conceptVariant.findMany({
      where: { projectId }
    });
    console.log(`\nConceptVariants for Project ${projectId} (${variants.length} found):`);
    variants.forEach(v => {
      console.log(`- Axis: ${v.axis}, status: ${v.status}, passedCritique: ${v.passedCritiqueGate}`);
    });

    const taskNodes = await prisma.taskNode.findMany({
      take: 10
    });
    console.log('\nTaskNodes in DB:');
    console.log(JSON.stringify(taskNodes.map(n => ({ id: n.id, graphId: n.graphId, status: n.status })), null, 2));
  }
}

main().catch(console.error);
