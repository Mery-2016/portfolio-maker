import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ytZjl5LePD7K@ep-dawn-credit-bb9y7m4e-pooler.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(databaseUrl);

async function main() {
  const rows = await sql`SELECT id, title, version, created_at FROM resumes ORDER BY created_at DESC LIMIT 5`;
  console.log('Recent resumes in Neon database:');
  console.table(rows);
}

main().catch(console.error);
