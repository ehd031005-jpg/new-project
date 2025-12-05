'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, RefreshCw, BookOpen, ArrowLeft, ChevronRight, List } from 'lucide-react'
import Link from 'next/link'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  word: string
}

interface ReviewItem {
  question: QuizQuestion
  userAnswer: number
  timestamp: Date
  articleId?: string
  articleTitle?: string
  articleLevel?: 'beginner' | 'intermediate' | 'advanced'
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

type QuizMode = 'select' | 'quiz' | 'completed'

export default function QuizPage() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState<QuizMode>('select')
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')
  const [loadingArticles, setLoadingArticles] = useState(true)
  
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [wrongAnswers, setWrongAnswers] = useState<ReviewItem[]>([])
  const [loadingQuiz, setLoadingQuiz] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)

  useEffect(() => {
    fetchArticles()
  }, [level])

  // URL 파라미터에서 기사 정보를 받아 자동으로 퀴즈 시작
  useEffect(() => {
    const articleId = searchParams?.get('articleId')
    const articleTitle = searchParams?.get('title')
    const articleLevel = searchParams?.get('level') as 'beginner' | 'intermediate' | 'advanced' | null

    if (!articleId || !articleTitle) return

    // 기사 목록이 로드되면 해당 기사를 찾아서 퀴즈 시작
    if (articles.length > 0) {
      const article = articles.find(a => a.id === articleId)
      if (article) {
        setSelectedArticle(article)
        if (articleLevel) {
          setLevel(articleLevel)
        }
        handleArticleSelect(article)
      }
    } else if (!loadingArticles) {
      // 기사 목록이 아직 로드되지 않았고 로딩이 완료되었으면, 기사 정보로 가상의 기사 객체 생성하여 퀴즈 시작
      let decodedTitle = articleTitle
      try {
        decodedTitle = decodeURIComponent(articleTitle)
      } catch (e) {
        console.warn('Failed to decode article title, using original:', e)
      }
      const virtualArticle: NewsArticle = {
        id: articleId,
        title: decodedTitle,
        summary: '',
        content: '',
        level: articleLevel || 'intermediate',
        keywords: [],
      }
      setSelectedArticle(virtualArticle)
      if (articleLevel) {
        setLevel(articleLevel)
      }
      handleArticleSelect(virtualArticle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, articles.length, loadingArticles])

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
    setLoadingQuiz(true)
    setMode('quiz')
    
    try {
      // 기사 정보를 직접 전달하여 퀴즈 생성 (난이도 포함)
      const quizUrl = `/api/quiz?articleId=${article.id}&title=${encodeURIComponent(article.title)}&content=${encodeURIComponent(article.content.substring(0, 2000))}&keywords=${encodeURIComponent(article.keywords.join(','))}&level=${article.level || level}`
      
      console.log('퀴즈 요청:', { articleId: article.id, title: article.title.substring(0, 50) })
      const response = await fetch(quizUrl)
      const data = await response.json()
      setQuestions(data.questions || [])
      
      if (data.questions && data.questions.length > 0) {
        setMode('quiz')
      } else {
        throw new Error('No questions generated')
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error)
      alert('퀴즈를 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.')
      setMode('select')
    } finally {
      setLoadingQuiz(false)
    }
  }

  const handleAnswerSelect = (index: number) => {
    if (showResult) return
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const question = questions[currentQuestion]
    const isCorrect = selectedAnswer === question.correctAnswer

    if (isCorrect) {
      setScore(score + 1)
    } else {
      setWrongAnswers([
        ...wrongAnswers,
        {
          question,
          userAnswer: selectedAnswer,
          timestamp: new Date(),
          articleId: selectedArticle?.id,
          articleTitle: selectedArticle?.title,
          articleLevel: selectedArticle?.level || level,
        },
      ])
    }

    setShowResult(true)
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    } else {
      setQuizCompleted(true)
      setMode('completed')
      // 오답을 로컬 스토리지에 저장
      if (wrongAnswers.length > 0) {
        try {
          const stored = localStorage.getItem('reviewList')
          const existingReviews = stored ? JSON.parse(stored) : []
          const updatedReviews = [...existingReviews, ...wrongAnswers]
          localStorage.setItem('reviewList', JSON.stringify(updatedReviews))
        } catch (error) {
          console.error('Failed to save review items to localStorage:', error)
          // 에러 발생 시에도 새 오답만 저장 시도
          try {
            localStorage.setItem('reviewList', JSON.stringify(wrongAnswers))
          } catch (e) {
            console.error('Failed to save review items even as new list:', e)
          }
        }
      }
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setScore(0)
    setShowResult(false)
    setWrongAnswers([])
    setQuizCompleted(false)
    setMode('quiz')
  }

  const handleBackToSelect = () => {
    setMode('select')
    setSelectedArticle(null)
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setScore(0)
    setShowResult(false)
    setWrongAnswers([])
    setQuizCompleted(false)
  }

  // 기사 선택 화면
  if (mode === 'select') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Vocabulary Quiz</h1>
            <Link
              href="/review"
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <List className="w-5 h-5" />
              <span>복습 리스트</span>
            </Link>
          </div>
          <p className="text-gray-600">
            퀴즈를 풀고 싶은 기사를 선택해주세요.
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
                    {article.keywords && article.keywords.length > 0 && (
                      <span className="text-gray-500">
                        {article.keywords.length}개 어휘
                      </span>
                    )}
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

  // 퀴즈 로딩 중
  if (loadingQuiz) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">퀴즈를 생성하는 중...</p>
        {selectedArticle && (
          <p className="mt-2 text-sm text-gray-500">
            {selectedArticle.title.substring(0, 50)}...
          </p>
        )}
      </div>
    )
  }

  // 퀴즈 완료 화면
  if (mode === 'completed') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="card text-center">
          <h1 className="text-4xl font-bold mb-4">퀴즈 완료!</h1>
          <div className="text-6xl font-bold text-primary-600 mb-4">
            {Math.round((score / questions.length) * 100)}%
          </div>
          <p className="text-lg text-gray-600 mb-2">
            {score} / {questions.length} 문제를 맞췄습니다.
          </p>
          {selectedArticle && (
            <p className="text-sm text-gray-500 mb-6">
              기사: {selectedArticle.title}
            </p>
          )}
          {wrongAnswers.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800 mb-2">
                오답 {wrongAnswers.length}개가 복습 리스트에 추가되었습니다.
              </p>
              <Link href="/review" className="text-primary-600 hover:text-primary-700">
                복습 리스트 보기 →
              </Link>
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <button onClick={handleRestart} className="btn-primary">
              <RefreshCw className="w-5 h-5 inline mr-2" />
              다시 풀기
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

  // 퀴즈 풀기 화면
  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">퀴즈 문제를 불러올 수 없습니다.</p>
        <button onClick={handleBackToSelect} className="btn-primary">
          기사 선택으로 돌아가기
        </button>
      </div>
    )
  }

  const question = questions[currentQuestion]

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-gray-600 mb-4">퀴즈 문제를 불러올 수 없습니다.</p>
        <button onClick={handleBackToSelect} className="btn-primary">
          기사 선택으로 돌아가기
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBackToSelect}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>기사 선택으로 돌아가기</span>
          </button>
          <Link
            href="/review"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
          >
            <List className="w-4 h-4" />
            <span>복습 리스트</span>
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-2">Vocabulary Quiz</h1>
        {selectedArticle && (
          <div className="mb-2">
            <p className="text-gray-600">
              기사: <span className="font-medium">{selectedArticle.title}</span>
            </p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            문제 {currentQuestion + 1} / {questions.length}
          </span>
          <span className="text-sm font-semibold text-primary-600">
            점수: {score} / {currentQuestion + (showResult ? 1 : 0)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary-600" />
          <span className="text-sm text-gray-600">핵심 어휘: {question.word}</span>
        </div>
        <h2 className="text-2xl font-semibold mb-6">{question.question}</h2>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            let buttonClass =
              'w-full text-left p-4 border-2 rounded-lg transition-all font-medium'
            let icon = null

            if (showResult) {
              if (index === question.correctAnswer) {
                buttonClass += ' border-green-500 bg-green-50 text-green-800'
                icon = <CheckCircle className="w-5 h-5 text-green-600 inline ml-2" />
              } else if (index === selectedAnswer && index !== question.correctAnswer) {
                buttonClass += ' border-red-500 bg-red-50 text-red-800'
                icon = <XCircle className="w-5 h-5 text-red-600 inline ml-2" />
              } else {
                buttonClass += ' border-gray-200 bg-gray-50 text-gray-600'
              }
            } else {
              if (selectedAnswer === index) {
                buttonClass += ' border-primary-500 bg-primary-50 text-primary-800'
              } else {
                buttonClass += ' border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={buttonClass}
                disabled={showResult}
              >
                <span className="font-semibold mr-2">{String.fromCharCode(65 + index)}.</span>
                {option}
                {icon}
              </button>
            )
          })}
        </div>

        {showResult && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="font-semibold text-blue-900 mb-2">설명:</p>
            <p className="text-blue-800">{question.explanation}</p>
          </div>
        )}

        <div className="mt-6">
          {!showResult ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="btn-primary w-full"
            >
              답안 제출
            </button>
          ) : (
            <button onClick={handleNext} className="btn-primary w-full">
              {currentQuestion < questions.length - 1 ? '다음 문제' : '결과 보기'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
