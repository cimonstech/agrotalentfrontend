import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { text } = (await req.json()) as { text: string }

    if (!text || text.trim().length < 20) {
      return NextResponse.json(
        { error: 'Text too short to parse' },
        { status: 400 }
      )
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `You are a job details extractor. Extract job information from this text and return ONLY valid JSON with no markdown, no backticks, no explanation.

Return this exact JSON structure:
{
  "title": string or null,
  "job_type": one of exactly ["farm_hand","farm_manager","intern","nss","data_collector"] or null,
  "location": one of exactly ["Greater Accra","Ashanti","Western","Eastern","Central","Volta","Northern","Upper East","Upper West","Brong Ahafo","Western North","Ahafo","Bono","Bono East","Oti","Savannah","North East"] or null,
  "description": string as HTML or null,
  "responsibilities": string as HTML ul/li list or null,
  "requirements": string as HTML ul/li list or null,
  "qualification": string or null,
  "specialization": one of ["crop","livestock","agribusiness","fisheries","forestry","soil_science","agricultural_engineering","food_science","other"] or null,
  "salary_min": number or null,
  "salary_max": number or null,
  "salary_currency": "GHS" or "USD" or null,
  "experience_years": number or null,
  "max_applications": number or null,
  "address": string or null,
  "confidence": {
    "title": "high" or "medium" or "low",
    "job_type": "high" or "medium" or "low",
    "location": "high" or "medium" or "low",
    "description": "high" or "medium" or "low",
    "salary_min": "high" or "medium" or "low",
    "salary_max": "high" or "medium" or "low",
    "experience_years": "high" or "medium" or "low",
    "qualification": "high" or "medium" or "low"
  }
}

Text to parse:
${text}`,
        },
      ],
    })

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
    console.error('Parse text error:', err)
    return NextResponse.json({ error: 'Failed to parse text' }, { status: 500 })
  }
}
