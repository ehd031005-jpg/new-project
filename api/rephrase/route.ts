import { NextRequest, NextResponse } from 'next/server'
import { rephraseText } from '@/lib/openai'

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

    const { text } = body

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // 텍스트 길이 제한 (500자)
    const textToRephrase = text.length > 500 ? text.substring(0, 500) : text

    try {
      const rephrased = await rephraseText(textToRephrase)
      return NextResponse.json(rephrased)
    } catch (error: any) {
      console.error('Error rephrasing text:', error)
      
      // Fallback: 기본 변환 제공
      const fallback = {
        beginner: textToRephrase,
        intermediate: textToRephrase,
        advanced: textToRephrase,
      }
      
      return NextResponse.json({ 
        ...fallback,
        fallback: true 
      })
    }
  } catch (error) {
    console.error('Error in rephrase API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



