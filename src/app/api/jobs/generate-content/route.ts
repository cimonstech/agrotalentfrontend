import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const {
      field,
      jobTitle,
      jobType,
      location,
      qualification,
      specialization,
      experienceYears,
    } = (await req.json()) as {
      field: 'description' | 'responsibilities' | 'requirements'
      jobTitle: string
      jobType?: string
      location?: string
      qualification?: string
      specialization?: string
      experienceYears?: number
    }

    if (!jobTitle) {
      return NextResponse.json(
        { error: 'Job title is required to generate content' },
        { status: 400 }
      )
    }

    const context = `
Job Title: ${jobTitle}
Job Type: ${jobType ?? 'Not specified'}
Location: ${location ?? 'Ghana'}
Qualification: ${qualification ?? 'Not specified'}
Specialization: ${specialization ?? 'Not specified'}
Experience Required: ${experienceYears ? `${experienceYears} years` : 'Not specified'}
    `.trim()

    let prompt = ''

    if (field === 'description') {
      prompt = `Write a professional job description for an agricultural position in Ghana with these details:
${context}

Write 2-3 paragraphs covering: what the role involves, what kind of farm/employer this is for, and the opportunity it presents.
Return ONLY the HTML content using <p> tags. No headings. No markdown. Professional tone appropriate for Ghana's agricultural sector.`
    }

    if (field === 'responsibilities') {
      prompt = `Write 6-8 key responsibilities for this agricultural job in Ghana:
${context}

Return ONLY an HTML unordered list: <ul><li>responsibility 1</li><li>responsibility 2</li>...</ul>
Each responsibility should be one clear, action-oriented sentence starting with a verb.
No markdown, no extra text, just the HTML list.`
    }

    if (field === 'requirements') {
      prompt = `Write 5-7 candidate requirements for this agricultural job in Ghana:
${context}

Return ONLY an HTML unordered list: <ul><li>requirement 1</li><li>requirement 2</li>...</ul>
Include education, experience, skills, and any certifications relevant to Ghana's agricultural sector.
No markdown, no extra text, just the HTML list.`
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const textContent = response.content.find((c) => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    const html = textContent.text
      .replace(/```html/g, '')
      .replace(/```/g, '')
      .trim()

    return NextResponse.json({ success: true, html })
  } catch (err) {
    console.error('Generate content error:', err)
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
