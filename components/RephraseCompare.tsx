'use client'

import { useState } from 'react'
import { Sparkles, ChevronRight } from 'lucide-react'

interface RephraseCompareProps {
  text: string
}

export default function RephraseCompare({ text }: RephraseCompareProps) {
  const [rephrased, setRephrased] = useState<{
    beginner: string
    intermediate: string
    advanced: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleRephrase = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/rephrase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (errorData.fallback) {
          setRephrased(errorData.fallback)
          alert('API 키가 설정되지 않아 기본 변환을 제공합니다. 더 정확한 변환을 받으려면 .env.local 파일에 API 키를 설정해주세요.')
          return
        }
        throw new Error(errorData.error || `서버 오류: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.beginner || !data.intermediate || !data.advanced) {
        throw new Error('변환 데이터를 받지 못했습니다.')
      }

      setRephrased(data)
    } catch (error: any) {
      console.error('Failed to rephrase:', error)
      alert(`변환 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}\n\nAPI 키가 올바르게 설정되어 있는지 확인해주세요.`)
      
      // 기본 변환 제공
      setRephrased({
        beginner: text.length > 100 ? text.substring(0, 100) + '...' : text,
        intermediate: text,
        advanced: text,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-semibold">Rephrase and Compare</h3>
      </div>
      
      <p className="text-gray-700 mb-4 text-sm">
        같은 내용을 다른 수준의 영어로 표현해보세요. 문체 차이를 비교하며 표현력을 향상시킬 수 있습니다.
      </p>

      {!rephrased ? (
        <button
          onClick={handleRephrase}
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? '변환 중...' : '수준별 표현 비교하기'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                초급
              </span>
            </div>
            <p className="text-gray-700">{rephrased.beginner}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                중급
              </span>
            </div>
            <p className="text-gray-700">{rephrased.intermediate}</p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                고급
              </span>
            </div>
            <p className="text-gray-700">{rephrased.advanced}</p>
          </div>

          <button
            onClick={() => setRephrased(null)}
            className="btn-secondary w-full"
          >
            다시 비교하기
          </button>
        </div>
      )}
    </div>
  )
}



