import { NextRequest, NextResponse } from 'next/server'

// Attendance is admin-controlled (manual check-in) for MVP.
export async function POST(_request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
