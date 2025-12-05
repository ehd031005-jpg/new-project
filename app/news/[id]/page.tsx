'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Volume2, BookOpen, ArrowLeft, Globe } from 'lucide-react'
import Link from 'next/link'
import CulturalContextCard from '@/components/CulturalContextCard'
import RephraseCompare from '@/components/RephraseCompare'

export default function NewsDetailPage() {
  const params = useParams()
  const articleId = params.id as string
  const [article, setArticle] = useState<any>(null)
  const [fullContent, setFullContent] = useState<string | null>(null)
  const [loadingFullContent, setLoadingFullContent] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticle()
  }, [articleId])

  // 기사 로드 후 원문 전체 내용 가져오기
  useEffect(() => {
    if (article?.url && article.url.startsWith('http')) {
      fetchFullContent(article.url)
    } else {
      setFullContent(null)
    }
  }, [article?.url])

  const fetchArticle = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/news/${articleId}`)
      const data = await response.json()
      setArticle(data.article)
    } catch (error) {
      console.error('Failed to fetch article:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFullContent = async (url: string) => {
    setLoadingFullContent(true)
    try {
      console.log(`전체 기사 내용 가져오기 시도: ${url}`)
      const response = await fetch(`/api/fetch-article?url=${encodeURIComponent(url)}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success && data.content) {
        console.log(`전체 기사 내용 가져오기 성공: ${data.content.length} characters`)
        setFullContent(data.content)
      } else {
        console.warn('전체 기사 내용을 가져오지 못했습니다:', data.message || 'Unknown error')
        setFullContent(null)
      }
    } catch (error) {
      console.error('Failed to fetch full content:', error)
      setFullContent(null)
    } finally {
      setLoadingFullContent(false)
    }
  }

  const handlePlayAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">기사를 불러오는 중...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">기사를 찾을 수 없습니다.</p>
        <Link href="/news" className="btn-primary mt-4 inline-block">
          뉴스 목록으로 돌아가기
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href="/news"
        className="flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>뉴스 목록으로</span>
      </Link>

      <div className="card">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        
        <div className="mb-6">
          <button
            onClick={() => handlePlayAudio(article.content)}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <Volume2 className="w-5 h-5" />
            <span>발음 듣기</span>
          </button>
        </div>

        {/* Keywords */}
        {article.keywords && article.keywords.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              핵심 어휘
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.keywords.map((keyword: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Grammar Points */}
        {article.grammarPoints && article.grammarPoints.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">문법 포인트</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-700">
              {article.grammarPoints.map((point: string, idx: number) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Article Content */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">기사 본문</h3>
            {loadingFullContent && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>원문 전체 불러오는 중...</span>
              </div>
            )}
          </div>
          <div className="prose max-w-none">
            {(fullContent || article.content)?.split('\n')
              .map((paragraph: string) => {
                // "+chars" 같은 제한 표시 제거
                let cleaned = paragraph.replace(/\s*\[\+\d+\s*chars?\]/gi, '')
                  .replace(/\s*\+\d+\s*chars?/gi, '')
                  .trim()
                return cleaned
              })
              .filter((paragraph: string) => paragraph.length > 0) // 빈 문자열 제거
              .map((paragraph: string, idx: number) => {
                // 짧은 문단은 인라인으로 처리 (예: 제목, 부제목)
                if (paragraph.length < 50 && !paragraph.endsWith('.')) {
                  return (
                    <p key={idx} className="mb-2 text-gray-600 font-medium">
                      {paragraph}
                    </p>
                  )
                }
                return (
                  <p key={idx} className="mb-4 text-gray-700 leading-relaxed">
                    {paragraph}
                  </p>
                )
              })}
            {!fullContent && !loadingFullContent && article.url && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ 전체 기사 내용을 불러오지 못했습니다. 원문 링크를 클릭하여 전체 기사를 확인하세요.
                </p>
              </div>
            )}
          </div>
          {article.url && (
            <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium text-sm inline-flex items-center gap-1"
              >
                <Globe className="w-4 h-4" />
                원문 사이트에서 보기 →
              </a>
            </div>
          )}
        </div>

        {/* Cultural Context Card */}
        {article.culturalContext && (
          <CulturalContextCard context={article.culturalContext} />
        )}

        {/* Rephrase and Compare */}
        <div className="mt-6">
          <RephraseCompare text={(fullContent || article.content)?.substring(0, 500) || article.content?.substring(0, 200) || ''} />
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            href={`/quiz?articleId=${article.id}&title=${encodeURIComponent(article.title)}&content=${encodeURIComponent((article.content || '').substring(0, 2000))}&keywords=${encodeURIComponent((article.keywords || []).join(','))}`}
            className="btn-primary"
          >
            이 기사로 퀴즈 풀기
          </Link>
          <Link
            href={`/writing?articleId=${article.id}`}
            className="btn-secondary"
          >
            의견문 작성하기
          </Link>
        </div>
      </div>
    </div>
  )
}



