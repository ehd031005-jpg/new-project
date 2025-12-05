import { NextResponse } from 'next/server'
import { fetchLatestNews } from '@/lib/news-api'
import { format, subDays } from 'date-fns'

export async function GET() {
  const hasApiKey = !!process.env.NEWS_API_KEY
  const today = new Date()
  const yesterday = subDays(today, 1)
  const fromDate = format(yesterday, 'yyyy-MM-dd')
  const toDate = format(today, 'yyyy-MM-dd')

  const testResult = {
    hasApiKey,
    apiKeyLength: hasApiKey ? process.env.NEWS_API_KEY!.length : 0,
    apiKeyPreview: hasApiKey 
      ? `${process.env.NEWS_API_KEY!.substring(0, 8)}...${process.env.NEWS_API_KEY!.substring(process.env.NEWS_API_KEY!.length - 4)}`
      : 'Not set',
    dateRange: {
      from: fromDate,
      to: toDate,
      today: format(today, 'yyyy-MM-dd HH:mm:ss'),
    },
    testResults: null as any,
    error: null as string | null,
  }

  if (!hasApiKey) {
    return NextResponse.json({
      ...testResult,
      error: 'NEWS_API_KEY가 .env.local 파일에 설정되지 않았습니다.',
    })
  }

  try {
    console.log('테스트: NewsAPI 호출 시작...')
    const articles = await fetchLatestNews(undefined, 'en', 5)
    console.log(`테스트: ${articles.length}개 기사 가져옴`)
    
    testResult.testResults = {
      articlesCount: articles.length,
      articles: articles.map((article) => ({
        title: article.title,
        source: article.source.name,
        publishedAt: article.publishedAt,
        publishedDate: article.publishedAt ? new Date(article.publishedAt).toLocaleString('ko-KR') : null,
        hasContent: !!article.content,
        hasDescription: !!article.description,
        contentLength: article.content?.length || 0,
        descriptionLength: article.description?.length || 0,
        url: article.url,
      })),
    }

    if (articles.length === 0) {
      testResult.error = '뉴스 기사를 가져오지 못했습니다. NewsAPI 무료 플랜의 제한일 수 있습니다. 서버 콘솔 로그를 확인하세요.'
    }

    return NextResponse.json(testResult)
  } catch (error: any) {
    console.error('테스트 오류:', error)
    testResult.error = error.message || 'Unknown error'
    if (error.stack) {
      testResult.error += `\n\nStack: ${error.stack}`
    }
    return NextResponse.json(testResult)
  }
}

