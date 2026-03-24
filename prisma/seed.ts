import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.assignment.deleteMany()
  await prisma.vacation.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.project.deleteMany()
  await prisma.resource.deleteMany()

  // ── RESOURCES ──────────────────────────────────────────────
  const pablo = await prisma.resource.create({
    data: { name: 'Pablo', country: 'Argentina', color: '#2E75B6', capacityH: 8 },
  })
  const betsabe = await prisma.resource.create({
    data: { name: 'Betsabé', country: 'Argentina', color: '#548235', capacityH: 8 },
  })
  const will = await prisma.resource.create({
    data: { name: 'Will', country: 'Uruguay', color: '#C55A11', capacityH: 8 },
  })
  const marcelo = await prisma.resource.create({
    data: { name: 'Marcelo', country: 'Chile', color: '#7030A0', capacityH: 8 },
  })
  const claudio = await prisma.resource.create({
    data: { name: 'Claudio', country: 'Argentina', color: '#0070C0', capacityH: 8 },
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
    for (const resourceId of [pablo.id, betsabe.id, claudio.id]) {
      await prisma.holiday.create({ data: { resourceId, date: h.date, name: h.name } })
    }
  }

  const willHolidays = [
    { date: new Date('2026-04-02T12:00:00Z'), name: 'Semana Santa' },
    { date: new Date('2026-04-03T12:00:00Z'), name: 'Semana Santa' },
    { date: new Date('2026-05-01T12:00:00Z'), name: 'Día de los Trabajadores' },
  ]
  for (const h of willHolidays) {
    await prisma.holiday.create({ data: { resourceId: will.id, date: h.date, name: h.name } })
  }

  const marceloHolidays = [
    { date: new Date('2026-04-03T12:00:00Z'), name: 'Viernes Santo' },
    { date: new Date('2026-05-01T12:00:00Z'), name: 'Día del Trabajador' },
    { date: new Date('2026-05-21T12:00:00Z'), name: 'Día de las Glorias Navales' },
  ]
  for (const h of marceloHolidays) {
    await prisma.holiday.create({ data: { resourceId: marcelo.id, date: h.date, name: h.name } })
  }

  console.log('✅ Holidays created')

  // ── VACATIONS ──────────────────────────────────────────────
  await prisma.vacation.create({
    data: {
      resourceId: pablo.id,
      startDate: new Date('2026-04-06T12:00:00Z'),
      endDate: new Date('2026-04-30T12:00:00Z'),
      notes: '19 días hábiles',
    },
  })
  await prisma.vacation.create({
    data: {
      resourceId: betsabe.id,
      startDate: new Date('2026-03-30T12:00:00Z'),
      endDate: new Date('2026-04-03T12:00:00Z'),
      notes: '5 días hábiles',
    },
  })
  await prisma.vacation.create({
    data: {
      resourceId: will.id,
      startDate: new Date('2026-04-08T12:00:00Z'),
      endDate: new Date('2026-04-21T12:00:00Z'),
      notes: '10 días hábiles',
    },
  })

  console.log('✅ Vacations created')

  // ── PROJECTS ───────────────────────────────────────────────
  const ameba = await prisma.project.create({
    data: {
      name: 'Ameba',
      color: '#1F7391',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-16T12:00:00Z'),
      endDate: new Date('2026-03-27T12:00:00Z'),
      estimatedHours: 18,
      costPerHour: 75,
    },
  })

  const breinchild = await prisma.project.create({
    data: {
      name: 'Breinchild',
      color: '#7D3C98',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-16T12:00:00Z'),
      endDate: new Date('2026-03-27T12:00:00Z'),
      estimatedHours: 18,
      costPerHour: 75,
    },
  })

  const mob = await prisma.project.create({
    data: {
      name: 'MOB',
      color: '#2E75B6',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-23T12:00:00Z'),
      endDate: new Date('2026-05-15T12:00:00Z'),
      estimatedHours: 39,
      costPerHour: 75,
    },
  })

  const idealProtein = await prisma.project.create({
    data: {
      name: 'Ideal Protein',
      color: '#0070C0',
      status: 'En ejecución',
      priority: 'Alta',
      startDate: new Date('2026-03-02T12:00:00Z'),
      endDate: new Date('2026-04-30T12:00:00Z'),
      estimatedHours: 40,
      costPerHour: 60,
    },
  })

  const starCenter = await prisma.project.create({
    data: {
      name: 'StarCenter',
      color: '#548235',
      status: 'En ejecución',
      priority: 'Media',
      startDate: new Date('2026-03-04T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 40,
      costPerHour: 70,
    },
  })

  const smartWay = await prisma.project.create({
    data: {
      name: 'SmartWay',
      color: '#C55A11',
      status: 'Próximo',
      priority: 'Media',
      startDate: new Date('2026-03-23T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 100,
      costPerHour: 65,
    },
  })

  const m3c = await prisma.project.create({
    data: {
      name: 'M3C',
      color: '#7030A0',
      status: 'En planificación',
      priority: 'Baja',
      startDate: new Date('2026-03-23T12:00:00Z'),
      endDate: new Date('2026-06-23T12:00:00Z'),
      estimatedHours: 90,
      costPerHour: 80,
    },
  })

  const presales = await prisma.project.create({
    data: {
      name: 'Presales',
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
      // Ameba
      {
        projectId: ameba.id,
        resourceId: pablo.id,
        moduleName: 'Desarrollo',
        percentage: 25,
        startDate: new Date('2026-03-16T12:00:00Z'),
        endDate: new Date('2026-03-27T12:00:00Z'),
        estimatedHours: 18,
      },
      // Breinchild
      {
        projectId: breinchild.id,
        resourceId: pablo.id,
        moduleName: 'Desarrollo',
        percentage: 25,
        startDate: new Date('2026-03-16T12:00:00Z'),
        endDate: new Date('2026-03-27T12:00:00Z'),
        estimatedHours: 18,
      },
      // MOB
      {
        projectId: mob.id,
        resourceId: pablo.id,
        moduleName: 'Backend / API + QA',
        percentage: 75,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-05-15T12:00:00Z'),
        estimatedHours: 30,
      },
      {
        projectId: mob.id,
        resourceId: claudio.id,
        moduleName: 'PM',
        percentage: 20,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-05-15T12:00:00Z'),
        estimatedHours: 9,
      },
      // Ideal Protein
      {
        projectId: idealProtein.id,
        resourceId: will.id,
        moduleName: 'Diseño & Frontend (dem)',
        percentage: 25,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-04-30T12:00:00Z'),
        estimatedHours: 40,
      },
      // StarCenter
      {
        projectId: starCenter.id,
        resourceId: betsabe.id,
        moduleName: 'Análisis & Desarrollo',
        percentage: 50,
        startDate: new Date('2026-03-04T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 35,
      },
      {
        projectId: starCenter.id,
        resourceId: claudio.id,
        moduleName: 'PM',
        percentage: 15,
        startDate: new Date('2026-03-04T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 5,
      },
      // SmartWay
      {
        projectId: smartWay.id,
        resourceId: will.id,
        moduleName: 'Fase 1 – Backend',
        percentage: 50,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-05-10T12:00:00Z'),
        estimatedHours: 50,
      },
      {
        projectId: smartWay.id,
        resourceId: will.id,
        moduleName: 'Fase 2 – Integración',
        percentage: 50,
        startDate: new Date('2026-05-11T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 50,
      },
      {
        projectId: smartWay.id,
        resourceId: claudio.id,
        moduleName: 'PM',
        percentage: 15,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 10,
      },
      // M3C
      {
        projectId: m3c.id,
        resourceId: will.id,
        moduleName: 'Análisis & Arquitectura',
        percentage: 50,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 80,
      },
      {
        projectId: m3c.id,
        resourceId: claudio.id,
        moduleName: 'PM / Kick-off',
        percentage: 10,
        startDate: new Date('2026-03-23T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 10,
      },
      // Presales
      {
        projectId: presales.id,
        resourceId: betsabe.id,
        moduleName: 'Actividades de Preventa',
        percentage: 50,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 150,
      },
      {
        projectId: presales.id,
        resourceId: will.id,
        moduleName: 'Actividades de Preventa',
        percentage: 50,
        startDate: new Date('2026-03-02T12:00:00Z'),
        endDate: new Date('2026-06-23T12:00:00Z'),
        estimatedHours: 150,
      },
      {
        projectId: presales.id,
        resourceId: marcelo.id,
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
