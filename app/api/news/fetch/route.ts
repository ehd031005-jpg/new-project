import { NextRequest, NextResponse } from 'next/server'
import { fetchLatestNews, searchNews } from '@/lib/news-api'
import { generateNewsSummary } from '@/lib/openai'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') // 검색어 (선택)
    const level = searchParams.get('level') || 'intermediate'
    const pageSize = parseInt(searchParams.get('pageSize') || '10')

    // 뉴스 가져오기
    let newsArticles
    if (query) {
      newsArticles = await searchNews(query, undefined, 'en', pageSize)
    } else {
      newsArticles = await fetchLatestNews(undefined, 'en', pageSize)
    }

    if (newsArticles.length === 0) {
      // NewsAPI 키가 없거나 오류 발생 시 샘플 데이터 반환
      return NextResponse.json({
        articles: getSampleArticles(level),
        message: 'NewsAPI 키가 설정되지 않았거나 뉴스를 가져올 수 없습니다. 샘플 데이터를 표시합니다.',
      })
    }

    // AI로 뉴스를 학습용으로 변환
    const processedArticles = await Promise.all(
      newsArticles.slice(0, 10).map(async (article, index) => {
        try {
          // AI로 요약 및 키워드 추출
          const aiSummary = await generateNewsSummary(
            article.title,
            article.content || article.description || '',
            level as 'beginner' | 'intermediate' | 'advanced'
          )

          return {
            id: `news-${index + 1}-${Date.now()}`,
            title: article.title,
            summary: aiSummary.summary || article.description || '',
            content: article.content || article.description || '',
            level: level,
            keywords: aiSummary.keywords || extractKeywords(article.title + ' ' + (article.description || '')),
            grammarPoints: aiSummary.grammarPoints || [],
            source: article.source.name,
            author: article.author,
            url: article.url,
            publishedAt: article.publishedAt,
            culturalContext: generateCulturalContext(article),
          }
        } catch (error) {
          console.error(`Error processing article ${index}:`, error)
          // AI 처리 실패 시 기본 처리
          return {
            id: `news-${index + 1}-${Date.now()}`,
            title: article.title,
            summary: article.description || '',
            content: article.content || article.description || '',
            level: level,
            keywords: extractKeywords(article.title + ' ' + (article.description || '')),
            grammarPoints: [],
            source: article.source.name,
            author: article.author,
            url: article.url,
            publishedAt: article.publishedAt,
            culturalContext: generateCulturalContext(article),
          }
        }
      })
    )

    return NextResponse.json({
      articles: processedArticles,
      totalResults: newsArticles.length,
    })
  } catch (error: any) {
    console.error('Error in news fetch API:', error)
    return NextResponse.json(
      {
        articles: getSampleArticles('intermediate'),
        error: error.message || 'Failed to fetch news',
        message: '뉴스를 가져오는 중 오류가 발생했습니다. 샘플 데이터를 표시합니다.',
      },
      { status: 500 }
    )
  }
}

function extractKeywords(text: string): string[] {
  // 간단한 키워드 추출 (실제로는 AI가 처리)
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 4)
  
  // 빈도수 기반으로 상위 5개 선택
  const wordCount: Record<string, number> = {}
  words.forEach((word) => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  return Object.entries(wordCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}

function generateCulturalContext(article: any) {
  // 간단한 문화적 맥락 생성 (실제로는 AI가 처리)
  const topics = ['politics', 'technology', 'business', 'science', 'culture']
  const topic = topics.find((t) => 
    article.title.toLowerCase().includes(t) || 
    article.description?.toLowerCase().includes(t)
  ) || 'general'

  return {
    title: `Understanding ${topic.charAt(0).toUpperCase() + topic.slice(1)} News`,
    description: `This article discusses ${topic}-related topics. Understanding the context and vocabulary used in ${topic} news helps you engage with international discussions.`,
    examples: [`${topic} terminology`, 'international perspective', 'global context'],
  }
}

function getSampleArticles(level: string) {
  return [
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
      level: level,
      keywords: ['climate', 'renewable energy', 'sustainable', 'emissions', 'fossil fuels'],
      grammarPoints: ['Present perfect', 'Passive voice', 'Conditional sentences'],
      culturalContext: {
        title: 'Climate Change Awareness',
        description: 'Climate change has become a central issue in global politics. Understanding environmental vocabulary and policy discussions is essential for engaging with international news.',
        examples: ['carbon footprint', 'green energy', 'sustainable development']
      }
    },
  ]
}




