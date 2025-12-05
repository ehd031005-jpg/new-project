import { NextRequest, NextResponse } from 'next/server'
import { getWritingFeedback } from '@/lib/openai'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { text, articleId, articleTitle, articleContent, level, question } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    const feedback = await getWritingFeedback(text, articleId, articleTitle, articleContent, level, question)

    return NextResponse.json({ feedback })
  } catch (error) {
    console.error('Error in writing feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

