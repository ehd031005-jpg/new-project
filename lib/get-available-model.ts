/**
 * 사용 가능한 Gemini 모델을 자동으로 찾아서 반환합니다
 */
export async function getAvailableGeminiModel(): Promise<string> {
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
  
  if (!googleKey) {
    // API 키가 없으면 기본값 반환
    return 'gemini-2.5-pro'
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
      // API 호출 실패 시 기본값 반환
      return 'gemini-2.5-pro'
    }

    const data = await res.json()
    
    // generateContent를 지원하는 모델 찾기
    const availableModels = data.models?.filter((model: any) => 
      model.name && 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []

    // 우선순위: gemini-2.5-pro > gemini-1.5-flash > gemini-1.5-pro > 기타
    const preferredModels = [
      'models/gemini-2.5-pro',
      'gemini-2.5-pro',
      'models/gemini-1.5-flash',
      'models/gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'models/gemini-1.5-pro',
      'models/gemini-1.5-pro-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'models/gemini-pro',
      'gemini-pro',
    ]

    // 우선순위에 따라 모델 찾기
    for (const preferred of preferredModels) {
      const found = availableModels.find((model: any) => 
        model.name === preferred || 
        model.name === preferred.replace('models/', '') ||
        model.name.includes(preferred.replace('models/', ''))
      )
      if (found) {
        // 모델 이름에서 'models/' 접두사 제거
        return found.name.replace(/^models\//, '')
      }
    }

    // 우선순위 모델이 없으면 첫 번째 사용 가능한 모델 사용
    if (availableModels.length > 0) {
      return availableModels[0].name.replace(/^models\//, '')
    }

    // 아무것도 없으면 기본값
    return 'gemini-2.5-pro'
  } catch (error) {
    console.error('Error fetching available models:', error)
    return 'gemini-2.5-pro'
  }
}

