import { NextRequest, NextResponse } from 'next/server'
import { rephraseText } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
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



