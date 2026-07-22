import { prisma } from '../packages/db/src/client.js';

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    console.log('Tables in public schema:');
    console.log(tables);
  } catch (err) {
    console.error(err);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
