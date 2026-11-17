import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_ytZjl5LePD7K@ep-dawn-credit-bb9y7m4e-pooler.c-15.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(databaseUrl);

async function init() {
  console.log('Connecting to Neon database...');
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS resumes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_user_id UUID,
      owner_session UUID,
      title TEXT NOT NULL DEFAULT 'Моё резюме',
      data JSONB NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      public_slug TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS ai_generations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      block TEXT NOT NULL,
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS exports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      format TEXT NOT NULL,
      status TEXT NOT NULL,
      file_key TEXT,
      url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  console.log('Neon database tables created successfully!');
}

init().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
