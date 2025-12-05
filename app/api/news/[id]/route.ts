import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id

  try {
    console.log(`기사 찾기 시도: articleId=${articleId}`)
    
    // /api/news를 직접 호출해서 기사 목록 가져오기
    const baseUrl = request.nextUrl.origin
    let newsResponse = await fetch(
      `${baseUrl}/api/news?real=true&level=intermediate`,
      { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
    
    // 실시간 뉴스가 없으면 샘플 데이터 시도
    if (!newsResponse.ok) {
      newsResponse = await fetch(
        `${baseUrl}/api/news?level=intermediate`,
        { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
    
    if (newsResponse.ok) {
      const newsData = await newsResponse.json()
      const foundArticle = newsData.articles?.find((a: { id: string; title?: string }) => {
        // 정확한 ID 매칭
        if (a.id === articleId) return true
        // real-1 형식 매칭 (real-1-타임스탬프도 허용)
        if (articleId.startsWith('real-') && a.id.startsWith('real-')) {
          const articleIndex = articleId.match(/real-(\d+)/)?.[1]
          const foundIndex = a.id.match(/real-(\d+)/)?.[1]
          return articleIndex === foundIndex
        }
        return false
      })
      
      if (foundArticle) {
        console.log(`기사 찾음: ${foundArticle.title.substring(0, 50)}...`)
        return NextResponse.json({ article: foundArticle })
      } else {
        console.warn(`기사를 찾을 수 없음: articleId=${articleId}, 사용 가능한 ID: ${newsData.articles?.map((a: { id: string }) => a.id).join(', ')}`)
      }
    }
    
    // 샘플 데이터 확인
    const sampleArticles: Record<string, {
      id: string
      title: string
      summary: string
      content: string
      level: string
      keywords: string[]
      grammarPoints: string[]
      culturalContext: {
        title: string
        description: string
        examples: string[]
      }
    }> = {
      '1': {
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
      },
      '2': {
        id: '2',
        title: 'Technology Advances in Artificial Intelligence',
        summary: 'Recent breakthroughs in AI technology are reshaping industries and daily life...',
        content: `Artificial intelligence continues to revolutionize various sectors, from healthcare to transportation. Recent developments have shown remarkable progress in machine learning capabilities.

Key developments include:
- Advanced language models that can understand context
- Improved image recognition systems
- Enhanced automation in manufacturing

Industry leaders emphasize the importance of ethical AI development and responsible innovation.`,
        level: 'intermediate',
        keywords: ['artificial intelligence', 'machine learning', 'automation', 'innovation'],
        grammarPoints: ['Present continuous', 'Relative clauses', 'Passive voice'],
        culturalContext: {
          title: 'The Digital Age',
          description: 'Understanding technology vocabulary is crucial in today\'s interconnected world. AI and automation are transforming how we work and communicate.',
          examples: ['algorithm', 'data-driven', 'automation']
        }
      }
    }

    const sampleArticle = sampleArticles[articleId]
    if (sampleArticle) {
      return NextResponse.json({ article: sampleArticle })
    }
    
    console.warn(`기사를 찾을 수 없음: articleId=${articleId}`)
    return NextResponse.json(
      { error: 'Article not found', articleId },
      { status: 404 }
    )
  } catch (error: any) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
