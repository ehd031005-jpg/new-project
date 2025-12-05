import { fetchLatestNews } from '@/lib/news-api'
import { generateNewsSummary } from '@/lib/openai'

/**
 * articleId로 기사를 찾는 공유 함수
 */
export async function getArticleById(
  articleId: string,
  level: string = 'intermediate'
): Promise<any | null> {
  // 실시간 뉴스에서 찾기
  if (process.env.NEWS_API_KEY) {
    try {
      const newsArticles = await fetchLatestNews(undefined, 'en', 20)
      
      if (newsArticles.length > 0) {
        // ID 매칭 시도 (real-1, real-2 형식 또는 real-1-타임스탬프 형식 모두 지원)
        const foundArticle = newsArticles.find((article, index) => {
          const baseId = `real-${index + 1}`
          // 정확한 매칭 (real-1)
          if (articleId === baseId) {
            return true
          }
          // 타임스탬프 포함 매칭 (real-1-1234567890)
          if (articleId.startsWith(`${baseId}-`)) {
            return true
          }
          return false
        })
        
        if (foundArticle) {
          // AI 요약 생성 (간단하게)
          let aiSummary
          try {
            aiSummary = await Promise.race([
              generateNewsSummary(
                foundArticle.title,
                foundArticle.content || foundArticle.description || '',
                level as 'beginner' | 'intermediate' | 'advanced'
              ),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
              )
            ]) as any
          } catch (aiError) {
            console.error('AI summary error:', aiError)
            aiSummary = null
          }

          return {
            id: articleId,
            title: foundArticle.title,
            summary: aiSummary?.summary || foundArticle.description || '',
            content: foundArticle.content || foundArticle.description || '',
            level: level,
            keywords: aiSummary?.keywords || [],
            grammarPoints: aiSummary?.grammarPoints || [],
            source: foundArticle.source?.name || 'Unknown',
            author: foundArticle.author || null,
            url: foundArticle.url || '',
            publishedAt: foundArticle.publishedAt || new Date().toISOString(),
            culturalContext: {
              title: 'Current Events',
              description: 'This is a real-time news article. Understanding current events helps you stay informed about global issues.',
              examples: ['breaking news', 'current affairs', 'global events'],
            },
          }
        }
      }
    } catch (error) {
      console.error('Error fetching real news:', error)
    }
  }

  // 샘플 데이터 확인
  const sampleArticles: Record<string, any> = {
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

  return sampleArticles[articleId] || null
}

