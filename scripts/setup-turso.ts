/**
 * Script para inicializar la base de datos Turso:
 * 1. Crea las tablas (si no existen)
 * 2. Ejecuta el seed con datos iniciales
 *
 * Uso: npx ts-node --compiler-options {"module":"CommonJS"} scripts/setup-turso.ts
 * Requiere: TURSO_DATABASE_URL y TURSO_AUTH_TOKEN en .env
 */

import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config()

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Crear tablas directamente con @libsql/client
async function createTables() {
  console.log('📦 Creando tablas en Turso...')

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Resource" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "country" TEXT NOT NULL,
      "color" TEXT NOT NULL DEFAULT '#4472C4',
      "capacityH" INTEGER NOT NULL DEFAULT 8,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Project" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "name" TEXT NOT NULL,
      "color" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "estimatedHours" INTEGER NOT NULL,
      "costPerHour" REAL NOT NULL DEFAULT 0,
      "notes" TEXT NOT NULL DEFAULT '',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS "Assignment" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "projectId" INTEGER NOT NULL,
      "resourceId" INTEGER NOT NULL,
      "moduleName" TEXT NOT NULL,
      "percentage" INTEGER NOT NULL,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "estimatedHours" INTEGER NOT NULL,
      CONSTRAINT "Assignment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Assignment_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Holiday" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "resourceId" INTEGER NOT NULL,
      "date" DATETIME NOT NULL,
      "name" TEXT NOT NULL,
      CONSTRAINT "Holiday_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Vacation" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "resourceId" INTEGER NOT NULL,
      "startDate" DATETIME NOT NULL,
      "endDate" DATETIME NOT NULL,
      "notes" TEXT NOT NULL DEFAULT '',
      CONSTRAINT "Vacation_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "Resource" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Resource_name_key" ON "Resource"("name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Project_name_key" ON "Project"("name")`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Holiday_resourceId_date_key" ON "Holiday"("resourceId", "date")`,
  ]

  for (const sql of statements) {
    await libsql.execute(sql)
  }
  console.log('✅ Tablas creadas correctamente')
}

// Seed con Prisma usando el adapter de Turso
async function seedData() {
  console.log('🌱 Insertando datos iniciales...')

  const adapter = new PrismaLibSQL(libsql)
  const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

  // Limpiar datos existentes
  await prisma.assignment.deleteMany()
  await prisma.vacation.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.project.deleteMany()
  await prisma.resource.deleteMany()

  // Recursos
  const [pablo, betsabe, will, marcelo, claudio] = await Promise.all([
    prisma.resource.create({ data: { name: 'Pablo', country: 'Argentina', color: '#4472C4', capacityH: 8 } }),
    prisma.resource.create({ data: { name: 'Betsabé', country: 'Uruguay', color: '#ED7D31', capacityH: 8 } }),
    prisma.resource.create({ data: { name: 'Will', country: 'Chile', color: '#A9D18E', capacityH: 8 } }),
    prisma.resource.create({ data: { name: 'Marcelo', country: 'Argentina', color: '#FF0000', capacityH: 8 } }),
    prisma.resource.create({ data: { name: 'Claudio', country: 'Argentina', color: '#7030A0', capacityH: 8 } }),
  ])
  console.log('  ✓ Recursos creados')

  // Proyectos
  const [smartway, cidi, notificaciones, rrhh, seguridad, compras, reportes, mantenimiento] = await Promise.all([
    prisma.project.create({ data: { name: 'SmartWay', color: '#4472C4', status: 'En ejecución', priority: 'Alta', startDate: new Date('2026-03-02'), endDate: new Date('2026-06-30'), estimatedHours: 320, costPerHour: 75, notes: 'Proyecto principal' } }),
    prisma.project.create({ data: { name: 'CIDI', color: '#ED7D31', status: 'En ejecución', priority: 'Alta', startDate: new Date('2026-03-02'), endDate: new Date('2026-05-31'), estimatedHours: 240, costPerHour: 80 } }),
    prisma.project.create({ data: { name: 'Notificaciones', color: '#A9D18E', status: 'Próximo', priority: 'Media', startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'), estimatedHours: 180, costPerHour: 70 } }),
    prisma.project.create({ data: { name: 'RRHH Digital', color: '#FF0000', status: 'En planificación', priority: 'Media', startDate: new Date('2026-05-01'), endDate: new Date('2026-07-31'), estimatedHours: 160, costPerHour: 75 } }),
    prisma.project.create({ data: { name: 'Seguridad', color: '#7030A0', status: 'Continuo', priority: 'Alta', startDate: new Date('2026-03-02'), endDate: new Date('2026-12-31'), estimatedHours: 400, costPerHour: 90 } }),
    prisma.project.create({ data: { name: 'Compras Online', color: '#00B0F0', status: 'En ejecución', priority: 'Alta', startDate: new Date('2026-03-09'), endDate: new Date('2026-06-23'), estimatedHours: 280, costPerHour: 78 } }),
    prisma.project.create({ data: { name: 'Reportes BI', color: '#FFC000', status: 'Próximo', priority: 'Baja', startDate: new Date('2026-04-13'), endDate: new Date('2026-06-23'), estimatedHours: 120, costPerHour: 65 } }),
    prisma.project.create({ data: { name: 'Mantenimiento', color: '#808080', status: 'Continuo', priority: 'Media', startDate: new Date('2026-03-02'), endDate: new Date('2026-12-31'), estimatedHours: 200, costPerHour: 60 } }),
  ])
  console.log('  ✓ Proyectos creados')

  // Asignaciones
  await prisma.assignment.createMany({ data: [
    { projectId: smartway.id, resourceId: pablo.id, moduleName: 'Backend API', percentage: 75, startDate: new Date('2026-03-02'), endDate: new Date('2026-06-30'), estimatedHours: 200 },
    { projectId: smartway.id, resourceId: will.id, moduleName: 'Frontend', percentage: 50, startDate: new Date('2026-03-02'), endDate: new Date('2026-06-30'), estimatedHours: 120 },
    { projectId: cidi.id, resourceId: betsabe.id, moduleName: 'UX/UI', percentage: 100, startDate: new Date('2026-03-02'), endDate: new Date('2026-05-31'), estimatedHours: 200 },
    { projectId: cidi.id, resourceId: marcelo.id, moduleName: 'QA', percentage: 50, startDate: new Date('2026-03-16'), endDate: new Date('2026-05-31'), estimatedHours: 80 },
    { projectId: notificaciones.id, resourceId: claudio.id, moduleName: 'Microservicio', percentage: 75, startDate: new Date('2026-04-01'), endDate: new Date('2026-06-30'), estimatedHours: 140 },
    { projectId: seguridad.id, resourceId: pablo.id, moduleName: 'Auditoría', percentage: 25, startDate: new Date('2026-03-02'), endDate: new Date('2026-12-31'), estimatedHours: 100 },
    { projectId: compras.id, resourceId: will.id, moduleName: 'Catálogo', percentage: 50, startDate: new Date('2026-03-09'), endDate: new Date('2026-06-23'), estimatedHours: 130 },
    { projectId: compras.id, resourceId: betsabe.id, moduleName: 'Diseño', percentage: 50, startDate: new Date('2026-03-09'), endDate: new Date('2026-05-15'), estimatedHours: 100 },
    { projectId: reportes.id, resourceId: marcelo.id, moduleName: 'Dashboards', percentage: 100, startDate: new Date('2026-04-13'), endDate: new Date('2026-06-23'), estimatedHours: 120 },
    { projectId: mantenimiento.id, resourceId: claudio.id, moduleName: 'Soporte', percentage: 25, startDate: new Date('2026-03-02'), endDate: new Date('2026-06-23'), estimatedHours: 80 },
    { projectId: rrhh.id, resourceId: pablo.id, moduleName: 'Módulo licencias', percentage: 50, startDate: new Date('2026-05-01'), endDate: new Date('2026-07-31'), estimatedHours: 100 },
    { projectId: smartway.id, resourceId: claudio.id, moduleName: 'DevOps', percentage: 25, startDate: new Date('2026-03-02'), endDate: new Date('2026-06-30'), estimatedHours: 60 },
  ]})
  console.log('  ✓ Asignaciones creadas')

  // Feriados Argentina
  const argResources = [pablo.id, marcelo.id, claudio.id]
  const argHolidays = [
    { date: new Date('2026-03-23'), name: 'Lunes de Carnaval' },
    { date: new Date('2026-03-24'), name: 'Día de la Memoria' },
    { date: new Date('2026-04-02'), name: 'Día del Veterano' },
    { date: new Date('2026-04-03'), name: 'Viernes Santo' },
    { date: new Date('2026-05-01'), name: 'Día del Trabajador' },
    { date: new Date('2026-05-25'), name: 'Día de la Patria' },
    { date: new Date('2026-06-15'), name: 'Paso a la Inmortalidad del Gral. Güemes' },
    { date: new Date('2026-06-22'), name: 'Paso a la Inmortalidad del Gral. Belgrano' },
  ]
  for (const resourceId of argResources) {
    for (const h of argHolidays) {
      await prisma.holiday.upsert({ where: { resourceId_date: { resourceId, date: h.date } }, update: {}, create: { resourceId, date: h.date, name: h.name } })
    }
  }

  // Feriados Uruguay
  const uyHolidays = [
    { date: new Date('2026-03-23'), name: 'Lunes de Carnaval' },
    { date: new Date('2026-04-03'), name: 'Viernes Santo' },
    { date: new Date('2026-05-01'), name: 'Día del Trabajo' },
    { date: new Date('2026-05-18'), name: 'Batalla de Las Piedras' },
    { date: new Date('2026-06-19'), name: 'Natalicio de Artigas' },
  ]
  for (const h of uyHolidays) {
    await prisma.holiday.upsert({ where: { resourceId_date: { resourceId: betsabe.id, date: h.date } }, update: {}, create: { resourceId: betsabe.id, date: h.date, name: h.name } })
  }

  // Feriados Chile
  const clHolidays = [
    { date: new Date('2026-04-03'), name: 'Viernes Santo' },
    { date: new Date('2026-05-01'), name: 'Día del Trabajo' },
    { date: new Date('2026-05-21'), name: 'Día de las Glorias Navales' },
    { date: new Date('2026-06-29'), name: 'San Pedro y San Pablo' },
  ]
  for (const h of clHolidays) {
    await prisma.holiday.upsert({ where: { resourceId_date: { resourceId: will.id, date: h.date } }, update: {}, create: { resourceId: will.id, date: h.date, name: h.name } })
  }
  console.log('  ✓ Feriados creados')

  // Vacaciones
  await prisma.vacation.createMany({ data: [
    { resourceId: pablo.id, startDate: new Date('2026-04-06'), endDate: new Date('2026-04-30'), notes: 'Vacaciones de Semana Santa' },
    { resourceId: betsabe.id, startDate: new Date('2026-03-30'), endDate: new Date('2026-04-03'), notes: 'Semana Santa' },
    { resourceId: will.id, startDate: new Date('2026-04-08'), endDate: new Date('2026-04-21'), notes: 'Vacaciones' },
  ]})
  console.log('  ✓ Vacaciones creadas')

  await prisma.$disconnect()
  console.log('\n🎉 Base de datos Turso inicializada correctamente!')
}

async function main() {
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('❌ Falta TURSO_DATABASE_URL en .env')
    process.exit(1)
  }
  await createTables()
  await seedData()
}

main().catch((e) => { console.error(e); process.exit(1) })
