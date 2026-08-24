import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fictional demo data for local development only — no real staff, client,
// or rate information. See SPEC.md for why this matters in a public repo.
async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.assignment.deleteMany()
  await prisma.vacation.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.project.deleteMany()
  await prisma.resource.deleteMany()

  // ── RESOURCES ──────────────────────────────────────────────
  const ana = await prisma.resource.create({
    data: { name: 'Ana Demo', country: 'Argentina', color: '#2E75B6', capacityH: 8 },
  })
  const bruno = await prisma.resource.create({
    data: { name: 'Bruno Demo', country: 'Argentina', color: '#548235', capacityH: 8 },
  })
  const carla = await prisma.resource.create({
    data: { name: 'Carla Demo', country: 'Uruguay', color: '#C55A11', capacityH: 8 },
  })
  const diego = await prisma.resource.create({
    data: { name: 'Diego Demo', country: 'Chile', color: '#7030A0', capacityH: 8 },
  })
  const elena = await prisma.resource.create({
    data: { name: 'Elena Demo', country: 'Argentina', color: '#0070C0', capacityH: 8 },
  })

  console.log('✅ Resources created')

  // ── HOLIDAYS ───────────────────────────────────────────────
  const argHolidays = [
    { date: new Date('2026-03-24T12:00:00Z'), name: 'Día de la Memoria' },
    { date: new Date('2026-04-02T12:00:00Z'), name: 'Día del Veterano' },
    { date: new Date('2026-04-03T12:00:00Z'), name: 'Viernes Santo' },
    { date: new Date('2026-05-01T12:00:00Z'), name: 'Día del Trabajador' },
    { date: new Date('2026-05-25T12:00:00Z'), name: 'Revolución de Mayo' },
    { date: new Date('2026-06-15T12:00:00Z'), name: 'Paso a la Inmortalidad Gral. Güemes' },
  ]

  for (const h of argHolidays) {
    for (const resourceId of [ana.id, bruno.id, elena.id]) {
      await prisma.holiday.create({ data: { resourceId, date: h.date, name: h.name } })
    }
  }

  const carlaHolidays = [
    { date: new Date('2026-04-02T12:00:00Z'), name: 'Semana Santa' },
    { date: new Date('2026-04-03T12:00:00Z'), name: 'Semana Santa' },
    { date: new Date('2026-05-01T12:00:00Z'), name: 'Día de los Trabajadores' },
  ]
  for (const h of carlaHolidays) {
    await prisma.holiday.create({ data: { resourceId: carla.id, date: h.date, name: h.name } })
  }

  const diegoHolidays = [
    { date: new Date('2026-04-03T12:00:00Z'), name: 'Viernes Santo' },
    { date: new Date('2026-05-01T12:00:00Z'), name: 'Día del Trabajador' },
    { date: new Date('2026-05-21T12:00:00Z'), name: 'Día de las Glorias Navales' },
  ]
  for (const h of diegoHolidays) {
    await prisma.holiday.create({ data: { resourceId: diego.id, date: h.date, name: h.name } })
  }

  console.log('✅ Holidays created')

  // ── VACATIONS ──────────────────────────────────────────────
  await prisma.vacation.create({
    data: {
      resourceId: ana.id,
      startDate: new Date('2026-04-06T12:00:00Z'),
      endDate: new Date('2026-04-30T12:00:00Z'),
      notes: '19 días hábiles',
    },
  })
  await prisma.vacation.create({
    data: {
      resourceId: bruno.id,
      startDate: new Date('2026-03-30T12:00:00Z'),
      endDate: new Date('2026-04-03T12:00:00Z'),
      notes: '5 días hábiles',
    },
  })
  await prisma.vacation.create({
    data: {
      resourceId: carla.id,
      startDate: new Date('2026-04-08T12:00:00Z'),
      endDate: new Date('2026-04-21T12:00:00Z'),
      notes: '10 días hábiles',
    },
  })

  console.log('✅ Vacations created')

  // ── PROJECTS ───────────────────────────────────────────────
  const alpha = await prisma.project.create({
    data: {
      name: 'Proyecto Alpha',
      color: '#1F7391',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-16T12:00:00Z'),
      endDate: new Date('2026-03-27T12:00:00Z'),
      estimatedHours: 18,
      costPerHour: 50,
    },
  })

  const beta = await prisma.project.create({
    data: {
      name: 'Proyecto Beta',
      color: '#7D3C98',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-16T12:00:00Z'),
      endDate: new Date('2026-03-27T12:00:00Z'),
      estimatedHours: 18,
      costPerHour: 50,
    },
  })

  const gamma = await prisma.project.create({
    data: {
      name: 'Proyecto Gamma',
      color: '#2E75B6',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-23T12:00:00Z'),
      endDate: new Date('2026-05-15T12:00:00Z'),
      estimatedHours: 39,
      costPerHour: 50,
    },
  })

  const delta = await prisma.project.create({
    data: {
      name: 'Proyecto Delta',
      color: '#0070C0',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-02T12:00:00Z'),
      endDate: new Date('2026-04-30T12:00:00Z'),
      estimatedHours: 40,
      costPerHour: 50,
    },
  })

  const epsilon = await prisma.project.create({
    data: {
      name: 'Proyecto Epsilon',
      color: '#548235',
      status: 'En ejecución',
      priority: 'Media',
      startDate: new Date('2026-03-04T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 40,
      costPerHour: 50,
    },
  })

  const zeta = await prisma.project.create({
    data: {
      name: 'Proyecto Zeta',
      color: '#C55A11',
      status: 'Próximo',
      priority: 'Media',
      startDate: new Date('2026-03-23T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 100,
      costPerHour: 50,
    },
  })

  const eta = await prisma.project.create({
    data: {
      name: 'Proyecto Eta',
      color: '#7030A0',
      status: 'En planificación',
      priority: 'Baja',
      startDate: new Date('2026-03-23T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 90,
      costPerHour: 50,
    },
  })

  const preventa = await prisma.project.create({
    data: {
      name: 'Preventa',
      color: '#833C00',
      status: 'Continuo',
      priority: 'Alta',
      startDate: new Date('2026-03-02T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 600,
      costPerHour: 0,
    },
  })

  console.log('✅ Projects created')

  // ── ASSIGNMENTS ────────────────────────────────────────────
  await prisma.assignment.createMany({
    data: [
      // Alpha
      {
        projectId: alpha.id,
        resourceId: ana.id,
        moduleName: 'Desarrollo',
        percentage: 25,
        startDate: new Date('2026-03-16T12:00:00Z'),
        endDate: new Date('2026-03-27T12:00:00Z'),
        estimatedHours: 18,
      },
      // Beta
      {
        projectId: beta.id,
        resourceId: ana.id,
        moduleName: 'Desarrollo',
        percentage: 25,
        startDate: new Date('2026-03-16T12:00:00Z'),
        endDate: new Date('2026-03-27T12:00:00Z'),
        estimatedHours: 18,
      },
      // Gamma
      {
        projectId: gamma.id,
        resourceId: ana.id,
        moduleName: 'Backend / API + QA',
        percentage: 75,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-05-15T12:00:00Z'),
        estimatedHours: 30,
      },
      {
        projectId: gamma.id,
        resourceId: elena.id,
        moduleName: 'PM',
        percentage: 20,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-05-15T12:00:00Z'),
        estimatedHours: 9,
      },
      // Delta
      {
        projectId: delta.id,
        resourceId: carla.id,
        moduleName: 'Diseño & Frontend (dem)',
        percentage: 25,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-04-30T12:00:00Z'),
        estimatedHours: 40,
      },
      // Epsilon
      {
        projectId: epsilon.id,
        resourceId: bruno.id,
        moduleName: 'Análisis & Desarrollo',
        percentage: 50,
        startDate: new Date('2026-03-04T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 35,
      },
      {
        projectId: epsilon.id,
        resourceId: elena.id,
        moduleName: 'PM',
        percentage: 15,
        startDate: new Date('2026-03-04T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 5,
      },
      // Zeta
      {
        projectId: zeta.id,
        resourceId: carla.id,
        moduleName: 'Fase 1 – Backend',
        percentage: 50,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-05-10T12:00:00Z'),
        estimatedHours: 50,
      },
      {
        projectId: zeta.id,
        resourceId: carla.id,
        moduleName: 'Fase 2 – Integración',
        percentage: 50,
        startDate: new Date('2026-05-11T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 50,
      },
      {
        projectId: zeta.id,
        resourceId: elena.id,
        moduleName: 'PM',
        percentage: 15,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 10,
      },
      // Eta
      {
        projectId: eta.id,
        resourceId: carla.id,
        moduleName: 'Análisis & Arquitectura',
        percentage: 50,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 80,
      },
      {
        projectId: eta.id,
        resourceId: elena.id,
        moduleName: 'PM / Kick-off',
        percentage: 10,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 10,
      },
      // Preventa
      {
        projectId: preventa.id,
        resourceId: bruno.id,
        moduleName: 'Actividades de Preventa',
        percentage: 50,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 150,
      },
      {
        projectId: preventa.id,
        resourceId: carla.id,
        moduleName: 'Actividades de Preventa',
        percentage: 50,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 150,
      },
      {
        projectId: preventa.id,
        resourceId: diego.id,
        moduleName: 'Actividades de Preventa',
        percentage: 50,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 150,
      },
    ],
  })

  console.log('✅ Assignments created')
  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
