/**
 * Crea la tabla CountryHoliday en Turso y la puebla
 * desde los datos existentes en Holiday (deduplicando por country+date)
 */
import * as dotenv from 'dotenv'
import { createClient } from '@libsql/client'
import { format } from 'date-fns'

dotenv.config()

async function main() {
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  console.log('📦 Creando tabla CountryHoliday...')
  await turso.execute(`
    CREATE TABLE IF NOT EXISTS "CountryHoliday" (
      "id"      INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "country" TEXT    NOT NULL,
      "date"    DATETIME NOT NULL,
      "name"    TEXT    NOT NULL
    )
  `)
  await turso.execute(`
    CREATE UNIQUE INDEX IF NOT EXISTS "CountryHoliday_country_date_key"
    ON "CountryHoliday"("country", "date")
  `)
  console.log('   ✓ Tabla creada')

  // Poblar desde Holiday existentes (JOIN con Resource para obtener country)
  console.log('🌱 Migrando feriados existentes a CountryHoliday...')
  const existing = await turso.execute(`
    SELECT DISTINCT r.country, h.date, h.name
    FROM "Holiday" h
    JOIN "Resource" r ON h.resourceId = r.id
    ORDER BY r.country, h.date
  `)

  let inserted = 0
  let skipped = 0
  for (const row of existing.rows) {
    try {
      await turso.execute({
        sql: `INSERT OR IGNORE INTO "CountryHoliday" (country, date, name) VALUES (?, ?, ?)`,
        args: [row.country, row.date, row.name],
      })
      inserted++
    } catch {
      skipped++
    }
  }

  console.log(`   ✓ ${inserted} feriados migrados, ${skipped} omitidos`)

  // Resumen por país
  const summary = await turso.execute(`
    SELECT country, COUNT(*) as total
    FROM "CountryHoliday"
    GROUP BY country
    ORDER BY country
  `)
  console.log('\n📊 Resumen por país:')
  for (const row of summary.rows) {
    console.log(`   ${row.country}: ${row.total} feriados`)
  }

  console.log('\n🎉 Migración completada!')
  turso.close()
}

main().catch((err) => { console.error('❌', err); process.exit(1) })
