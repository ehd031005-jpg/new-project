'use client'

import { useState, useEffect } from 'react'
import { Volume2, Globe, BookOpen, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import CulturalContextCard from '@/components/CulturalContextCard'
import RephraseCompare from '@/components/RephraseCompare'

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  level: 'beginner' | 'intermediate' | 'advanced'
  keywords: string[]
  grammarPoints: string[]
  source?: string
  author?: string
  url?: string
  publishedAt?: string
  culturalContext?: {
    title: string
    description: string
    examples: string[]
  }
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [fullContent, setFullContent] = useState<string | null>(null)
  const [loadingFullContent, setLoadingFullContent] = useState(false)
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchArticles()
  }, [level])

  // 선택된 기사의 원문 전체 내용 가져오기
  useEffect(() => {
    if (selectedArticle?.url && selectedArticle.url.startsWith('http')) {
      fetchFullContent(selectedArticle.url)
    } else {
      setFullContent(null)
    }
  }, [selectedArticle?.url])

  const fetchArticles = async () => {
    setLoading(true)
    try {
      // 실시간 뉴스 가져오기 시도
      const response = await fetch(`/api/news?level=${level}&real=true`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data && data.articles && Array.isArray(data.articles) && data.articles.length > 0) {
        setArticles(data.articles)
        setSelectedArticle(data.articles[0])
        setLoading(false)
        return
      }
      
      // 실시간 뉴스가 없으면 샘플 데이터 사용
      const fallbackResponse = await fetch(`/api/news?level=${level}`)
      
      if (!fallbackResponse.ok) {
        throw new Error(`HTTP error! status: ${fallbackResponse.status}`)
      }
      
      const fallbackData = await fallbackResponse.json()
      if (fallbackData && fallbackData.articles && Array.isArray(fallbackData.articles)) {
        setArticles(fallbackData.articles)
        if (fallbackData.articles.length > 0) {
          setSelectedArticle(fallbackData.articles[0])
        }
      } else {
        setArticles([])
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
      // 샘플 데이터
      setArticles([
        {
          id: '1',
          title: 'Climate Summit 2025: Global Leaders Agree on Renewable Energy Targets',
          summary: 'World leaders have reached a historic agreement on renewable energy targets at the Climate Summit 2025...',
          content: `World leaders gathered in Paris this week for the Climate Summit 2025, reaching a historic agreement on renewable energy targets. The summit, which brought together representatives from over 190 countries, focused on accelerating the transition to sustainable energy sources.

Key agreements include:
- Commitment to reduce carbon emissions by 50% by 2030
- Investment of $500 billion in renewable energy infrastructure
- Establishment of an international fund to support developing nations

"Today marks a turning point in our fight against climate change," said the summit's chairperson. "We have shown that when nations come together, we can achieve what once seemed impossible."

The agreement emphasizes the importance of solar and wind energy, with many countries committing to phase out fossil fuels entirely by 2040. Experts predict this will create millions of new jobs in the green energy sector.`,
          level: 'intermediate',
          keywords: ['climate', 'renewable energy', 'sustainable', 'emissions', 'fossil fuels'],
          grammarPoints: ['Present perfect', 'Passive voice', 'Conditional sentences'],
          culturalContext: {
            title: 'Climate Change Awareness',
            description: 'Climate change has become a central issue in global politics. Understanding environmental vocabulary and policy discussions is essential for engaging with international news.',
            examples: ['carbon footprint', 'green energy', 'sustainable development']
          }
        }
      ])
      setSelectedArticle({
        id: '1',
        title: 'Climate Summit 2025: Global Leaders Agree on Renewable Energy Targets',
        summary: 'World leaders have reached a historic agreement on renewable energy targets at the Climate Summit 2025...',
        content: `World leaders gathered in Paris this week for the Climate Summit 2025, reaching a historic agreement on renewable energy targets. The summit, which brought together representatives from over 190 countries, focused on accelerating the transition to sustainable energy sources.

Key agreements include:
- Commitment to reduce carbon emissions by 50% by 2030
- Investment of $500 billion in renewable energy infrastructure
- Establishment of an international fund to support developing nations

"Today marks a turning point in our fight against climate change," said the summit's chairperson. "We have shown that when nations come together, we can achieve what once seemed impossible."

The agreement emphasizes the importance of solar and wind energy, with many countries committing to phase out fossil fuels entirely by 2040. Experts predict this will create millions of new jobs in the green energy sector.`,
        level: 'intermediate',
        keywords: ['climate', 'renewable energy', 'sustainable', 'emissions', 'fossil fuels'],
        grammarPoints: ['Present perfect', 'Passive voice', 'Conditional sentences'],
        culturalContext: {
          title: 'Climate Change Awareness',
          description: 'Climate change has become a central issue in global politics. Understanding environmental vocabulary and policy discussions is essential for engaging with international news.',
          examples: ['carbon footprint', 'green energy', 'sustainable development']
        }
      })
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
      
      if (data && data.success && data.content && typeof data.content === 'string') {
        console.log(`전체 기사 내용 가져오기 성공: ${data.content.length} characters`)
        setFullContent(data.content)
      } else {
        console.warn('전체 기사 내용을 가져오지 못했습니다:', data?.message || 'Unknown error')
        // 전체 내용을 가져오지 못한 경우 원본 content 사용
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
    // 음성 재생 기능 (브라우저 Web Speech API 사용)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-US'
      utterance.rate = 0.9
      speechSynthesis.speak(utterance)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Daily News Digest</h1>
        <p className="text-gray-600 mb-6">
          매일 업데이트되는 글로벌 뉴스를 통해 영어를 배워보세요.
        </p>
        
        {/* Level Selector */}
        <div className="flex gap-4 mb-6">
          {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevel(lvl)}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                level === lvl
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {lvl === 'beginner' ? '초급' : lvl === 'intermediate' ? '중급' : '고급'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">뉴스를 불러오는 중...</p>
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">뉴스가 없습니다.</p>
          <button
            onClick={() => fetchArticles()}
            className="btn-primary"
          >
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Articles List */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold">뉴스 목록</h2>
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <div className="space-y-4">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className={`card cursor-pointer transition-all block ${
                    selectedArticle?.id === article.id
                      ? 'ring-2 ring-primary-600 bg-primary-50'
                      : 'hover:shadow-lg'
                  }`}
                >
                  <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-3">{article.summary}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-primary-600">
                      <span className="capitalize">{article.level}</span>
                      {article.source && (
                        <span className="text-gray-500">• {article.source}</span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-primary-600" />
                  </div>
                  {article.publishedAt && (
                    <div className="mt-2 text-xs text-gray-400">
                      {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Article Content */}
          {selectedArticle && (
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-3xl font-bold mb-4">{selectedArticle.title}</h2>
                
                <div className="mb-6">
                  <button
                    onClick={() => handlePlayAudio(selectedArticle.content)}
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                  >
                    <Volume2 className="w-5 h-5" />
                    <span>발음 듣기</span>
                  </button>
                </div>

                {/* Keywords */}
                {selectedArticle.keywords && selectedArticle.keywords.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      핵심 어휘
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.keywords.map((keyword, idx) => (
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
                {selectedArticle.grammarPoints && selectedArticle.grammarPoints.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">문법 포인트</h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {selectedArticle.grammarPoints.map((point, idx) => (
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
                    {(fullContent || selectedArticle.content)?.split('\n')
                      .map(paragraph => {
                        // "+chars" 같은 제한 표시 제거
                        let cleaned = paragraph.replace(/\s*\[\+\d+\s*chars?\]/gi, '')
                          .replace(/\s*\+\d+\s*chars?/gi, '')
                          .trim()
                        return cleaned
                      })
                      .filter(paragraph => paragraph.length > 0) // 빈 문자열 제거
                      .map((paragraph, idx) => {
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
                    {!fullContent && !loadingFullContent && selectedArticle.url && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                          ⚠️ 전체 기사 내용을 불러오지 못했습니다. 원문 링크를 클릭하여 전체 기사를 확인하세요.
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedArticle.url && (
                    <div className="mt-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                      <a
                        href={selectedArticle.url}
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
                {selectedArticle.culturalContext && (
                  <CulturalContextCard context={selectedArticle.culturalContext} />
                )}

                {/* Rephrase and Compare */}
                <div className="mt-6">
                  <RephraseCompare text={(fullContent || selectedArticle.content)?.substring(0, 500) || selectedArticle.content.substring(0, 200)} />
                </div>

                {/* Source Info */}
                {selectedArticle.source && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">
                      <div>
                        <span className="font-semibold">출처:</span> {selectedArticle.source}
                      </div>
                      {selectedArticle.author && (
                        <div className="mt-1">
                          <span className="font-semibold">작성자:</span> {selectedArticle.author}
                        </div>
                      )}
                      {selectedArticle.publishedAt && (
                        <div className="mt-1">
                          <span className="font-semibold">발행일:</span>{' '}
                          {new Date(selectedArticle.publishedAt).toLocaleString('ko-KR')}
                        </div>
                      )}
                      {selectedArticle.url && (
                        <a
                          href={selectedArticle.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-block text-primary-600 hover:text-primary-700 text-sm"
                        >
                          원문 보기 →
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-8 flex gap-4">
                  <Link
                    href={`/quiz?articleId=${selectedArticle.id}&title=${encodeURIComponent(selectedArticle.title)}&content=${encodeURIComponent(selectedArticle.content.substring(0, 2000))}&keywords=${encodeURIComponent(selectedArticle.keywords.join(','))}`}
                    className="btn-primary"
                  >
                    이 기사로 퀴즈 풀기
                  </Link>
                  <Link
                    href={`/writing?articleId=${selectedArticle.id}`}
                    className="btn-secondary"
                  >
                    의견문 작성하기
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

