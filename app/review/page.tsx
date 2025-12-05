'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, BookOpen, RefreshCw, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface ReviewItem {
  question: {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
    word: string
  }
  userAnswer: number
  timestamp: string
  articleId?: string
  articleTitle?: string
  articleLevel?: 'beginner' | 'intermediate' | 'advanced'
}

interface GroupedReviewItem {
  articleId: string
  articleTitle: string
  articleLevel?: 'beginner' | 'intermediate' | 'advanced'
  items: ReviewItem[]
  latestTimestamp: Date
}

export default function ReviewPage() {
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([])
  const [filter, setFilter] = useState<'all' | '7days' | '14days'>('all')
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped')

  useEffect(() => {
    loadReviewItems()
  }, [])

  const loadReviewItems = () => {
    const stored = localStorage.getItem('reviewList')
    if (stored) {
      try {
        const items: ReviewItem[] = JSON.parse(stored)
        // timestamp를 Date 객체에서 문자열로 변환된 경우 처리
        const normalizedItems = items.map(item => ({
          ...item,
          timestamp: typeof item.timestamp === 'string' ? item.timestamp : new Date(item.timestamp).toISOString()
        }))
        setReviewItems(normalizedItems)
      } catch (error) {
        console.error('Failed to parse review items:', error)
        setReviewItems([])
      }
    }
  }

  const getFilteredItems = () => {
    if (filter === 'all') return reviewItems

    const now = new Date()
    const days = filter === '7days' ? 7 : 14

    return reviewItems.filter((item) => {
      const itemDate = new Date(item.timestamp)
      const diffDays = Math.floor(
        (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      return diffDays <= days
    })
  }

  const groupByArticle = (items: ReviewItem[]): GroupedReviewItem[] => {
    const grouped = new Map<string, ReviewItem[]>()
    
    items.forEach(item => {
      const key = item.articleId || 'unknown'
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(item)
    })

    return Array.from(grouped.entries()).map(([articleId, items]) => {
      const firstItem = items[0]
      const latestTimestamp = items.reduce((latest, item) => {
        const itemDate = new Date(item.timestamp)
        return itemDate > latest ? itemDate : latest
      }, new Date(items[0].timestamp))

      return {
        articleId: articleId === 'unknown' ? '' : articleId,
        articleTitle: firstItem.articleTitle || '알 수 없는 기사',
        articleLevel: firstItem.articleLevel,
        items: items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        latestTimestamp,
      }
    }).sort((a, b) => b.latestTimestamp.getTime() - a.latestTimestamp.getTime())
  }

  const handleRemove = (articleId: string, questionId: string) => {
    const updated = reviewItems.filter(item => 
      !(item.articleId === articleId && item.question.id === questionId)
    )
    setReviewItems(updated)
    localStorage.setItem('reviewList', JSON.stringify(updated))
  }

  const handleRemoveArticle = (articleId: string) => {
    const updated = reviewItems.filter(item => item.articleId !== articleId)
    setReviewItems(updated)
    localStorage.setItem('reviewList', JSON.stringify(updated))
  }

  const handleRetakeQuiz = (articleId: string, articleTitle: string, articleLevel?: string) => {
    if (articleId) {
      // 퀴즈 페이지로 이동하면서 기사 정보 전달
      const level = articleLevel || 'intermediate'
      window.location.href = `/quiz?articleId=${encodeURIComponent(articleId)}&title=${encodeURIComponent(articleTitle)}&level=${level}`
    } else {
      alert('기사 정보가 없어 퀴즈를 시작할 수 없습니다.')
    }
  }

  const filteredItems = getFilteredItems()
  const groupedItems = groupByArticle(filteredItems)

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">복습 리스트</h1>
        <p className="text-gray-600">
          틀린 문제들을 기사별로 정리하여 다시 복습해보세요. 주기적으로 복습하면 어휘 실력이 향상됩니다.
        </p>
      </div>

      {/* Filter and View Mode */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('7days')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === '7days'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            최근 7일
          </button>
          <button
            onClick={() => setFilter('14days')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === '14days'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            최근 14일
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            기사별 보기
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            목록 보기
          </button>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-600 text-lg">
            {filter === 'all'
              ? '복습할 문제가 없습니다. 퀴즈를 풀어보세요!'
              : `해당 기간에 복습할 문제가 없습니다.`}
          </p>
          <Link href="/quiz" className="btn-primary mt-4 inline-block">
            퀴즈 풀기
          </Link>
        </div>
      ) : viewMode === 'grouped' ? (
        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.articleId || 'unknown'} className="card">
              {/* 기사 헤더 */}
              <div className="border-b border-gray-200 pb-4 mb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                        {group.articleTitle}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {group.articleLevel && (
                        <span className={`px-2 py-1 rounded text-xs ${
                          group.articleLevel === 'beginner' ? 'bg-green-100 text-green-800' :
                          group.articleLevel === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {group.articleLevel === 'beginner' ? '초급' : 
                           group.articleLevel === 'intermediate' ? '중급' : '고급'}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(group.latestTimestamp, 'yyyy년 MM월 dd일')}
                      </span>
                      <span className="text-primary-600 font-medium">
                        오답 {group.items.length}개
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {group.articleId && (
                      <>
                        <button
                          onClick={() => handleRetakeQuiz(group.articleId, group.articleTitle, group.articleLevel)}
                          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 text-sm"
                        >
                          <RefreshCw className="w-4 h-4" />
                          다시 풀기
                        </button>
                        <Link
                          href={`/news/${group.articleId}`}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                          기사 보기
                        </Link>
                      </>
                    )}
                    <button
                      onClick={() => handleRemoveArticle(group.articleId)}
                      className="px-4 py-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      전체 제거
                    </button>
                  </div>
                </div>
              </div>

              {/* 틀린 문제들 */}
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={`${item.question.id}-${item.timestamp}`} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          {format(new Date(item.timestamp), 'yyyy년 MM월 dd일 HH:mm')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemove(group.articleId, item.question.id)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        제거
                      </button>
                    </div>

                    <div className="mb-3">
                      <span className="text-sm font-semibold text-primary-600">
                        핵심 어휘: {item.question.word}
                      </span>
                      <h3 className="text-lg font-semibold mt-2 mb-3">
                        {item.question.question}
                      </h3>

                      <div className="space-y-2">
                        {item.question.options.map((option, optIndex) => {
                          const isCorrect = optIndex === item.question.correctAnswer
                          const isUserAnswer = optIndex === item.userAnswer

                          let bgColor = 'bg-gray-50'
                          let borderColor = 'border-gray-200'
                          let icon = null

                          if (isCorrect) {
                            bgColor = 'bg-green-50'
                            borderColor = 'border-green-300'
                            icon = <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                          } else if (isUserAnswer) {
                            bgColor = 'bg-red-50'
                            borderColor = 'border-red-300'
                            icon = <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                          }

                          return (
                            <div
                              key={optIndex}
                              className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                            >
                              <span className="font-semibold mr-2">
                                {String.fromCharCode(65 + optIndex)}.
                              </span>
                              {option}
                              {icon}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-semibold text-blue-900 mb-1 text-sm">설명:</p>
                      <p className="text-blue-800 text-sm">{item.question.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div key={`${item.question.id}-${item.timestamp}`} className="card">
              {item.articleTitle && (
                <div className="mb-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span className="font-medium">{item.articleTitle}</span>
                    {item.articleId && (
                      <Link
                        href={`/news/${item.articleId}`}
                        className="text-primary-600 hover:text-primary-700 text-xs"
                      >
                        기사 보기 →
                      </Link>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    {format(new Date(item.timestamp), 'yyyy년 MM월 dd일 HH:mm')}
                  </span>
                </div>
                <button
                  onClick={() => handleRemove(item.articleId || '', item.question.id)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  제거
                </button>
              </div>

              <div className="mb-4">
                <span className="text-sm font-semibold text-primary-600">
                  핵심 어휘: {item.question.word}
                </span>
                <h3 className="text-lg font-semibold mt-2 mb-4">
                  {item.question.question}
                </h3>

                <div className="space-y-2">
                  {item.question.options.map((option, optIndex) => {
                    const isCorrect = optIndex === item.question.correctAnswer
                    const isUserAnswer = optIndex === item.userAnswer

                    let bgColor = 'bg-gray-50'
                    let borderColor = 'border-gray-200'
                    let icon = null

                    if (isCorrect) {
                      bgColor = 'bg-green-50'
                      borderColor = 'border-green-300'
                      icon = <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                    } else if (isUserAnswer) {
                      bgColor = 'bg-red-50'
                      borderColor = 'border-red-300'
                      icon = <XCircle className="w-4 h-4 text-red-600 inline ml-2" />
                    }

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                      >
                        <span className="font-semibold mr-2">
                          {String.fromCharCode(65 + optIndex)}.
                        </span>
                        {option}
                        {icon}
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-semibold text-blue-900 mb-1">설명:</p>
                <p className="text-blue-800">{item.question.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}



