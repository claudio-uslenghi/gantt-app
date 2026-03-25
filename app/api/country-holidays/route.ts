export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') ?? undefined
  const holidays = await prisma.countryHoliday.findMany({
    where: country ? { country } : undefined,
    orderBy: [{ country: 'asc' }, { date: 'asc' }],
  })
  return NextResponse.json(holidays)
}
