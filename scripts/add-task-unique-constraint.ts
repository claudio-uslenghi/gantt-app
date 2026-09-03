import * as dotenv from 'dotenv'
import { createClient } from '@libsql/client'

dotenv.config()

// Idempotent: adds a unique index on Task(projectId, name) so the same
// project can't have two tasks with the same name. Safe to run repeatedly.
// Verified against production data before writing this: 13 tasks total,
// 0 duplicate (projectId, name) pairs — no cleanup needed first.
async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('Creating unique index on Task(projectId, name)...')
  await turso.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "Task_projectId_name_key"
    ON "Task" (projectId, name)
  `)
  console.log('✅ Task(projectId, name) unique index ready.')

  turso.close()
  console.log('\nMigration complete.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
