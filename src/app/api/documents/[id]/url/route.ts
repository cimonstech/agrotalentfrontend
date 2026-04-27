import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select('id, file_url, user_id')
      .eq('id', params.id)
      .maybeSingle()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    const r2Response = await fetch(doc.file_url)
    if (!r2Response.ok) {
      return NextResponse.json(
        { error: 'Could not fetch document' },
        { status: 502 }
      )
    }

    const contentType =
      r2Response.headers.get('content-type') ?? 'application/octet-stream'
    const buffer = await r2Response.arrayBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
        'Content-Disposition': 'inline',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (err) {
    console.error('Document URL error:', err)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
