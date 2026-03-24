/**
 * Migra datos del dev.db local (SQLite) a Turso
 * Lee todas las tablas del archivo local y las inserta en Turso
 */
import * as dotenv from 'dotenv'
import { createClient, type Client } from '@libsql/client'

dotenv.config()

const LOCAL_DB_PATH = 'file:./prisma/dev.db'

async function migrate() {
  console.log('🔌 Conectando a base de datos local y Turso...')

  const local = createClient({ url: LOCAL_DB_PATH })
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })

  try {
    // ── Limpiar Turso primero (orden inverso por FK) ──────────────────────────
    console.log('🧹 Limpiando datos existentes en Turso...')
    await turso.execute('DELETE FROM "Vacation"')
    await turso.execute('DELETE FROM "Holiday"')
    await turso.execute('DELETE FROM "Assignment"')
    await turso.execute('DELETE FROM "Project"')
    await turso.execute('DELETE FROM "Resource"')
    console.log('   ✓ Datos anteriores eliminados')

    // ── Resources ─────────────────────────────────────────────────────────────
    const resources = await local.execute('SELECT * FROM "Resource"')
    if (resources.rows.length > 0) {
      for (const r of resources.rows) {
        await turso.execute({
          sql: `INSERT INTO "Resource" (id, name, country, color, "capacityH", "createdAt")
                VALUES (?, ?, ?, ?, ?, ?)`,
          args: [r.id, r.name, r.country, r.color, r.capacityH, r.createdAt],
        })
      }
      console.log(`   ✓ ${resources.rows.length} recursos migrados`)
    }

    // ── Projects ──────────────────────────────────────────────────────────────
    const projects = await local.execute('SELECT * FROM "Project"')
    if (projects.rows.length > 0) {
      for (const p of projects.rows) {
        await turso.execute({
          sql: `INSERT INTO "Project" (id, name, color, status, priority, "startDate", "endDate",
                "estimatedHours", "costPerHour", notes, "createdAt")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [p.id, p.name, p.color, p.status, p.priority, p.startDate, p.endDate,
                 p.estimatedHours, p.costPerHour, p.notes, p.createdAt],
        })
      }
      console.log(`   ✓ ${projects.rows.length} proyectos migrados`)
    }

    // ── Assignments ───────────────────────────────────────────────────────────
    const assignments = await local.execute('SELECT * FROM "Assignment"')
    if (assignments.rows.length > 0) {
      for (const a of assignments.rows) {
        await turso.execute({
          sql: `INSERT INTO "Assignment" (id, "projectId", "resourceId", "moduleName", percentage,
                "startDate", "endDate", "estimatedHours")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [a.id, a.projectId, a.resourceId, a.moduleName, a.percentage,
                 a.startDate, a.endDate, a.estimatedHours],
        })
      }
      console.log(`   ✓ ${assignments.rows.length} asignaciones migradas`)
    }

    // ── Holidays ──────────────────────────────────────────────────────────────
    const holidays = await local.execute('SELECT * FROM "Holiday"')
    if (holidays.rows.length > 0) {
      for (const h of holidays.rows) {
        await turso.execute({
          sql: `INSERT INTO "Holiday" (id, "resourceId", date, name) VALUES (?, ?, ?, ?)`,
          args: [h.id, h.resourceId, h.date, h.name],
        })
      }
      console.log(`   ✓ ${holidays.rows.length} feriados migrados`)
    }

    // ── Vacations ─────────────────────────────────────────────────────────────
    const vacations = await local.execute('SELECT * FROM "Vacation"')
    if (vacations.rows.length > 0) {
      for (const v of vacations.rows) {
        await turso.execute({
          sql: `INSERT INTO "Vacation" (id, "resourceId", "startDate", "endDate", notes)
                VALUES (?, ?, ?, ?, ?)`,
          args: [v.id, v.resourceId, v.startDate, v.endDate, v.notes],
        })
      }
      console.log(`   ✓ ${vacations.rows.length} vacaciones migradas`)
    }

    // ── Resumen ───────────────────────────────────────────────────────────────
    console.log('\n🎉 Migración completada exitosamente!')
    console.log(`   Resources:   ${resources.rows.length}`)
    console.log(`   Projects:    ${projects.rows.length}`)
    console.log(`   Assignments: ${assignments.rows.length}`)
    console.log(`   Holidays:    ${holidays.rows.length}`)
    console.log(`   Vacations:   ${vacations.rows.length}`)

  } catch (err) {
    console.error('❌ Error durante la migración:', err)
    process.exit(1)
  } finally {
    local.close()
    turso.close()
  }
}

migrate()
