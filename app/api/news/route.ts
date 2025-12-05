import { NextRequest, NextResponse } from 'next/server'
import { fetchLatestNews } from '@/lib/news-api'
import { generateNewsSummary } from '@/lib/openai'
import { generateCulturalContext } from '@/lib/generate-cultural-context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const level = searchParams.get('level') || 'intermediate'
  const useRealNews = searchParams.get('real') === 'true'

  // 실시간 뉴스 사용 여부 확인
  if (useRealNews && process.env.NEWS_API_KEY) {
    try {
      console.log('실시간 뉴스 가져오기 시도...')
      const newsArticles = await fetchLatestNews(undefined, 'en', 20)
      console.log(`가져온 뉴스 기사 수: ${newsArticles.length}`)

      if (newsArticles.length > 0) {
        // AI로 뉴스를 학습용으로 변환 (최대 5개만 처리하여 속도 향상)
        const articlesToProcess = newsArticles.slice(0, 5)
        const processedArticles = await Promise.all(
          articlesToProcess.map(async (article, index) => {
            try {
              // AI 요약은 선택적으로 (시간이 오래 걸릴 수 있음)
              let aiSummary: { summary: string; keywords: string[]; grammarPoints: string[] } | null = null
              let culturalContext: { title: string; description: string; examples: string[] } | null = null
              try {
                const [summaryResult, culturalResult] = await Promise.allSettled([
                  Promise.race([
                    generateNewsSummary(
                      article.title,
                      article.content || article.description || '',
                      level as 'beginner' | 'intermediate' | 'advanced'
                    ),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Timeout')), 10000)
                    )
                  ]),
                  Promise.race([
                    generateCulturalContext(
                      article.title,
                      article.content || article.description || '',
                      level as 'beginner' | 'intermediate' | 'advanced'
                    ),
                    new Promise((_, reject) => 
                      setTimeout(() => reject(new Error('Timeout')), 15000)
                    )
                  ])
                ])
                
                if (summaryResult.status === 'fulfilled') {
                  aiSummary = summaryResult.value as { summary: string; keywords: string[]; grammarPoints: string[] }
                } else {
                  console.error(`AI summary error for article ${index}:`, summaryResult.reason)
                }
                
                if (culturalResult.status === 'fulfilled') {
                  culturalContext = culturalResult.value as { title: string; description: string; examples: string[] }
                } else {
                  console.error(`Cultural context error for article ${index}:`, culturalResult.reason)
                }
              } catch (aiError) {
                console.error(`AI processing error for article ${index}:`, aiError)
                aiSummary = null
                culturalContext = null
              }

              // content에서 "+chars" 같은 제한 표시 제거
              let fullContent = article.content || article.description || ''
              // "+숫자 chars" 또는 "[+숫자 chars]" 같은 패턴 제거
              fullContent = fullContent.replace(/\s*\[\+\d+\s*chars?\]/gi, '')
              fullContent = fullContent.replace(/\s*\+\d+\s*chars?/gi, '')
              
              // description과 content를 결합하여 더 긴 내용 제공
              if (article.description && article.content) {
                const desc = article.description.trim()
                const cont = article.content.replace(/\s*\[\+\d+\s*chars?\]/gi, '').replace(/\s*\+\d+\s*chars?/gi, '').trim()
                // content가 description을 포함하지 않으면 결합
                if (!cont.toLowerCase().includes(desc.toLowerCase().substring(0, 50))) {
                  fullContent = `${desc}\n\n${cont}`
                } else {
                  fullContent = cont
                }
              }

              return {
                id: `real-${index + 1}`,
                title: article.title,
                summary: aiSummary?.summary || article.description || '',
                content: fullContent,
                level: level,
                keywords: aiSummary?.keywords || [],
                grammarPoints: aiSummary?.grammarPoints || [],
                source: article.source?.name || 'Unknown',
                author: article.author || null,
                url: article.url || '',
                publishedAt: article.publishedAt || new Date().toISOString(),
                culturalContext: culturalContext || {
                  title: 'Current Events',
                  description: level === 'beginner'
                    ? 'This is a news article about things happening in the world. Reading news helps you learn about different places and people.'
                    : level === 'intermediate'
                    ? 'This is a real-time news article. Understanding current events helps you stay informed about global issues and cultural trends.'
                    : 'This article reflects contemporary cultural and societal dynamics. Engaging with such content enhances your understanding of global discourse and cultural nuances.',
                  examples: ['breaking news', 'current affairs', 'global events', 'cultural awareness', 'societal impact'],
                },
              }
            } catch (error) {
              console.error(`Error processing article ${index}:`, error)
              // 기본 처리
              // content에서 "+chars" 같은 제한 표시 제거
              let fullContent = article.content || article.description || ''
              fullContent = fullContent.replace(/\s*\[\+\d+\s*chars?\]/gi, '')
              fullContent = fullContent.replace(/\s*\+\d+\s*chars?/gi, '')
              
              // description과 content를 결합하여 더 긴 내용 제공
              if (article.description && article.content) {
                const desc = article.description.trim()
                const cont = article.content.replace(/\s*\[\+\d+\s*chars?\]/gi, '').replace(/\s*\+\d+\s*chars?/gi, '').trim()
                if (!cont.toLowerCase().includes(desc.toLowerCase().substring(0, 50))) {
                  fullContent = `${desc}\n\n${cont}`
                } else {
                  fullContent = cont
                }
              }

              // 에러 발생 시에도 cultural context 생성 시도
              let fallbackCulturalContext: { title: string; description: string; examples: string[] } | null = null
              try {
                const culturalResult = await Promise.race([
                  generateCulturalContext(
                    article.title || 'Untitled',
                    fullContent,
                    level as 'beginner' | 'intermediate' | 'advanced'
                  ),
                  new Promise<{ title: string; description: string; examples: string[] }>((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout')), 5000)
                  )
                ])
                fallbackCulturalContext = culturalResult
              } catch (e) {
                // 실패 시 기본값 사용
              }

              return {
                id: `real-${index + 1}`,
                title: article.title || 'Untitled',
                summary: article.description || '',
                content: fullContent,
                level: level,
                keywords: [],
                grammarPoints: [],
                source: article.source?.name || 'Unknown',
                author: article.author || null,
                url: article.url || '',
                publishedAt: article.publishedAt || new Date().toISOString(),
                culturalContext: fallbackCulturalContext || {
                  title: 'Current Events',
                  description: level === 'beginner'
                    ? 'This is a news article about things happening in the world.'
                    : level === 'intermediate'
                    ? 'This is a real-time news article. Understanding current events helps you stay informed.'
                    : 'This article reflects contemporary cultural and societal dynamics.',
                  examples: ['current events', 'global news', 'cultural awareness'],
                },
              }
            }
          })
        )

        if (processedArticles.length > 0) {
          console.log(`처리된 기사 수: ${processedArticles.length}`)
          return NextResponse.json({ articles: processedArticles })
        } else {
          console.warn('처리된 기사가 없습니다.')
        }
      } else {
        console.warn('NewsAPI에서 기사를 가져오지 못했습니다.')
      }
    } catch (error: any) {
      console.error('Error fetching real news:', {
        message: error.message,
        stack: error.stack,
      })
      // 오류 발생 시 샘플 데이터로 폴백 (아래 코드 계속 실행)
    }
  }

  // 샘플 데이터 (NewsAPI 키가 없거나 오류 발생 시) - 난이도별로 다르게
  let articles: Array<{
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
  }> = []
  
  if (level === 'beginner') {
    articles = [
      {
        id: '1',
        title: 'People Meet to Help the Earth',
        summary: 'Many countries met in Paris. They want to help the earth. They will use clean energy. This is good for everyone.',
        content: `Many countries met in Paris this week. They want to help the earth. They will use clean energy like sun and wind. This is good for everyone.

They will do three things:
- Use less bad air
- Put money in clean energy
- Help poor countries

The leader said: "This is a good day. We can help the earth together."

Many countries will stop using old energy. They will use sun and wind instead. This will make new jobs for people.`,
        level: level,
        keywords: ['important', 'people', 'country', 'change', 'help'],
        grammarPoints: ['Simple present tense', 'Basic past tense', 'Simple questions'],
        culturalContext: {
          title: 'Environmental Awareness Across Cultures',
          description: 'Different cultures have different ways of thinking about nature and the environment. In many Western cultures, there is a strong focus on protecting nature for future generations. In some Indigenous cultures, people see themselves as part of nature, not separate from it. Understanding these different cultural views helps us understand why environmental issues are important to people around the world.',
          examples: ['environmental protection', 'sustainable living', 'cultural values', 'future generations', 'nature connection']
        }
      },
      {
        id: '2',
        title: 'New Computers Help People',
        summary: 'Computers are getting better. They help doctors. They help cars. They help many people. This is good.',
        content: `Computers are getting better every day. They help doctors find problems. They help cars drive safely. They help many people.

Computers can do three things:
- Understand what people say
- See pictures
- Help machines work

People say computers must be good. They must help people, not hurt people.`,
        level: level,
        keywords: ['computer', 'help', 'people', 'doctor', 'car'],
        grammarPoints: ['Simple present tense', 'Can and must', 'Simple sentences'],
        culturalContext: {
          title: 'Technology and Cultural Change',
          description: 'Technology changes how people live and communicate in different cultures. In some cultures, technology is seen as progress and improvement. In other cultures, people worry that technology might change traditional ways of life. Understanding these different cultural views helps us understand how technology affects people around the world.',
          examples: ['digital culture', 'technological progress', 'cultural change', 'traditional values', 'modern life']
        }
      }
    ]
  } else if (level === 'intermediate') {
    articles = [
      {
        id: '1',
        title: 'Climate Summit 2025: Global Leaders Agree on Renewable Energy Targets',
        summary: 'World leaders have reached a historic agreement on renewable energy targets at the Climate Summit 2025. The summit brought together representatives from over 190 countries to discuss sustainable energy solutions.',
        content: `World leaders gathered in Paris this week for the Climate Summit 2025, reaching a historic agreement on renewable energy targets. The summit, which brought together representatives from over 190 countries, focused on accelerating the transition to sustainable energy sources.

Key agreements include:
- Commitment to reduce carbon emissions by 50% by 2030
- Investment of $500 billion in renewable energy infrastructure
- Establishment of an international fund to support developing nations

"Today marks a turning point in our fight against climate change," said the summit's chairperson. "We have shown that when nations come together, we can achieve what once seemed impossible."

The agreement emphasizes the importance of solar and wind energy, with many countries committing to phase out fossil fuels entirely by 2040. Experts predict this will create millions of new jobs in the green energy sector.`,
        level: level,
        keywords: ['significant', 'analysis', 'strategy', 'impact', 'develop'],
        grammarPoints: ['Present perfect tense', 'Passive voice', 'Conditional sentences'],
        culturalContext: {
          title: 'Climate Change and Global Cultural Perspectives',
          description: 'Climate change reflects deep cultural differences in how societies relate to nature and responsibility. Western industrialized nations, having contributed most to emissions, face questions of historical responsibility. Developing nations emphasize equity and their right to development. Indigenous communities, often most affected, bring traditional ecological knowledge. The global response reveals tensions between economic growth models, cultural values around consumption, and intergenerational responsibility. Understanding these cultural dimensions is crucial for meaningful international dialogue.',
          examples: ['historical responsibility', 'climate justice', 'traditional knowledge', 'economic models', 'intergenerational equity']
        }
      },
      {
        id: '2',
        title: 'Technology Advances in Artificial Intelligence',
        summary: 'Recent breakthroughs in AI technology are reshaping industries and daily life. Advanced language models and improved systems are transforming how we work and communicate.',
        content: `Artificial intelligence continues to revolutionize various sectors, from healthcare to transportation. Recent developments have shown remarkable progress in machine learning capabilities.

Key developments include:
- Advanced language models that can understand context
- Improved image recognition systems
- Enhanced automation in manufacturing

Industry leaders emphasize the importance of ethical AI development and responsible innovation.`,
        level: level,
        keywords: ['artificial intelligence', 'machine learning', 'automation', 'innovation', 'technology'],
        grammarPoints: ['Present continuous', 'Relative clauses', 'Passive voice'],
        culturalContext: {
          title: 'Technology and Cultural Transformation',
          description: 'The rise of AI reflects broader cultural shifts in how societies value human labor, creativity, and decision-making. Different cultures have varying attitudes toward automation: some embrace efficiency and progress, while others emphasize human connection and traditional craftsmanship. The cultural debate around AI touches on fundamental questions about human identity, work, and the relationship between technology and human values. Understanding these cultural perspectives helps navigate discussions about technology\'s role in society.',
          examples: ['human-centered design', 'cultural values', 'work identity', 'technological ethics', 'cultural adaptation']
        }
      }
    ]
  } else { // advanced
    articles = [
      {
        id: '1',
        title: 'Climate Summit 2025: Global Leaders Agree on Renewable Energy Targets',
        summary: 'In an unprecedented display of international cooperation, world leaders convened at the Climate Summit 2025 in Paris, culminating in a comprehensive agreement on renewable energy targets that represents a paradigm shift in global environmental policy. The summit, which assembled representatives from over 190 nations, was characterized by substantive discussions on accelerating the transition to sustainable energy sources through multifaceted strategies.',
        content: `World leaders gathered in Paris this week for the Climate Summit 2025, reaching a historic agreement on renewable energy targets. The summit, which brought together representatives from over 190 countries, focused on accelerating the transition to sustainable energy sources.

Key agreements include:
- Commitment to reduce carbon emissions by 50% by 2030
- Investment of $500 billion in renewable energy infrastructure
- Establishment of an international fund to support developing nations

"Today marks a turning point in our fight against climate change," said the summit's chairperson. "We have shown that when nations come together, we can achieve what once seemed impossible."

The agreement emphasizes the importance of solar and wind energy, with many countries committing to phase out fossil fuels entirely by 2040. Experts predict this will create millions of new jobs in the green energy sector.`,
        level: level,
        keywords: ['substantiate', 'comprehensive', 'facilitate', 'paradigm', 'nuanced'],
        grammarPoints: ['Subjunctive mood', 'Inverted conditionals', 'Complex noun phrases'],
        culturalContext: {
          title: 'Climate Change: Cultural, Historical, and Ideological Dimensions',
          description: 'Climate change discourse reveals fundamental cultural and ideological differences in how societies conceptualize humanity\'s relationship with nature. The Western Enlightenment tradition of human dominion over nature contrasts with Indigenous cosmologies emphasizing interdependence. The debate reflects deeper tensions between anthropocentric and ecocentric worldviews, between individualist and collectivist cultural frameworks, and between different temporal orientations toward immediate gratification versus long-term stewardship. Historical patterns of industrialization, colonialism, and resource extraction have created uneven responsibilities and vulnerabilities, making climate change not merely an environmental issue but a profound cultural and ethical challenge that exposes competing value systems and visions of progress.',
          examples: ['anthropocentrism vs ecocentrism', 'cultural worldviews', 'historical responsibility', 'temporal orientation', 'value systems']
        }
      },
      {
        id: '2',
        title: 'Technology Advances in Artificial Intelligence',
        summary: 'The landscape of artificial intelligence continues to undergo profound transformations, with recent breakthroughs fundamentally reshaping industries and daily life. Sophisticated language models and advanced recognition systems are revolutionizing how we interact with technology.',
        content: `Artificial intelligence continues to revolutionize various sectors, from healthcare to transportation. Recent developments have shown remarkable progress in machine learning capabilities.

Key developments include:
- Advanced language models that can understand context
- Improved image recognition systems
- Enhanced automation in manufacturing

Industry leaders emphasize the importance of ethical AI development and responsible innovation.`,
        level: level,
        keywords: ['sophisticated', 'profound', 'fundamentally', 'revolutionize', 'comprehensive'],
        grammarPoints: ['Advanced passive constructions', 'Cleft sentences', 'Complex noun phrases'],
        culturalContext: {
          title: 'AI and the Transformation of Human Agency',
          description: 'The development of AI represents a fundamental shift in cultural conceptions of intelligence, creativity, and human agency. This transformation intersects with deep philosophical questions about consciousness, free will, and the nature of knowledge that have been debated across cultures for millennia. Different cultural traditions - from Cartesian dualism in the West to holistic views in Eastern philosophies - offer contrasting frameworks for understanding the relationship between human and artificial intelligence. The cultural implications extend to questions of labor, identity, and the very definition of what it means to be human in an age of machine intelligence. These debates reflect broader cultural anxieties and aspirations about progress, control, and the future of human civilization.',
          examples: ['philosophical frameworks', 'cultural conceptions', 'human agency', 'technological determinism', 'cultural anxieties']
        }
      }
    ]
  }

  return NextResponse.json({ articles })
}

