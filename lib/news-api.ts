import { format, subDays } from 'date-fns'

export interface NewsAPISource {
  id: string | null
  name: string
}

export interface NewsAPIArticle {
  source: NewsAPISource
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

export interface NewsAPIResponse {
  status: string
  totalResults: number
  articles: NewsAPIArticle[]
}

/**
 * NewsAPI에서 최신 뉴스를 가져옵니다
 */
export async function fetchLatestNews(
  apiKey?: string,
  language: string = 'en',
  pageSize: number = 10
): Promise<NewsAPIArticle[]> {
  const newsApiKey = apiKey || process.env.NEWS_API_KEY

  if (!newsApiKey) {
    console.warn('NEWS_API_KEY가 설정되지 않았습니다. 샘플 데이터를 반환합니다.')
    return []
  }

  try {
    // 먼저 top-headlines를 시도 (무료 플랜에서 더 안정적)
    let url = `https://newsapi.org/v2/top-headlines?` +
      `language=${language}&` +
      `pageSize=${pageSize}&` +
      `apiKey=${newsApiKey}`

    let response = await fetch(url, {
      next: { revalidate: 3600 }, // 1시간마다 캐시 갱신
      headers: {
        'User-Agent': 'NELS-News-Reader/1.0',
      },
    })

    let data: NewsAPIResponse | null = null

    if (response.ok) {
      data = await response.json()
    }

    // top-headlines가 실패하거나 결과가 없으면 everything 엔드포인트 시도
    if (!data || data.status !== 'ok' || !data.articles || data.articles.length === 0) {
      console.log('top-headlines 실패, everything 엔드포인트 시도...')
      
      // 오늘 날짜와 어제 날짜 계산
      const today = new Date()
      const yesterday = subDays(today, 1)
      const fromDate = format(yesterday, 'yyyy-MM-dd')
      const toDate = format(today, 'yyyy-MM-dd')

      url = `https://newsapi.org/v2/everything?` +
        `language=${language}&` +
        `from=${fromDate}&` +
        `to=${toDate}&` +
        `sortBy=publishedAt&` +
        `pageSize=${pageSize}&` +
        `apiKey=${newsApiKey}`

      response = await fetch(url, {
        next: { revalidate: 3600 },
        headers: {
          'User-Agent': 'NELS-News-Reader/1.0',
        },
      })

      if (response.ok) {
        data = await response.json()
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('NewsAPI error:', {
        status: response.status,
        statusText: response.statusText,
        message: errorData.message || errorData,
      })
      throw new Error(errorData.message || `NewsAPI error: ${response.status}`)
    }

    if (data && data.status === 'ok' && data.articles) {
      // 필터링 조건 완화: content가 없어도 description만 있으면 사용
      const filtered = data.articles.filter(
        (article) => article.title && (article.description || article.content)
      )
      
      console.log(`NewsAPI: ${data.articles.length}개 기사 중 ${filtered.length}개 필터링됨`)
      
      return filtered
    }

    console.warn('NewsAPI: 기사를 찾을 수 없습니다')
    return []
  } catch (error: any) {
    console.error('Error fetching news from NewsAPI:', {
      message: error.message,
      stack: error.stack,
    })
    return []
  }
}

/**
 * 특정 키워드로 뉴스를 검색합니다
 */
export async function searchNews(
  query: string,
  apiKey?: string,
  language: string = 'en',
  pageSize: number = 10
): Promise<NewsAPIArticle[]> {
  const newsApiKey = apiKey || process.env.NEWS_API_KEY

  if (!newsApiKey) {
    return []
  }

  try {
    const url = `https://newsapi.org/v2/everything?` +
      `q=${encodeURIComponent(query)}&` +
      `language=${language}&` +
      `sortBy=publishedAt&` +
      `pageSize=${pageSize}&` +
      `apiKey=${newsApiKey}`

    const response = await fetch(url, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `NewsAPI error: ${response.status}`)
    }

    const data: NewsAPIResponse = await response.json()

    if (data.status === 'ok' && data.articles) {
      return data.articles.filter(
        (article) => article.title && article.description && article.content
      )
    }

    return []
  } catch (error) {
    console.error('Error searching news:', error)
    return []
  }
}

