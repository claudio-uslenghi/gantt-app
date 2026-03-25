export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO, parse, isValid } from 'date-fns'

function parseDate(raw: string): Date | null {
  const trimmed = raw.trim()
  let d: Date | null = null
  // Try YYYY-MM-DD
  const iso = parseISO(trimmed)
  if (isValid(iso)) d = iso
  // Try DD/MM/YYYY
  else {
    const dmy = parse(trimmed, 'dd/MM/yyyy', new Date())
    if (isValid(dmy)) d = dmy
  }
  if (!d) return null
  // Store at noon UTC so the date is correct in any timezone (UTC-12 to UTC+12)
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const items: { country: string; date: string; name: string }[] = body.holidays ?? []

  if (!items.length) return NextResponse.json({ error: 'No hay feriados' }, { status: 400 })

  // Group by country
  const byCountry = new Map<string, { date: Date; name: string }[]>()
  for (const item of items) {
    const d = parseDate(item.date)
    if (!d || !item.country || !item.name) continue
    if (!byCountry.has(item.country)) byCountry.set(item.country, [])
    byCountry.get(item.country)!.push({ date: d, name: item.name.trim() })
  }

  let totalCountryHolidays = 0
  let totalResourceHolidays = 0

  for (const [country, holidays] of Array.from(byCountry.entries())) {
    // Upsert CountryHoliday records
    for (const h of holidays) {
      await prisma.countryHoliday.upsert({
        where: { country_date: { country, date: h.date } },
        create: { country, date: h.date, name: h.name },
        update: { name: h.name },
      })
      totalCountryHolidays++
    }

    // Sync to Holiday for all resources of this country
    const resources = await prisma.resource.findMany({ where: { country } })
    for (const resource of resources) {
      for (const h of holidays) {
        await prisma.holiday.upsert({
          where: { resourceId_date: { resourceId: resource.id, date: h.date } },
          create: { resourceId: resource.id, date: h.date, name: h.name },
          update: { name: h.name },
        })
        totalResourceHolidays++
      }
    }
  }

  return NextResponse.json({ totalCountryHolidays, totalResourceHolidays })
}
