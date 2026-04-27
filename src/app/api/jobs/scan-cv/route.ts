import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CANDIDATE_EXTRACTION_PROMPT = `You are a CV parser for agricultural jobs in Ghana. Extract candidate details and return ONLY valid JSON with no markdown, no backticks.

Return this exact structure:
{
  "qualification": string or null,
  "experience_years": number or null,
  "specialization": one of ["crop","livestock","agribusiness","fisheries","forestry","soil_science","agricultural_engineering","food_science","other"] or null,
  "skills": string or null,
  "location": one of the 17 Ghana regions or null,
  "city": string or null,
  "institution": string or null
}`

export async function POST(req: NextRequest) {
  try {
    const { cv_url } = (await req.json()) as { cv_url: string }

    if (!cv_url) {
      return NextResponse.json({ error: 'cv_url is required' }, { status: 400 })
    }

    const cvResponse = await fetch(cv_url)
    if (!cvResponse.ok) {
      return NextResponse.json({ error: 'Could not fetch CV from URL' }, { status: 400 })
    }

    const contentType = cvResponse.headers.get('content-type') ?? 'application/pdf'
    const buffer = await cvResponse.arrayBuffer()
    const base64 = Buffer.from(buffer).toString('base64')

    const isPdf = contentType.includes('pdf')
    const isImage = contentType.includes('image')

    let response

    if (isPdf) {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            { type: 'text', text: CANDIDATE_EXTRACTION_PROMPT },
          ],
        }],
      })
    } else if (isImage) {
      const mediaType = contentType.includes('png')
        ? 'image/png'
        : contentType.includes('webp')
          ? 'image/webp'
          : 'image/jpeg'
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
                data: base64,
              },
            },
            { type: 'text', text: CANDIDATE_EXTRACTION_PROMPT },
          ],
        }],
      })
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const cleaned = textContent.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim()

    const extracted = JSON.parse(cleaned)
    return NextResponse.json({ success: true, data: extracted })
  } catch (err) {
    console.error('Scan CV error:', err)
    return NextResponse.json({ error: 'Failed to scan CV' }, { status: 500 })
  }
}
