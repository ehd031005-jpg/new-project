'use client'

import { useState, useEffect } from 'react'
import { Send, CheckCircle, AlertCircle, BookOpen, ArrowLeft, ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'

interface Feedback {
  grammar: {
    score: number
    comments: string[]
  }
  vocabulary: {
    score: number
    comments: string[]
  }
  structure: {
    score: number
    comments: string[]
  }
  suggestions: string[]
  improved: string
}

interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  level: 'beginner' | 'intermediate' | 'advanced'
  keywords: string[]
  source?: string
  publishedAt?: string
}

type WritingMode = 'select' | 'question' | 'writing' | 'feedback'

export default function WritingPage() {
  const [mode, setMode] = useState<WritingMode>('select')
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [question, setQuestion] = useState<string>('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [loadingQuestion, setLoadingQuestion] = useState(false)
  
  const [writing, setWriting] = useState('')
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [loading, setLoading] = useState(false)
  const [showBeforeAfter, setShowBeforeAfter] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [level])

  const fetchArticles = async () => {
    setLoadingArticles(true)
    try {
      // 실시간 뉴스 우선 시도
      let response = await fetch(`/api/news?real=true&level=${level}`, { cache: 'no-store' })
      
      if (!response.ok) {
        // 실시간 뉴스가 없으면 샘플 데이터 시도
        response = await fetch(`/api/news?level=${level}`, { cache: 'no-store' })
      }
      
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      }
    } catch (error) {
      console.error('Failed to fetch articles:', error)
    } finally {
      setLoadingArticles(false)
    }
  }

  const handleArticleSelect = async (article: NewsArticle) => {
    setSelectedArticle(article)
    setLoadingQuestion(true)
    setMode('question')
    
    try {
      // 기사 전체 내용 가져오기 (최대 5000자)
      let fullContent = article.content
      
      // content가 짧으면 fetch-article API로 전체 내용 가져오기 시도
      if (article.content.length < 1000 && article.id) {
        try {
          // articleId에서 URL 추출 시도 (real-X 형식이면)
          const articleDetailResponse = await fetch(`/api/news/${article.id}`, { cache: 'no-store' })
          if (articleDetailResponse.ok) {
            const articleDetail = await articleDetailResponse.json()
            if (articleDetail.url) {
              const fetchResponse = await fetch(`/api/fetch-article?url=${encodeURIComponent(articleDetail.url)}`, { cache: 'no-store' })
              if (fetchResponse.ok) {
                const fetchData = await fetchResponse.json()
                if (fetchData.success && fetchData.content) {
                  fullContent = fetchData.content
                }
              }
            }
          }
        } catch (e) {
          console.log('Could not fetch full content, using provided content')
        }
      }
      
      const response = await fetch('/api/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: fullContent,
          level: article.level || level,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate question')
      }

      const data = await response.json()
      setQuestion(data.question || 'What is your opinion on this article?')
      setMode('writing')
    } catch (error) {
      console.error('Failed to generate question:', error)
      // Fallback 질문
      setQuestion('What is your opinion on this article? Please write your thoughts in English.')
      setMode('writing')
    } finally {
      setLoadingQuestion(false)
    }
  }

  const handleSubmit = async () => {
    if (!writing.trim()) {
      alert('답변을 작성해주세요.')
      return
    }

    if (!selectedArticle) {
      alert('기사를 선택해주세요.')
      return
    }

    setLoading(true)
    setFeedback(null)
    try {
      const response = await fetch('/api/writing-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: writing, 
          articleId: selectedArticle.id,
          articleTitle: selectedArticle.title,
          articleContent: selectedArticle.content,
          level: selectedArticle.level || level,
          question: question, // 질문도 함께 전달
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `서버 오류: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.feedback) {
        throw new Error('피드백 데이터를 받지 못했습니다.')
      }

      setFeedback(data.feedback)
      setMode('feedback')
    } catch (error: any) {
      console.error('Failed to get feedback:', error)
      alert(`피드백을 받는 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}\n\nAPI 키가 올바르게 설정되어 있는지 확인해주세요.`)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToSelect = () => {
    setMode('select')
    setSelectedArticle(null)
    setQuestion('')
    setWriting('')
    setFeedback(null)
    setShowBeforeAfter(false)
  }

  const handleNewWriting = () => {
    setMode('writing')
    setWriting('')
    setFeedback(null)
    setShowBeforeAfter(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 기사 선택 화면
  if (mode === 'select') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2">Writing Practice</h1>
          <p className="text-gray-600">
            작문 연습을 하고 싶은 기사를 선택해주세요. 기사에 대한 질문에 답변하면 AI가 피드백을 제공합니다.
          </p>
        </div>

        {/* 난이도 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            난이도 선택
          </label>
          <div className="flex gap-2">
            {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevel(lvl)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  level === lvl
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lvl === 'beginner' ? '초급' : lvl === 'intermediate' ? '중급' : '고급'}
              </button>
            ))}
          </div>
        </div>

        {loadingArticles ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">기사를 불러오는 중...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">기사를 불러올 수 없습니다.</p>
            <button onClick={fetchArticles} className="btn-primary">
              다시 불러오기
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {articles.map((article) => (
              <button
                key={article.id}
                onClick={() => handleArticleSelect(article)}
                className="card text-left hover:shadow-lg transition-all cursor-pointer"
              >
                <h3 className="font-semibold mb-2 line-clamp-2">{article.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-3 mb-3">{article.summary}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-1 rounded ${
                      article.level === 'beginner' ? 'bg-green-100 text-green-800' :
                      article.level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {article.level === 'beginner' ? '초급' : article.level === 'intermediate' ? '중급' : '고급'}
                    </span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary-600" />
                </div>
                {article.publishedAt && (
                  <div className="mt-2 text-xs text-gray-400">
                    {new Date(article.publishedAt).toLocaleDateString('ko-KR')}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // 질문 생성 중
  if (mode === 'question' && loadingQuestion) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">질문을 생성하는 중...</p>
        {selectedArticle && (
          <p className="mt-2 text-sm text-gray-500">
            {selectedArticle.title.substring(0, 50)}...
          </p>
        )}
      </div>
    )
  }

  // 답변 작성 화면
  if (mode === 'writing') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>기사 선택으로 돌아가기</span>
          </button>
          <h1 className="text-4xl font-bold mb-4">Writing Practice</h1>
          
          {selectedArticle && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-primary-800">관련 기사</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{selectedArticle.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {selectedArticle.content.substring(0, 200)}...
              </p>
            </div>
          )}
        </div>

        {/* 질문 표시 */}
        <div className="card mb-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">질문</h2>
              <p className="text-blue-800 text-lg">{question}</p>
            </div>
          </div>
        </div>

        {/* 답변 작성 */}
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold mb-4">답변 작성</h2>
          <textarea
            value={writing}
            onChange={(e) => setWriting(e.target.value)}
            placeholder="질문에 대한 답변을 영어로 작성해주세요... (100-200 단어 권장)"
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="mt-2 text-sm text-gray-500">
            {writing.split(/\s+/).filter(w => w.length > 0).length} 단어
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !writing.trim()}
            className="mt-4 btn-primary flex items-center gap-2"
          >
            <Send className="w-5 h-5" />
            {loading ? '분석 중...' : '피드백 받기'}
          </button>
        </div>
      </div>
    )
  }

  // 피드백 화면
  if (mode === 'feedback' && feedback) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>기사 선택으로 돌아가기</span>
          </button>
          <h1 className="text-4xl font-bold mb-4">Writing Feedback</h1>
          
          {selectedArticle && (
            <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <span className="font-semibold text-primary-800">관련 기사</span>
              </div>
              <h3 className="font-semibold text-gray-800">{selectedArticle.title}</h3>
            </div>
          )}

          {question && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="text-blue-800">
                <span className="font-semibold">질문: </span>
                {question}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Overall Scores */}
          <div className="card bg-gradient-to-br from-blue-50 to-purple-50">
            <h2 className="text-2xl font-semibold mb-4">종합 평가</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(feedback.grammar.score)}`}>
                  {feedback.grammar.score}
                </div>
                <div className="text-gray-600 mt-2">문법</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(feedback.vocabulary.score)}`}>
                  {feedback.vocabulary.score}
                </div>
                <div className="text-gray-600 mt-2">어휘</div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(feedback.structure.score)}`}>
                  {feedback.structure.score}
                </div>
                <div className="text-gray-600 mt-2">구조</div>
              </div>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                문법 피드백
              </h3>
              <ul className="space-y-2">
                {feedback.grammar.comments.map((comment, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{comment}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                어휘 피드백
              </h3>
              <ul className="space-y-2">
                {feedback.vocabulary.comments.map((comment, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{comment}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-purple-600" />
                구조 피드백
              </h3>
              <ul className="space-y-2">
                {feedback.structure.comments.map((comment, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{comment}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="card bg-yellow-50 border-yellow-200">
              <h3 className="text-lg font-semibold mb-3">개선 제안</h3>
              <ul className="space-y-2">
                {feedback.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    {suggestion.includes('→') ? (
                      <>
                        <span className="font-mono text-red-600">{suggestion.split('→')[0]}</span>
                        <span className="mx-2">→</span>
                        <span className="font-mono text-green-600">{suggestion.split('→')[1]}</span>
                      </>
                    ) : (
                      suggestion
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Before/After Comparison */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">수정 전후 비교</h3>
              <button
                onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                {showBeforeAfter ? '숨기기' : '보기'}
              </button>
            </div>
            {showBeforeAfter && (
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">수정 전</h4>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-gray-700">{writing}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">수정 후</h4>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-700">{feedback.improved}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button onClick={handleNewWriting} className="btn-primary">
              같은 질문 다시 작성
            </button>
            <button onClick={handleBackToSelect} className="btn-secondary">
              다른 기사 선택
            </button>
            <Link href="/news" className="btn-secondary">
              뉴스 보기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}
