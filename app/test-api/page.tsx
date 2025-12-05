'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, List } from 'lucide-react'

interface TestResult {
  status: 'success' | 'error' | 'warning'
  message: string
  hasKey?: boolean
  keyLength?: number
  keyPreview?: string
  testResponse?: string
  error?: string
  apiType?: string
}

interface ModelsResult {
  status: 'success' | 'error'
  message: string
  hasKey?: boolean
  totalModels?: number
  availableModels?: Array<{
    name: string
    displayName?: string
    description?: string
    supportedGenerationMethods?: string[]
  }>
  error?: string
}

export default function TestAPIPage() {
  const [result, setResult] = useState<TestResult | null>(null)
  const [modelsResult, setModelsResult] = useState<ModelsResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingModels, setLoadingModels] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setResult(null)
    try {
      const response = await fetch('/api/test-openai')
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        status: 'error',
        message: '테스트 요청 중 오류가 발생했습니다.',
        error: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const testModels = async () => {
    setLoadingModels(true)
    setModelsResult(null)
    try {
      const response = await fetch('/api/google-models')
      const data = await response.json()
      setModelsResult(data)
    } catch (error: any) {
      setModelsResult({
        status: 'error',
        message: '모델 목록 요청 중 오류가 발생했습니다.',
        error: error.message,
      })
    } finally {
      setLoadingModels(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">API 키 테스트</h1>
      <p className="text-gray-600 mb-6">
        .env.local 파일에 설정된 API 키가 제대로 작동하는지 확인합니다.
        <br />
        지원되는 환경 변수: <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_API_KEY</code>, <code className="bg-gray-100 px-2 py-1 rounded">GOOGLE_AI_API_KEY</code>, <code className="bg-gray-100 px-2 py-1 rounded">GEMINI_API_KEY</code>, <code className="bg-gray-100 px-2 py-1 rounded">OPENAI_API_KEY</code>
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testAPI}
          disabled={loading}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? '테스트 중...' : 'API 키 테스트하기'}
        </button>

        <button
          onClick={testModels}
          disabled={loadingModels}
          className="btn-secondary flex items-center gap-2"
        >
          <List className={`w-5 h-5 ${loadingModels ? 'animate-spin' : ''}`} />
          {loadingModels ? '로딩 중...' : 'Google AI 모델 목록 확인'}
        </button>
      </div>

      {result && (
        <div className="card">
          <div className="flex items-start gap-4 mb-4">
            {result.status === 'success' && (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            )}
            {result.status === 'error' && (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            )}
            {result.status === 'warning' && (
              <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h2
                className={`text-2xl font-semibold mb-2 ${
                  result.status === 'success'
                    ? 'text-green-600'
                    : result.status === 'error'
                    ? 'text-red-600'
                    : 'text-yellow-600'
                }`}
              >
                {result.status === 'success'
                  ? '성공'
                  : result.status === 'error'
                  ? '오류'
                  : '경고'}
              </h2>
              <p className="text-gray-700 mb-4">{result.message}</p>

              {result.hasKey !== undefined && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">API 키 존재:</span>{' '}
                    {result.hasKey ? '예' : '아니오'}
                  </div>
                  {result.keyLength && (
                    <div>
                      <span className="font-semibold">키 길이:</span>{' '}
                      {result.keyLength} 문자
                    </div>
                  )}
                  {result.keyPreview && (
                    <div>
                      <span className="font-semibold">키 미리보기:</span>{' '}
                      {result.keyPreview}
                    </div>
                  )}
                  {result.testResponse && (
                    <div>
                      <span className="font-semibold">테스트 응답:</span>{' '}
                      {result.testResponse}
                    </div>
                  )}
                  {result.error && (
                    <div className="text-red-600">
                      <span className="font-semibold">오류 내용:</span>{' '}
                      {result.error}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {result.status === 'error' && !result.hasKey && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-yellow-900 mb-2">
                해결 방법:
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                <li>프로젝트 루트 폴더에 .env.local 파일을 생성하세요</li>
                <li>
                  다음 내용을 추가하세요:
                  <code className="block bg-white p-2 rounded mt-2">
                    GOOGLE_API_KEY=your-google-api-key-here
                    <br />
                    또는
                    <br />
                    OPENAI_API_KEY=sk-your-openai-api-key-here
                  </code>
                </li>
                <li>개발 서버를 재시작하세요 (npm run dev)</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {modelsResult && (
        <div className="card mt-6">
          <div className="flex items-start gap-4 mb-4">
            {modelsResult.status === 'success' && (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            )}
            {modelsResult.status === 'error' && (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h2
                className={`text-2xl font-semibold mb-2 ${
                  modelsResult.status === 'success'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {modelsResult.status === 'success' ? '성공' : '오류'}
              </h2>
              <p className="text-gray-700 mb-4">{modelsResult.message}</p>

              {modelsResult.status === 'success' && modelsResult.availableModels && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                  <div>
                    <span className="font-semibold">전체 모델 수:</span>{' '}
                    {modelsResult.totalModels || 0}
                  </div>
                  <div>
                    <span className="font-semibold">사용 가능한 모델:</span>{' '}
                    {modelsResult.availableModels.length}개
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-800">모델 목록:</h4>
                    {modelsResult.availableModels.map((model, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded border border-gray-200"
                      >
                        <div className="font-semibold text-primary-600">
                          {model.displayName || model.name}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {model.name}
                        </div>
                        {model.description && (
                          <div className="text-sm text-gray-500 mt-1">
                            {model.description}
                          </div>
                        )}
                        {model.supportedGenerationMethods &&
                          model.supportedGenerationMethods.length > 0 && (
                            <div className="text-xs text-gray-400 mt-2">
                              지원 메서드:{' '}
                              {model.supportedGenerationMethods.join(', ')}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {modelsResult.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <div className="text-red-800">
                    <span className="font-semibold">오류:</span> {modelsResult.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

