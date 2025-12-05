import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const googleKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY

    if (!googleKey) {
      return NextResponse.json({
        status: 'error',
        message: 'Google AI API 키가 설정되어 있지 않습니다.',
        hasKey: false,
      })
    }

    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1/models',
        {
          headers: {
            'x-goog-api-key': googleKey,
          },
        }
      )

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        return NextResponse.json({
          status: 'error',
          message: '모델 목록을 가져오는 데 실패했습니다.',
          error: errorData.error?.message || `HTTP ${res.status}`,
          hasKey: true,
        })
      }

      const data = await res.json()
      
      // generateContent를 지원하는 모델만 필터링
      const availableModels = data.models?.filter((model: any) => 
        model.name && 
        (model.name.includes('gemini') || model.name.includes('models/')) &&
        model.supportedGenerationMethods?.includes('generateContent')
      ) || []

      return NextResponse.json({
        status: 'success',
        message: '모델 목록을 성공적으로 가져왔습니다.',
        hasKey: true,
        totalModels: data.models?.length || 0,
        availableModels: availableModels.map((model: any) => ({
          name: model.name,
          displayName: model.displayName,
          description: model.description,
          supportedGenerationMethods: model.supportedGenerationMethods,
        })),
        allModels: data.models || [],
      })
    } catch (apiError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'API 호출 중 오류가 발생했습니다.',
        error: apiError.message || 'Unknown error',
        hasKey: true,
      })
    }
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: '테스트 중 오류가 발생했습니다.',
      error: error.message || 'Unknown error',
    })
  }
}

