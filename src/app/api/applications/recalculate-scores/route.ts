import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const apiUrl = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
    const secret = process.env.INTERNAL_API_SECRET ?? ''

    const res = await fetch(`${apiUrl}/api/applications/recalculate-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': secret,
      },
    })

    const data = (await res.json()) as {
      success?: boolean
      updated?: number
      error?: string
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? 'Recalculation failed' },
        { status: res.status }
      )
    }

    return NextResponse.json({ success: true, updated: data.updated ?? 0 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed' },
      { status: 500 }
    )
  }
}
