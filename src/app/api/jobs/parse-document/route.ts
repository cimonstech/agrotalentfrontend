import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const EXTRACTION_PROMPT = `You are a job details extractor. Extract job information from the provided document or image and return ONLY valid JSON with no markdown, no backticks, no explanation.

Return this exact JSON structure:
{
  "title": string or null,
  "job_type": one of exactly ["farm_hand","farm_manager","intern","nss","data_collector"] or null,
  "location": one of exactly ["Greater Accra","Ashanti","Western","Eastern","Central","Volta","Northern","Upper East","Upper West","Brong Ahafo","Western North","Ahafo","Bono","Bono East","Oti","Savannah","North East"] or null,
  "description": string (full job description as HTML with <p>, <ul>, <li>, <strong> tags) or null,
  "responsibilities": string (formatted as HTML <ul><li> list) or null,
  "requirements": string (formatted as HTML <ul><li> list) or null,
  "qualification": string or null,
  "specialization": one of exactly ["crop","livestock","agribusiness","fisheries","forestry","soil_science","agricultural_engineering","food_science","other"] or null,
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

If a field cannot be found, set it to null and set confidence to "low".
For job_type, map the closest match: farm hand/labourer = farm_hand, manager/supervisor = farm_manager, intern/internship = intern, NSS/national service = nss, data/survey = data_collector.
For location, match to the closest Ghana region name exactly as listed.
Salary should be extracted as numbers only, no currency symbols.`

const CANDIDATE_EXTRACTION_PROMPT = `You are a CV/resume parser for agricultural jobs in Ghana. Extract candidate details from this CV and return ONLY valid JSON with no markdown, no backticks, no explanation.

Return this exact JSON structure:
{
  "qualification": string or null (e.g. "BSc Agriculture", "HND", "Diploma"),
  "experience_years": number or null (total years of work experience),
  "specialization": one of exactly ["crop","livestock","agribusiness","fisheries","forestry","soil_science","agricultural_engineering","food_science","other"] or null,
  "skills": string or null (comma-separated list of key skills),
  "location": one of exactly ["Greater Accra","Ashanti","Western","Eastern","Central","Volta","Northern","Upper East","Upper West","Brong Ahafo","Western North","Ahafo","Bono","Bono East","Oti","Savannah","North East"] or null,
  "city": string or null (specific city or town mentioned),
  "institution": string or null (name of university or college)
}`

export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType, extractForCandidate } = (await req.json()) as {
      base64: string
      mediaType: string
      fileName?: string
      extractForCandidate?: boolean
    }

    if (!base64 || !mediaType) {
      return NextResponse.json({ error: 'Missing file data' }, { status: 400 })
    }

    const prompt = extractForCandidate
      ? CANDIDATE_EXTRACTION_PROMPT
      : EXTRACTION_PROMPT

    const isPdf = mediaType === 'application/pdf'
    let response: Awaited<ReturnType<typeof client.messages.create>>

    if (isPdf) {
      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      })
    } else {
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ]
      if (!validImageTypes.includes(mediaType)) {
        return NextResponse.json(
          {
            error: 'Unsupported file type. Use PDF, JPG, PNG, or WEBP.',
          },
          { status: 400 }
        )
      }

      response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as
                    | 'image/jpeg'
                    | 'image/png'
                    | 'image/webp'
                    | 'image/gif',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      })
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
    console.error('Parse document error:', err)
    return NextResponse.json(
      { error: 'Failed to parse document' },
      { status: 500 }
    )
  }
}
