import { NextRequest, NextResponse } from 'next/server'
import { getWritingFeedback } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { text, articleId, articleTitle, articleContent, level, question } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
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

