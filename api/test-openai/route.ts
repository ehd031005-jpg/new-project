import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

export async function GET() {
  try {
    const openaiKey = process.env.OPENAI_API_KEY
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY

    // API 키 확인
    if (!openaiKey && !googleKey) {
      return NextResponse.json({
        status: 'error',
        message: 'API 키가 설정되어 있지 않습니다. OPENAI_API_KEY 또는 GOOGLE_AI_API_KEY를 .env.local 파일에 설정해주세요.',
        hasKey: false,
      })
    }

    // Google AI API 테스트
    if (googleKey) {
      if (googleKey === 'your_api_key_here' || googleKey.length < 20) {
        return NextResponse.json({
          status: 'warning',
          message: 'Google AI API 키가 올바르게 설정되지 않은 것 같습니다.',
          hasKey: true,
          keyLength: googleKey.length,
          keyPreview: googleKey.substring(0, 7) + '...',
          apiType: 'Google AI',
        })
      }

      try {
        const genAI = new GoogleGenerativeAI(googleKey)
        // 최신 모델 사용 (gemini-2.5-pro)
        // 모델 이름에서 'models/' 접두사 제거
        const modelName = (process.env.GEMINI_MODEL || 'models/gemini-2.5-pro').replace(/^models\//, '')
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Say "API test successful" in one word.')
        const response = await result.response

        return NextResponse.json({
          status: 'success',
          message: 'Google AI (Gemini) API가 정상적으로 작동합니다!',
          hasKey: true,
          keyLength: googleKey.length,
          keyPreview: googleKey.substring(0, 7) + '...',
          testResponse: response.text(),
          apiType: 'Google AI (Gemini)',
        })
      } catch (apiError: any) {
        return NextResponse.json({
          status: 'error',
          message: 'Google AI API 키는 설정되어 있지만 연결에 실패했습니다.',
          hasKey: true,
          keyLength: googleKey.length,
          keyPreview: googleKey.substring(0, 7) + '...',
          error: apiError.message || 'Unknown error',
          apiType: 'Google AI',
        })
      }
    }

    // OpenAI API 테스트
    if (openaiKey) {
      if (openaiKey === 'your_openai_api_key_here' || openaiKey.length < 20) {
        return NextResponse.json({
          status: 'warning',
          message: 'OpenAI API 키가 올바르게 설정되지 않은 것 같습니다.',
          hasKey: true,
          keyLength: openaiKey.length,
          keyPreview: openaiKey.substring(0, 7) + '...',
          apiType: 'OpenAI',
        })
      }

      try {
        const openai = new OpenAI({
          apiKey: openaiKey,
        })

        const response = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'user',
              content: 'Say "API test successful" in one word.',
            },
          ],
          max_tokens: 10,
        })

        return NextResponse.json({
          status: 'success',
          message: 'OpenAI API가 정상적으로 작동합니다!',
          hasKey: true,
          keyLength: openaiKey.length,
          keyPreview: openaiKey.substring(0, 7) + '...',
          testResponse: response.choices[0].message.content,
          apiType: 'OpenAI',
        })
      } catch (apiError: any) {
        return NextResponse.json({
          status: 'error',
          message: 'OpenAI API 키는 설정되어 있지만 연결에 실패했습니다.',
          hasKey: true,
          keyLength: openaiKey.length,
          keyPreview: openaiKey.substring(0, 7) + '...',
          error: apiError.message || 'Unknown error',
          apiType: 'OpenAI',
        })
      }
    }

    return NextResponse.json({
      status: 'error',
      message: '알 수 없는 오류가 발생했습니다.',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: '테스트 중 오류가 발생했습니다.',
      error: error.message || 'Unknown error',
    })
  }
}

