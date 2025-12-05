import { NextRequest, NextResponse } from 'next/server'
import { generateQuizFromArticle } from '@/lib/openai'
import { fetchLatestNews } from '@/lib/news-api'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const articleId = searchParams.get('articleId')
  const articleTitle = searchParams.get('title')
  const articleContent = searchParams.get('content')
  const articleKeywords = searchParams.get('keywords')

  try {
    let article: { title: string; content: string; keywords: string[] } | null = null

    // 클라이언트에서 직접 기사 정보를 전달한 경우 (가장 확실한 방법)
    if (articleTitle && articleContent) {
      try {
        article = {
          title: decodeURIComponent(articleTitle),
          content: decodeURIComponent(articleContent),
          keywords: articleKeywords ? decodeURIComponent(articleKeywords).split(',').filter(k => k.trim()) : [],
        }
        console.log(`클라이언트에서 기사 정보 받음: ${article.title?.substring(0, 50) || article.title || 'Unknown'}...`)
      } catch (decodeError) {
        console.error('Error decoding URI components:', decodeError)
        // 디코딩 실패 시 원본 값 사용
        article = {
          title: articleTitle,
          content: articleContent,
          keywords: articleKeywords ? articleKeywords.split(',').filter(k => k.trim()) : [],
        }
      }
    }
    // articleId만 있는 경우 기사 찾기
    else if (articleId) {
      // /api/news에서 기사 목록 가져오기 (실시간 뉴스 우선)
      try {
        // 먼저 실시간 뉴스 시도
        let newsResponse = await fetch(
          `${request.nextUrl.origin}/api/news?real=true&level=intermediate`,
          { cache: 'no-store' }
        )
        
        // 실시간 뉴스가 없으면 샘플 데이터 시도
        if (!newsResponse.ok) {
          newsResponse = await fetch(
            `${request.nextUrl.origin}/api/news?level=intermediate`,
            { cache: 'no-store' }
          )
        }
        
        if (newsResponse.ok) {
          const newsData = await newsResponse.json()
          const foundArticle = newsData.articles?.find((a: { id: string; title?: string; content?: string; summary?: string; keywords?: string[] }) => a.id === articleId)
          
          if (foundArticle) {
            article = {
              title: foundArticle.title,
              content: foundArticle.content || foundArticle.summary || '',
              keywords: foundArticle.keywords || [],
            }
            console.log(`기사 찾음: ${foundArticle.title?.substring(0, 50) || foundArticle.title || 'Unknown'}...`)
          } else {
            console.warn(`기사를 찾을 수 없음: articleId=${articleId}, 사용 가능한 ID: ${newsData.articles?.map((a: { id: string }) => a.id).join(', ')}`)
          }
        }
      } catch (error) {
        console.error('Error fetching article from /api/news:', error)
      }
    }

    // 기사를 찾지 못했거나 articleId가 없으면 샘플 데이터 사용
    if (!article) {
      article = {
        title: 'Climate Summit 2025: Global Leaders Agree on Renewable Energy Targets',
        content: `World leaders gathered in Paris this week for the Climate Summit 2025, reaching a historic agreement on renewable energy targets. The summit, which brought together representatives from over 190 countries, focused on accelerating the transition to sustainable energy sources.

Key agreements include:
- Commitment to reduce carbon emissions by 50% by 2030
- Investment of $500 billion in renewable energy infrastructure
- Establishment of an international fund to support developing nations

"Today marks a turning point in our fight against climate change," said the summit's chairperson. "We have shown that when nations come together, we can achieve what once seemed impossible."

The agreement emphasizes the importance of solar and wind energy, with many countries committing to phase out fossil fuels entirely by 2040. Experts predict this will create millions of new jobs in the green energy sector.`,
        keywords: ['climate', 'renewable energy', 'sustainable', 'emissions', 'fossil fuels'],
      }
    }

    // AI로 퀴즈 생성
    const articleLevel = searchParams.get('level') || 'intermediate'
    console.log(`퀴즈 생성 중: ${article.title?.substring(0, 50) || article.title || 'Unknown'}... (난이도: ${articleLevel})`)
    const questions = await generateQuizFromArticle(
      article.title,
      article.content,
      article.keywords,
      articleLevel as 'beginner' | 'intermediate' | 'advanced'
    )

    if (questions.length === 0) {
      throw new Error('Failed to generate quiz questions')
    }

    console.log(`${questions.length}개의 퀴즈 문제 생성 완료`)
    return NextResponse.json({ questions })
  } catch (error: any) {
    console.error('Error generating quiz:', error)
    
    // Fallback: 샘플 퀴즈
    const fallbackQuestions = [
      {
        id: '1',
        question: 'The summit focused on _____ the transition to sustainable energy.',
        options: ['accelerating', 'slowing', 'stopping', 'preventing'],
        correctAnswer: 0,
        explanation: '"Accelerating" means to increase the speed or rate of something. In this context, it means to speed up the transition to sustainable energy.',
        word: 'accelerate',
      },
      {
        id: '2',
        question: 'Many countries are committing to _____ out fossil fuels entirely by 2040.',
        options: ['phase', 'keep', 'maintain', 'increase'],
        correctAnswer: 0,
        explanation: '"Phase out" is a phrasal verb meaning to gradually remove or stop using something.',
        word: 'phase out',
      },
      {
        id: '3',
        question: 'The agreement emphasizes the importance of _____ energy sources.',
        options: ['renewable', 'limited', 'finite', 'depleted'],
        correctAnswer: 0,
        explanation: 'Renewable energy sources are those that can be naturally replenished, such as solar and wind energy.',
        word: 'renewable',
      },
      {
        id: '4',
        question: 'Experts predict this will create millions of new jobs in the _____ sector.',
        options: ['green energy', 'fossil fuel', 'nuclear', 'coal'],
        correctAnswer: 0,
        explanation: 'The "green energy sector" refers to industries related to renewable and environmentally friendly energy sources.',
        word: 'green energy',
      },
      {
        id: '5',
        question: 'The summit brought together representatives from over 190 countries to _____ climate change.',
        options: ['ignore', 'address', 'avoid', 'deny'],
        correctAnswer: 1,
        explanation: '"Address" means to deal with or discuss a problem or issue. In this context, it means to discuss and find solutions for climate change.',
        word: 'address',
      },
    ]

    return NextResponse.json({ questions: fallbackQuestions })
  }
}

