'use client'

import { useState } from 'react'

export default function TestNewsPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const testNewsAPI = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-news')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        error: '테스트 중 오류가 발생했습니다: ' + (error as Error).message,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">NewsAPI 테스트</h1>
      
      <div className="mb-6">
        <button
          onClick={testNewsAPI}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? '테스트 중...' : 'NewsAPI 테스트 실행'}
        </button>
      </div>

      {result && (
        <div className="card space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">API 키 상태</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p>
                <strong>API 키 설정:</strong>{' '}
                {result.hasApiKey ? (
                  <span className="text-green-600">✓ 설정됨</span>
                ) : (
                  <span className="text-red-600">✗ 설정되지 않음</span>
                )}
              </p>
              {result.hasApiKey && (
                <>
                  <p>
                    <strong>API 키 길이:</strong> {result.apiKeyLength}자
                  </p>
                  <p>
                    <strong>API 키 미리보기:</strong> {result.apiKeyPreview}
                  </p>
                </>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">날짜 범위</h2>
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>오늘:</strong> {result.dateRange?.today}</p>
              <p><strong>검색 시작일:</strong> {result.dateRange?.from}</p>
              <p><strong>검색 종료일:</strong> {result.dateRange?.to}</p>
            </div>
          </div>

          {result.error ? (
            <div className="bg-red-50 border border-red-200 p-4 rounded">
              <h3 className="text-lg font-semibold text-red-800 mb-2">오류</h3>
              <p className="text-red-600">{result.error}</p>
            </div>
          ) : result.testResults ? (
            <div>
              <h2 className="text-xl font-semibold mb-2">테스트 결과</h2>
              <div className="bg-gray-50 p-4 rounded mb-4">
                <p>
                  <strong>가져온 뉴스 기사 수:</strong>{' '}
                  <span className={result.testResults.articlesCount > 0 ? 'text-green-600' : 'text-yellow-600'}>
                    {result.testResults.articlesCount}개
                  </span>
                </p>
              </div>

              {result.testResults.articlesCount > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">뉴스 기사 목록</h3>
                  {result.testResults.articles.map((article: any, idx: number) => (
                    <div key={idx} className="border border-gray-200 p-4 rounded">
                      <h4 className="font-semibold mb-2">{article.title}</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>출처:</strong> {article.source}</p>
                        <p><strong>발행일:</strong> {new Date(article.publishedAt).toLocaleString('ko-KR')}</p>
                        <p>
                          <strong>내용:</strong>{' '}
                          {article.hasContent ? (
                            <span className="text-green-600">✓ 있음</span>
                          ) : (
                            <span className="text-yellow-600">✗ 없음</span>
                          )}
                        </p>
                        <p>
                          <strong>설명:</strong>{' '}
                          {article.hasDescription ? (
                            <span className="text-green-600">✓ 있음</span>
                          ) : (
                            <span className="text-yellow-600">✗ 없음</span>
                          )}
                        </p>
                        {article.url && (
                          <p>
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline"
                            >
                              원문 보기 →
                            </a>
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <p className="text-yellow-800">
                    뉴스 기사를 가져오지 못했습니다. NewsAPI 키가 올바른지, 또는 오늘 날짜에 뉴스가 있는지 확인해주세요.
                  </p>
                </div>
              )}
            </div>
          ) : null}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">참고사항</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>NewsAPI는 어제부터 오늘까지의 뉴스를 가져옵니다.</li>
              <li>무료 플랜의 경우 하루 요청 제한이 있을 수 있습니다.</li>
              <li>API 키는 <code className="bg-blue-100 px-1 rounded">.env.local</code> 파일에 <code className="bg-blue-100 px-1 rounded">NEWS_API_KEY=your_key_here</code> 형식으로 설정해야 합니다.</li>
              <li>실제 뉴스 페이지에서도 <code className="bg-blue-100 px-1 rounded">real=true</code> 파라미터로 실시간 뉴스를 가져옵니다.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}


