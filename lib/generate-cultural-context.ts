import { generateText } from './openai'

/**
 * 기사 내용에 맞는 문화적 맥락을 생성합니다
 */
export async function generateCulturalContext(
  title: string,
  content: string,
  level: 'beginner' | 'intermediate' | 'advanced'
): Promise<{
  title: string
  description: string
  examples: string[]
}> {
  // 난이도별 지시사항
  let levelGuidance = ''
  if (level === 'beginner') {
    levelGuidance = `BEGINNER LEVEL (A1-A2) - SIMPLE EXPLANATIONS:
- Use VERY simple language and basic vocabulary (e.g., "important", "people", "different", "same", "good", "bad")
- Use short sentences (10-15 words maximum)
- Explain cultural background in easy-to-understand terms
- Focus on simple facts: "In some countries, people do X. In other countries, people do Y."
- Use simple examples that beginners can relate to
- Avoid complex concepts, academic terms, or sophisticated analysis
- Keep explanations to 3-4 simple sentences`
  } else if (level === 'intermediate') {
    levelGuidance = `INTERMEDIATE LEVEL (B1-B2) - DETAILED EXPLANATIONS:
- Use clear language with SOME academic vocabulary (e.g., "perspective", "significance", "tradition", "custom", "society")
- Use medium-length sentences (15-25 words)
- Provide detailed cultural background knowledge with moderate complexity
- Include historical context, societal perspectives, and cultural significance
- Explain how different cultures might view this topic differently
- Use specific examples from different countries or regions
- Provide 5-6 detailed sentences with moderate complexity`
  } else {
    levelGuidance = `ADVANCED LEVEL (C1-C2) - SOPHISTICATED ANALYSIS:
- Use sophisticated, academic, and nuanced vocabulary (e.g., "ideological framework", "cultural paradigm", "societal construct", "historical trajectory", "cross-cultural perspective")
- Use complex sentence structures (20-35 words)
- Provide sophisticated cultural analysis with nuanced understanding
- Include deep historical context, cross-cultural perspectives, and ideological frameworks
- Discuss broader cultural implications and theoretical perspectives
- Use advanced concepts and academic terminology
- Provide 7-8 comprehensive sentences with sophisticated analysis`
  }

  // 기사 내용을 더 많이 활용 (최대 5000자로 증가)
  const articleContent = content.length > 5000 ? content.substring(0, 5000) : content
  
  // 기사에서 주요 키워드와 주제 추출
  const mainTopic = identifyMainTopic(title, content)
  const keyEntities = extractKeyEntities(title, content)
  const specificInfo = extractSpecificInfo(title, content)
  
  const prompt = `You are a cultural studies expert and educator. Analyze THIS SPECIFIC news article in detail and provide UNIQUE, ARTICLE-SPECIFIC background knowledge that helps ${level} English learners understand the cultural, historical, and social context.

CRITICAL: You MUST analyze the ACTUAL content of this article. Do NOT provide generic information. Your response MUST be specific to what this article discusses.

ARTICLE INFORMATION:
Title: ${title}
Main Topic Identified: ${mainTopic}
Key Entities Mentioned: ${keyEntities.length > 0 ? keyEntities.join(', ') : 'Various'}
Specific Information from Article: ${specificInfo}
Full Article Content: ${articleContent}

IMPORTANT: The article title mentions "${title}". You MUST provide cultural/historical context SPECIFIC to what "${title}" refers to. If it's about a specific team, organization, event, or topic, explain the cultural/historical background of THAT specific thing, not generic information.

YOUR TASK:
Based on the ACTUAL content of this article, provide SPECIFIC background knowledge that helps readers understand the cultural, historical, and social context. 

ANALYSIS REQUIRED:
1. Read the article content CAREFULLY and identify:
   - What SPECIFIC event, issue, topic, team, organization, or person is being discussed?
   - What countries, regions, or organizations are mentioned?
   - What historical events or dates are referenced?
   - What cultural or social aspects are highlighted?
   - What makes this article UNIQUE? What specific details are mentioned?

2. Then provide background knowledge SPECIFIC to what this article discusses:
   - If the article mentions a specific team/organization (like "Huskers"), explain the cultural/historical significance of THAT team/organization
   - If the article mentions a specific country, explain that country's cultural/historical context relevant to the article
   - If the article mentions a specific event, explain the historical background of that event
   - If the article discusses a policy, explain the cultural values that shape such policies
   - If the article mentions organizations or treaties, explain their historical and cultural significance
   - If the article discusses sports, explain the cultural significance of that sport in the relevant region/country
   - If the article discusses education, explain the cultural/historical context of education in that region
   - ALWAYS connect to SPECIFIC details from the article

CRITICAL REQUIREMENTS - YOU MUST FOLLOW THESE:
1. DO NOT summarize the article - provide BACKGROUND knowledge
2. DO NOT use generic phrases like "this is important", "different cultures have different views", "this topic has important cultural background", "understanding the context helps", "different cultures and historical experiences shape"
3. DO provide SPECIFIC facts, dates, events, names, and examples related to what the article discusses
4. DO reference specific information from the article (countries, events, organizations, teams, people mentioned)
5. DO explain historical background, cultural practices, or social contexts SPECIFIC to the article's topic
6. DO mention specific countries, organizations, or cultural groups that are relevant to THIS article
7. DO explain why understanding this background helps interpret THIS specific article
8. DO start with a SPECIFIC fact, date, or historical event - NOT a generic statement
9. DO use concrete examples, names, dates, and facts - NOT abstract statements
10. If the article mentions a specific name (like "Huskers"), explain what that is and its cultural/historical significance

For the topic "${mainTopic}" as discussed in THIS article, provide information such as:
- Historical events, dates, or developments SPECIFIC to what the article mentions
- Cultural practices or traditions relevant to the countries/regions mentioned in the article
- Real examples from the specific countries or regions discussed in the article
- Key concepts, terms, or frameworks that are relevant to understanding this article's topic
- Cultural values or beliefs that shape discussions about the specific issue in this article

${levelGuidance}

Provide your response as JSON with this exact structure:
{
  "title": "A specific, descriptive title about the cultural/historical theme (e.g., 'The History of Climate Diplomacy', 'AI Ethics Across Cultures', 'Taiwan's Complex International Status')",
  "description": "A ${level === 'beginner' ? 'simple' : level === 'intermediate' ? 'detailed' : 'comprehensive'} explanation (5-7 sentences) with SPECIFIC facts: Start with a concrete historical event, date, or fact. Explain how this has shaped current discussions. Provide specific examples of cultural differences or historical context. Explain why this background helps interpret the article. Use concrete examples, names, dates, and facts - NOT abstract statements.",
  "examples": ["specific term 1", "specific term 2", "specific term 3", "specific term 4"]
}

EXAMPLE OF GOOD RESPONSE (for an article about climate summit):
{
  "title": "The History of Climate Diplomacy and Global Equity Debates",
  "description": "The concept of climate justice emerged in the 1990s when developing nations argued that industrialized countries, having benefited from fossil fuel use since the Industrial Revolution (starting around 1750), bear greater responsibility for addressing climate change. The 1992 Rio Earth Summit first established the principle of 'common but differentiated responsibilities,' recognizing that developed nations' historical emissions have created an 'atmospheric debt.' This framework continues to shape climate negotiations today, with countries like India and China emphasizing their right to development while Western nations focus on current emission levels. The 2015 Paris Agreement marked a shift toward voluntary national commitments, reflecting ongoing tensions between equity, historical responsibility, and the right to development.",
  "examples": ["common but differentiated responsibilities", "atmospheric debt", "historical responsibility", "right to development", "climate justice"]
}

EXAMPLE OF GOOD RESPONSE (for an article about Taiwan):
{
  "title": "Taiwan's Complex International Status and Cross-Strait Relations",
  "description": "Taiwan's international status stems from the Chinese Civil War (1945-1949), when the Republic of China government retreated to Taiwan after losing to the Communist Party. The 'One China' principle, recognized by most countries, holds that there is only one China, but interpretations differ: Beijing views Taiwan as a province, while Taipei maintains it is a separate sovereign state. The 1979 Taiwan Relations Act commits the U.S. to Taiwan's defense, creating a delicate balance. Cross-strait relations involve complex cultural, historical, and political factors, with Taiwan's democratic system contrasting with China's authoritarian model, reflecting broader tensions between different political and cultural systems in East Asia.",
  "examples": ["One China principle", "Cross-Strait relations", "Taiwan Relations Act", "sovereignty", "diplomatic recognition"]
}

EXAMPLE OF BAD RESPONSE (DO NOT DO THIS - too generic):
{
  "title": "Climate Change in Society",
  "description": "This topic is important in many cultures. Different people have different views. Understanding this helps you learn about the world. Climate change affects many countries.",
  "examples": ["climate", "environment", "global"]
}

EXAMPLE OF BAD RESPONSE (DO NOT DO THIS - generic fallback):
{
  "title": "Huskers: Cultural and Historical Context",
  "description": "This topic has important cultural and historical background. Understanding the context helps interpret news about this subject. Different cultures and historical experiences shape how people view this topic.",
  "examples": ["cultural awareness", "societal impact"]
}

If the article is about "Huskers" (likely a sports team), a GOOD response would be:
{
  "title": "College Football Culture in the American Midwest",
  "description": "The University of Nebraska's football team, known as the 'Huskers,' represents a deep cultural tradition in the American Midwest. College football in this region emerged in the late 19th century as universities established athletic programs, with the University of Nebraska fielding its first team in 1890. The term 'Huskers' refers to Nebraska's agricultural heritage, where farmers husked corn. This reflects how college sports in America often connect to regional identity and local economic history. The intense fan culture surrounding teams like the Huskers reflects broader American values around community, school pride, and regional competition that differ from professional sports models in other countries.",
  "examples": ["college athletics", "regional identity", "school pride", "agricultural heritage", "fan culture"]
}

Return ONLY valid JSON, no additional text.`

  try {
    const systemInstruction = `You are a cultural studies expert and educator. Your role is to provide SPECIFIC, FACTUAL background knowledge that helps learners understand the cultural and historical context of news articles. 

CRITICAL RULES - YOU MUST FOLLOW THESE STRICTLY:
1. DO NOT summarize or paraphrase the article content
2. DO provide specific historical facts, cultural practices, and real-world examples
3. DO explain what background knowledge is needed to understand the article's significance
4. AVOID generic statements - use concrete facts and examples
5. Focus on WHAT the reader needs to know, not what the article says
6. NEVER use phrases like "this topic has important cultural background", "understanding the context helps", "different cultures have different views", "this topic reflects", "shape how people view this topic"
7. ALWAYS start with a SPECIFIC fact, date, event, or historical context - NOT a generic statement
8. ALWAYS mention specific countries, organizations, dates, or events relevant to the article
9. If the article mentions a specific name (like "Huskers"), you MUST explain what that is and its cultural/historical significance
10. Your description MUST be at least 200 words and include specific details

If you cannot provide specific information, the system will use a fallback. Always respond with valid JSON only, no additional text.`

    const responseText = await generateText(prompt, systemInstruction)
    console.log('Cultural context AI response:', responseText.substring(0, 500))
    
    // JSON 추출 - 더 robust한 방법
    let jsonText = responseText.trim()
    
    // Markdown 코드 블록 제거
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // JSON 객체 찾기
    let jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      // 중괄호로 시작하는 부분 찾기
      const startIdx = jsonText.indexOf('{')
      const endIdx = jsonText.lastIndexOf('}')
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonMatch = [jsonText.substring(startIdx, endIdx + 1)]
      }
    }
    
    if (jsonMatch && jsonMatch[0]) {
      try {
        const result = JSON.parse(jsonMatch[0])
        
        // 결과 검증 및 정리
        const contextTitle = result.title && typeof result.title === 'string' && result.title.trim().length > 0
          ? result.title.trim()
          : generateFallbackTitle(identifyMainTopic(title, content), title)
        
        const description = result.description && typeof result.description === 'string' && result.description.trim().length > 150
          ? result.description.trim()
          : null
        
        const examples = Array.isArray(result.examples) && result.examples.length > 0
          ? result.examples
              .filter((e: any) => typeof e === 'string' && e.trim().length > 0)
              .slice(0, 5)
          : extractCulturalExamples(content, title)
        
        // description 검증: 더 엄격하게
        const isGeneric = isGenericDescription(description || '')
        const isTooShort = !description || description.length < 200
        
        // 일반적인 구문이 있거나 너무 짧으면 무조건 fallback 사용
        if (isGeneric || isTooShort) {
          console.log('❌ Description is generic or too short, using enhanced fallback')
          console.log('Description received:', description?.substring(0, 300) || 'null')
          console.log('Is generic:', isGeneric)
          console.log('Length:', description?.length || 0)
          console.log('Article title:', title.substring(0, 100))
          
          const topic = identifyMainTopic(title, content)
          const specificInfo = extractSpecificInfo(title, content)
          console.log('Topic identified:', topic)
          console.log('Specific info:', specificInfo.substring(0, 200))
          
          const enhancedDescription = generateEnhancedFallbackDescription(topic, level, title, content, specificInfo)
          console.log('✅ Enhanced fallback description:', enhancedDescription.substring(0, 200))
          
          return {
            title: contextTitle,
            description: enhancedDescription,
            examples,
          }
        }
        
        console.log('✅ Description passed validation')
        console.log('Description:', description?.substring(0, 200))
        
        return {
          title: contextTitle,
          description,
          examples,
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Attempted to parse:', jsonMatch[0].substring(0, 200))
        throw new Error('Failed to parse JSON response')
      }
    }
    
    throw new Error('No JSON found in response')
  } catch (error) {
    console.error('Error generating cultural context:', error)
    console.error('Error details:', error)
    
    // Fallback: 기사 내용 기반 기본 cultural context (구체적인 배경 지식 제공)
    // 기사에서 주제를 더 정확히 파악
    const topic = identifyMainTopic(title, content)
    const specificInfo = extractSpecificInfo(title, content)
    const fallbackTitle = generateFallbackTitle(topic, title)
    const fallbackDescription = generateEnhancedFallbackDescription(topic, level, title, content, specificInfo)
    
    return {
      title: fallbackTitle,
      description: fallbackDescription,
      examples: extractCulturalExamples(content, fallbackTitle),
    }
  }
}

/**
 * 주제별 fallback 제목 생성 (구체적인 제목)
 */
function generateFallbackTitle(topic: string, articleTitle: string): string {
  const topicTitles: Record<string, string> = {
    'climate and environment': 'Climate Change and Global Environmental Policy',
    'technology and AI': 'Artificial Intelligence and Cultural Transformation',
    'politics and governance': 'Political Systems and Cultural Values',
    'economics and trade': 'Global Economics and Cultural Perspectives',
    'health and medicine': 'Healthcare Systems Across Cultures',
    'education': 'Education Systems and Cultural Values',
    'culture and society': 'Cultural Practices and Social Change',
    'international relations': 'International Relations and Cultural Diplomacy',
  }
  
  // 주제에 맞는 제목이 있으면 사용
  const topicKey = Object.keys(topicTitles).find(key => topic.includes(key.split(' ')[0]))
  if (topicKey) {
    return topicTitles[topicKey]
  }
  
  // 주제를 찾지 못한 경우, 기사 제목에서 의미있는 키워드 추출
  const titleWords = articleTitle.toLowerCase().split(/\s+/)
  const commonWords = ['the', 'a', 'an', 'in', 'on', 'at', 'for', 'to', 'of', 'and', 'or', 'but', 'is', 'are', 'was', 'were']
  const keywords = titleWords.filter(word => word.length > 5 && !commonWords.includes(word))
  
  if (keywords.length > 0) {
    const mainKeyword = keywords[0].charAt(0).toUpperCase() + keywords[0].slice(1)
    return `${mainKeyword}: Cultural and Historical Context`
  }
  
  return 'Cultural Background and Context'
}

/**
 * 기사에서 주요 주제 식별 (개선된 버전)
 */
function identifyMainTopic(title: string, content: string): string {
  const text = (title + ' ' + content).toLowerCase()
  
  // 더 구체적인 주제 키워드 패턴 (우선순위 순)
  const topics: Array<{ pattern: string, topic: string }> = [
    { pattern: 'taiwan|taipei|china.*taiwan|taiwan.*china', topic: 'Taiwan and Cross-Strait Relations' },
    { pattern: 'climate|global warming|emission|carbon|cop[0-9]|paris agreement', topic: 'Climate Change and Environmental Policy' },
    { pattern: 'artificial intelligence|ai|machine learning|chatgpt|gpt|neural network', topic: 'Artificial Intelligence and Technology' },
    { pattern: 'ukraine|russia|war|conflict|nato', topic: 'Ukraine-Russia Conflict and International Relations' },
    { pattern: 'election|democracy|vote|president|prime minister|government', topic: 'Politics and Governance' },
    { pattern: 'economy|economic|market|trade|business|gdp|inflation', topic: 'Economics and Trade' },
    { pattern: 'health|medical|disease|healthcare|hospital|pandemic', topic: 'Health and Medicine' },
    { pattern: 'education|school|university|student|learning', topic: 'Education' },
    { pattern: 'technology|digital|computer|internet|cyber', topic: 'Technology' },
    { pattern: 'culture|cultural|tradition|society|social', topic: 'Culture and Society' },
    { pattern: 'international|diplomacy|foreign|global|united nations', topic: 'International Relations' },
  ]
  
  for (const { pattern, topic } of topics) {
    if (new RegExp(pattern, 'i').test(text)) {
      return topic
    }
  }
  
  return 'Current Events'
}

/**
 * 기사에서 주요 엔티티(인명, 지명, 조직명 등) 추출
 */
function extractKeyEntities(title: string, content: string): string[] {
  const text = title + ' ' + content
  const entities: string[] = []
  
  // 대문자로 시작하는 연속된 단어들 (고유명사 패턴)
  const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g
  const matches = text.match(properNounPattern)
  
  if (matches) {
    // 일반적인 단어 제외
    const commonWords = ['The', 'This', 'That', 'These', 'Those', 'They', 'We', 'You', 'He', 'She', 'It', 'A', 'An', 'In', 'On', 'At', 'For', 'To', 'Of', 'And', 'Or', 'But']
    const filtered = matches.filter(m => 
      !commonWords.includes(m) && 
      m.length > 3 &&
      !m.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|January|February|March|April|May|June|July|August|September|October|November|December)$/i)
    )
    
    entities.push(...filtered.slice(0, 15))
  }
  
  return Array.from(new Set(entities))
}

/**
 * 기사에서 구체적인 정보 추출 (날짜, 숫자, 특정 사건 등)
 */
function extractSpecificInfo(title: string, content: string): string {
  const text = title + ' ' + content
  const info: string[] = []
  
  // 연도 추출 (1900-2099)
  const years = text.match(/\b(19|20)\d{2}\b/g)
  if (years && years.length > 0) {
    info.push(`Years mentioned: ${Array.from(new Set(years)).slice(0, 5).join(', ')}`)
  }
  
  // 국가명 추출 (일반적인 국가명 패턴)
  const countries = text.match(/\b(China|United States|USA|US|Russia|Japan|Korea|India|Germany|France|Britain|UK|Taiwan|Ukraine|Brazil|Canada|Australia|Italy|Spain)\b/gi)
  if (countries && countries.length > 0) {
    info.push(`Countries mentioned: ${Array.from(new Set(countries.map(c => c.charAt(0).toUpperCase() + c.slice(1).toLowerCase()))).slice(0, 5).join(', ')}`)
  }
  
  // 조직/기관명 추출 (대문자로 시작하는 2단어 이상)
  const organizations = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,}\b/g)
  if (organizations && organizations.length > 0) {
    const filtered = organizations.filter(org => 
      org.length > 5 && 
      !org.match(/^(The|This|That|These|Those)/i) &&
      org.split(' ').length >= 2
    )
    if (filtered.length > 0) {
      info.push(`Organizations mentioned: ${Array.from(new Set(filtered)).slice(0, 5).join(', ')}`)
    }
  }
  
  // 숫자와 통계 추출
  const numbers = text.match(/\b\d{1,3}(?:,\d{3})*(?:\s*(?:percent|%|billion|million|thousand|dollars?|people|countries?))?\b/gi)
  if (numbers && numbers.length > 0) {
    info.push(`Key numbers/statistics: ${numbers.slice(0, 3).join(', ')}`)
  }
  
  return info.length > 0 ? info.join(' | ') : 'Various specific details mentioned in the article'
}

/**
 * 설명이 너무 일반적인지 확인
 */
function isGenericDescription(description: string): boolean {
  if (!description || description.length < 50) {
    return true
  }
  
  const genericPhrases = [
    'this topic is important',
    'different people have different views',
    'this is a complex issue',
    'understanding this helps',
    'this topic reflects',
    'many cultures',
    'various perspectives',
    'different countries',
    'this topic has important cultural and historical background',
    'understanding the context helps interpret news',
    'different cultures and historical experiences shape',
    'helps interpret news about this subject',
    'shape how people view this topic',
    'understanding these differences helps',
    'different regions have different perspectives',
    'based on their history and culture',
    'reflects cultural and historical differences',
    'understanding these differences helps interpret',
    'this topic reflects',
    'cultural and historical differences',
    'understanding these differences',
    'different regions have',
    'different perspectives based',
    'helps interpret news',
    'based on their',
    'history and culture',
    'important cultural and historical background',
    'understanding the context helps',
    'different cultures and historical experiences',
  ]
  
  const lowerDesc = description.toLowerCase()
  const hasGenericPhrase = genericPhrases.some(phrase => lowerDesc.includes(phrase))
  
  // 일반적인 구문이 있으면 무조건 일반적인 것으로 판단
  if (hasGenericPhrase) {
    console.log('Generic phrase detected:', genericPhrases.find(p => lowerDesc.includes(p)))
    return true
  }
  
  // 구체적인 정보(날짜, 숫자, 특정 이름, 구체적인 사건)가 있는지 확인
  const hasYear = /\b(19|20)\d{2}\b/.test(description)
  const hasPercentage = /\b\d+%/.test(description)
  const hasCountry = /\b(China|United States|Russia|Japan|Korea|India|Germany|France|Britain|Taiwan|Ukraine|Nebraska|America|American)\b/i.test(description)
  const hasOrganization = /\b(University|College|UN|NATO|EU|IPCC|UNESCO|Summit|Agreement)\b/i.test(description)
  const hasSpecificEvent = /\b(War|Summit|Agreement|Act|Conference|Revolution|Civil War)\b/i.test(description)
  const sentences = description.split('.').filter(s => s.trim().length > 10)
  const hasMultipleSentences = sentences.length > 3
  
  const hasSpecificInfo = hasYear || hasPercentage || hasCountry || hasOrganization || hasSpecificEvent
  
  // 구체적인 정보가 없거나 문장이 너무 적으면 일반적인 것으로 판단
  if (!hasSpecificInfo || !hasMultipleSentences) {
    console.log('Lacks specific info:', { hasYear, hasCountry, hasOrganization, hasSpecificEvent, hasMultipleSentences, sentenceCount: sentences.length })
    return true
  }
  
  return false
}

/**
 * 향상된 fallback 설명 생성 (기사 내용 기반)
 */
function generateEnhancedFallbackDescription(
  topic: string, 
  level: 'beginner' | 'intermediate' | 'advanced',
  title: string,
  content: string,
  specificInfo: string
): string {
  // 기사 제목과 내용에서 구체적인 정보 추출
  const titleLower = title.toLowerCase()
  const contentLower = content.toLowerCase()
  
  // 제목에서 주요 키워드 추출 (대문자로 시작하는 단어들)
  const titleKeywords = title.match(/\b[A-Z][a-z]+\b/g) || []
  const mainKeyword = titleKeywords.find(k => 
    k.length > 4 && 
    !['The', 'This', 'That', 'With', 'From', 'About', 'News'].includes(k)
  ) || titleKeywords[0] || ''
  
  // 기사에서 구체적인 정보 추출
  const countries = extractKeyEntities(title, content).filter(e => 
    e.match(/^(China|United States|Russia|Japan|Korea|India|Germany|France|Britain|Taiwan|Ukraine|Brazil|Canada|Australia|Nebraska)/i)
  )
  
  const years = content.match(/\b(19|20)\d{2}\b/g)
  const recentYear = years ? Array.from(new Set(years)).sort().reverse()[0] : null
  
  // 스포츠 팀 관련 (Huskers, etc.) - 더 넓은 패턴으로 검색
  if (titleLower.includes('husker') || titleLower.includes('huskers') || 
      contentLower.includes('husker') || contentLower.includes('nebraska') ||
      titleLower.includes('nebraska') || mainKeyword.toLowerCase().includes('husker')) {
    if (level === 'beginner') {
      return `The Huskers are a college football team from the University of Nebraska. College football is very popular in America. Many people watch college games. Teams represent schools and states. This is important in American culture.`
    } else if (level === 'intermediate') {
      return `The University of Nebraska's football team, known as the 'Huskers,' represents a significant cultural tradition in the American Midwest. College football emerged in the late 19th century as universities established athletic programs, with Nebraska fielding its first team in 1890. The term 'Huskers' refers to Nebraska's agricultural heritage, where farmers husked corn. College sports in America connect to regional identity and local economic history, with intense fan culture reflecting broader American values around community, school pride, and regional competition.`
    } else {
      return `The University of Nebraska's football program, known as the 'Huskers,' embodies deep cultural traditions in the American Midwest. College football in the United States emerged from late 19th-century university athletic programs, with Nebraska establishing its team in 1890. The 'Huskers' nickname reflects the state's agricultural heritage, where corn husking was a central economic activity. This connection between sports and regional identity illustrates how American college athletics function as cultural institutions that reinforce community bonds, regional pride, and local economic narratives, distinct from professional sports models in other countries. The intense fan culture surrounding teams like the Huskers reflects broader American cultural values around competition, community belonging, and institutional loyalty.`
    }
  }
  
  // 교육/대학 관련 (University, College, School 등)
  if (titleLower.includes('university') || titleLower.includes('college') || 
      titleLower.includes('school') || contentLower.includes('university') ||
      contentLower.includes('college')) {
    if (level === 'beginner') {
      return `Universities and colleges are important places for learning in many countries. In America, universities often have sports teams. These teams represent the school. Many people support their school's team. This is part of American culture.`
    } else if (level === 'intermediate') {
      return `Higher education institutions in the United States, particularly universities, have developed unique cultural traditions around athletics. College sports programs emerged in the late 19th century as universities established athletic departments. These programs connect to regional identity, with team names often reflecting local history or economic activities. The intense fan culture surrounding college athletics reflects broader American values around community, school pride, and regional competition, distinct from professional sports models in other countries.`
    } else {
      return `American higher education institutions have developed distinctive cultural traditions around intercollegiate athletics that reflect broader societal values. College sports programs, emerging from late 19th-century university athletic departments, function as cultural institutions that reinforce regional identity, community bonds, and institutional loyalty. Team names and traditions often connect to local economic history or regional characteristics, creating narratives that extend beyond athletics. The intense fan culture surrounding college sports reflects American cultural values around competition, community belonging, and the role of educational institutions in shaping regional identity, contrasting with professional sports models and educational systems in other countries.`
    }
  }
  
  // 주제별 + 기사 정보 기반 설명
  if (topic.includes('Taiwan') || titleLower.includes('taiwan')) {
    if (level === 'beginner') {
      return `Taiwan is an island near China. China says Taiwan is part of China. Taiwan says it is a separate country. The United States helps protect Taiwan. This is a very important issue in Asia.`
    } else if (level === 'intermediate') {
      return `Taiwan's status stems from the Chinese Civil War (1945-1949), when the Republic of China government retreated to Taiwan. The 'One China' principle, recognized by most countries, holds that there is only one China, but interpretations differ. The 1979 Taiwan Relations Act commits the U.S. to Taiwan's defense. Cross-strait relations involve complex historical, political, and cultural factors.`
    } else {
      return `Taiwan's international status reflects the unresolved legacy of the Chinese Civil War and competing conceptions of sovereignty. The 'One China' principle, while widely recognized, encompasses divergent interpretations: Beijing views Taiwan as a renegade province requiring reunification, while Taipei maintains de facto sovereignty. The 1979 Taiwan Relations Act creates a strategic ambiguity that has maintained regional stability while preventing formal independence. This reflects broader tensions between different political systems and cultural identities in East Asia.`
    }
  }
  
  // 기사 제목에서 더 많은 정보 추출하여 fallback 생성
  // 제목의 주요 키워드 기반 설명 생성
  if (mainKeyword && mainKeyword.length > 4) {
    const keywordLower = mainKeyword.toLowerCase()
    
    // 스포츠 관련 키워드
    if (keywordLower.includes('football') || keywordLower.includes('basketball') || 
        keywordLower.includes('soccer') || keywordLower.includes('baseball') ||
        contentLower.includes('sport') || contentLower.includes('game') ||
        contentLower.includes('team') || contentLower.includes('player')) {
      if (level === 'beginner') {
        return `Sports are very popular in many countries. Different countries like different sports. In America, football and basketball are very popular. Sports teams represent cities or schools. Many people watch sports games. This is important in many cultures.`
      } else if (level === 'intermediate') {
        return `Sports hold significant cultural importance across different societies, with each region developing distinct athletic traditions. In the United States, college and professional sports function as cultural institutions that reinforce community identity and regional pride. The intense fan culture surrounding sports reflects broader societal values around competition, teamwork, and collective belonging. Different countries prioritize different sports based on historical and cultural factors, making sports a lens through which to understand cultural values and social structures.`
      } else {
        return `Sports function as cultural institutions that reflect and reinforce societal values, regional identities, and collective belonging. The development of athletic traditions varies significantly across cultures, with each society prioritizing different sports based on historical, economic, and cultural factors. In the United States, intercollegiate and professional sports have evolved into complex cultural systems that extend beyond entertainment, shaping community identity, regional pride, and social cohesion. The intense fan culture and institutional support for athletics reveal deeper cultural values around competition, achievement, and collective identity that differ from professional sports models in other countries.`
      }
    }
  }
  
  // 기본 fallback로 전환 (title과 content 전달)
  return generateFallbackDescription(topic, level, title, content)
}

/**
 * 주제별 fallback 설명 생성 (구체적인 배경 지식)
 */
function generateFallbackDescription(
  topic: string, 
  level: 'beginner' | 'intermediate' | 'advanced',
  title?: string,
  content?: string
): string {
  const descriptions: Record<string, Record<string, string>> = {
    'climate and environment': {
      beginner: 'Climate change became a global concern in the 1980s when scientists first warned about rising temperatures. Many countries signed the Paris Agreement in 2015 to limit global warming. Different countries have different responsibilities because some countries used more fossil fuels in the past. Understanding this history helps explain why countries disagree about climate action.',
      intermediate: 'The modern climate movement traces its origins to the 1988 establishment of the Intergovernmental Panel on Climate Change (IPCC) and the 1992 Rio Earth Summit, which introduced the principle of "common but differentiated responsibilities." This recognizes that developed nations, having industrialized using fossil fuels, bear greater historical responsibility. The 2015 Paris Agreement marked a shift toward voluntary national commitments, reflecting tensions between developed and developing nations over equity, historical responsibility, and the right to development.',
      advanced: 'Climate discourse is fundamentally shaped by the historical legacy of the Industrial Revolution and post-colonial resource extraction patterns. The 1992 UN Framework Convention on Climate Change established the principle of "common but differentiated responsibilities," acknowledging that developed nations\' historical emissions (since 1750) have created an "atmospheric debt." This framework continues to structure debates between developed nations emphasizing current emissions and developing nations invoking historical responsibility and equity principles, reflecting deeper tensions between growth-oriented development models and sustainability paradigms.',
    },
    'technology and AI': {
      beginner: 'Computers and AI started becoming important in the 1950s. Today, AI helps in many areas like medicine and transportation. Different countries have different rules about AI. Some countries want to use AI more, while others worry about privacy and jobs. Understanding these differences helps explain technology news.',
      intermediate: 'The field of artificial intelligence emerged from the 1956 Dartmouth Conference, where researchers first coined the term. Today\'s AI development reflects different cultural approaches: Silicon Valley\'s "move fast and break things" philosophy contrasts with the European Union\'s emphasis on regulation and privacy (GDPR), while China prioritizes state-led AI development for social control. These differences stem from varying cultural values around innovation, privacy, individual rights, and the role of government in technology.',
      advanced: 'AI development reflects fundamental cultural and philosophical differences in how societies conceptualize intelligence, agency, and human-technology relationships. The Western tradition, rooted in Cartesian dualism, tends to view AI as potentially replicating human cognition, while Eastern philosophical traditions with holistic worldviews may interpret AI differently. Contemporary debates about AI ethics, automation, and human agency intersect with deeper questions about labor, identity, and the definition of humanity that have been contested across cultures for millennia, revealing how technological development is inseparable from cultural and ideological frameworks.',
    },
    'politics and governance': {
      beginner: 'Different countries have different ways of choosing leaders and making laws. Some countries have elections where people vote. Other countries have different systems. Understanding how governments work helps explain political news from around the world.',
      intermediate: 'Political systems reflect deep cultural and historical differences. Democratic traditions in Western nations evolved from Enlightenment ideas about individual rights and popular sovereignty, while other regions may emphasize collective decision-making, traditional authority, or different conceptions of legitimacy. Contemporary political debates often reflect tensions between these different cultural frameworks for understanding power, representation, and governance.',
      advanced: 'Political systems embody competing cultural and philosophical traditions about the nature of authority, legitimacy, and the relationship between individuals and the state. The Western democratic model, rooted in Enlightenment individualism and social contract theory, contrasts with collectivist traditions, Confucian meritocracy, or other frameworks that prioritize different values. Contemporary political discourse reveals how these foundational cultural differences shape debates about representation, rights, and the proper role of government.',
    },
    'international relations': {
      beginner: 'Countries work together and sometimes disagree. International organizations like the United Nations help countries talk to each other. Different countries have different interests and goals. Understanding how countries interact helps explain international news.',
      intermediate: 'International relations are shaped by historical experiences, cultural values, and different conceptions of sovereignty and national interest. The post-World War II order established institutions like the UN based on Western liberal internationalist principles, but these coexist with alternative frameworks emphasizing non-interference, multipolarity, or regional integration. Understanding these different perspectives is essential for interpreting international diplomacy and conflicts.',
      advanced: 'International relations reflect competing cultural and ideological frameworks about sovereignty, legitimacy, and global order. The post-1945 liberal internationalist order, based on Western conceptions of universal rights and multilateralism, coexists with alternative traditions emphasizing non-interference, civilizational distinctiveness, or multipolar balance-of-power politics. Contemporary diplomatic discourse reveals tensions between these frameworks, shaped by historical experiences of colonialism, different cultural conceptions of authority, and varying approaches to the relationship between national sovereignty and global governance.',
    },
  }
  
  const topicKey = Object.keys(descriptions).find(key => topic.includes(key.split(' ')[0])) || 'current events'
  const topicDescriptions = descriptions[topicKey] || {}
  
  // 주제별 설명이 있으면 반환
  if (topicDescriptions[level]) {
    return topicDescriptions[level]
  }
  
  // 기본 fallback도 일반적인 구문을 피하고 구체적인 정보 제공
  if (!topicDescriptions[level]) {
    // 주제를 기반으로 최소한의 구체적인 정보 제공
    if (topic.includes('climate') || topic.includes('environment')) {
      return level === 'beginner' 
        ? 'Climate change became important in the 1980s. Scientists warned about rising temperatures. Countries signed the Paris Agreement in 2015. Different countries have different responsibilities.'
        : level === 'intermediate'
        ? 'The modern climate movement began with the 1988 establishment of the IPCC and the 1992 Rio Earth Summit. The principle of "common but differentiated responsibilities" recognizes that developed nations bear greater historical responsibility. The 2015 Paris Agreement marked a shift toward voluntary commitments.'
        : 'Climate discourse is shaped by the Industrial Revolution legacy and post-colonial patterns. The 1992 UN Framework Convention established "common but differentiated responsibilities," acknowledging that developed nations\' historical emissions since 1750 have created an "atmospheric debt."'
    }
    
    if (topic.includes('technology') || topic.includes('AI')) {
      return level === 'beginner'
        ? 'Computers and AI started in the 1950s. Today, AI helps in medicine and transportation. Different countries have different rules about AI.'
        : level === 'intermediate'
        ? 'Artificial intelligence emerged from the 1956 Dartmouth Conference. Today\'s AI development reflects different cultural approaches: Silicon Valley\'s philosophy contrasts with the EU\'s emphasis on regulation, while China prioritizes state-led development.'
        : 'AI development reflects fundamental cultural differences in how societies conceptualize intelligence and human-technology relationships. The Western tradition, rooted in Cartesian dualism, contrasts with Eastern holistic worldviews.'
    }
    
    // 기사 제목과 내용을 기반으로 구체적인 설명 생성
    if (title && content) {
      // 제목에서 주요 키워드 추출
      const titleWords = title.split(/\s+/).filter((w: string) => w.length > 4 && /^[A-Z]/.test(w))
      const mainSubject = titleWords[0] || title.split(/\s+/).find((w: string) => w.length > 5) || 'this topic'
      
      // 기사 내용에서 국가, 연도, 조직 등 추출
      const countries = content.match(/\b(China|United States|USA|Russia|Japan|Korea|India|Germany|France|Britain|Taiwan|Ukraine|Brazil|Canada|Australia|Nebraska|America)\b/gi)
      const years = content.match(/\b(19|20)\d{2}\b/g)
      const organizations = content.match(/\b(University|College|UN|NATO|EU|IPCC|UNESCO|Summit|Agreement|Act)\b/gi)
      
      const country = countries ? Array.from(new Set(countries))[0] : null
      const year = years ? Array.from(new Set(years)).sort().reverse()[0] : null
      const org = organizations ? Array.from(new Set(organizations))[0] : null
      
      // 구체적인 정보를 포함한 설명 생성
      if (country || year || org) {
        const contextParts: string[] = []
        if (year) contextParts.push(`in ${year}`)
        if (country) contextParts.push(`in ${country}`)
        if (org) contextParts.push(`through ${org}`)
        
        const contextStr = contextParts.length > 0 ? ` ${contextParts.join(', ')}` : ''
        
        if (level === 'beginner') {
          return `${mainSubject} is an important topic${contextStr}. This topic has a long history. Many people care about this topic. Different places have different ways of thinking about it. Learning about this history helps understand the news.`
        } else if (level === 'intermediate') {
          return `${mainSubject} represents a significant cultural and historical phenomenon${contextStr}. The development of this topic can be traced through specific historical events and cultural shifts. Different regions have developed distinct approaches based on their unique historical experiences, economic conditions, and cultural values. Understanding these specific historical and cultural contexts is essential for interpreting current developments related to this topic.`
        } else {
          return `${mainSubject} embodies complex cultural and historical dynamics${contextStr} that reflect deeper societal structures and ideological frameworks. The evolution of this topic reveals how different cultural traditions, historical experiences, and social systems shape contemporary understanding and responses. These differences are not merely variations in perspective but reflect fundamental differences in how societies conceptualize core values, authority, and the relationship between individuals and institutions.`
        }
      }
      
      // 최소한의 구체적 정보라도 포함
      return level === 'beginner'
        ? `${mainSubject} is an important topic in the news. This topic has a history. Many countries care about this topic. Learning about this history helps understand why people talk about it.`
        : level === 'intermediate'
        ? `${mainSubject} represents a significant cultural and historical phenomenon. The development of this topic involves specific historical events and cultural shifts. Different regions have developed distinct approaches based on their unique historical experiences and cultural values. Understanding these specific contexts helps interpret current news about this topic.`
        : `${mainSubject} embodies complex cultural and historical dynamics that reflect deeper societal structures. The evolution of this topic reveals how different cultural traditions and historical experiences shape contemporary understanding. These differences reflect fundamental variations in how societies conceptualize values, authority, and social relationships.`
    }
    
    // title과 content가 없을 때의 최종 fallback
    return level === 'beginner'
      ? 'This topic has cultural and historical background. Different countries have different views. Understanding this helps explain news.'
      : level === 'intermediate'
      ? 'This topic represents a significant cultural and historical phenomenon. The development of this topic involves specific historical events and cultural shifts. Different regions have developed distinct approaches based on their unique historical experiences and cultural values.'
      : 'This topic embodies complex cultural and historical dynamics that reflect deeper societal structures. The evolution of this topic reveals how different cultural traditions and historical experiences shape contemporary understanding.'
  }
  
  // topicDescriptions[level]이 있는 경우 (이미 위에서 return했지만 타입 체크를 위해)
  return topicDescriptions[level] || 'This topic has important cultural and historical background.'
}

/**
 * 기사 내용에서 문화적 예시 추출
 */
function extractCulturalExamples(content: string, topic: string): string[] {
  const examples: string[] = []
  
  // 일반적인 문화적 표현 패턴
  const patterns = [
    /\b(?:global|international|worldwide|societal|cultural)\s+\w+/gi,
    /\b(?:policy|strategy|initiative|movement|trend)\b/gi,
    /\b(?:awareness|understanding|perspective|viewpoint)\b/gi,
  ]
  
  patterns.forEach(pattern => {
    const matches = content.match(pattern)
    if (matches) {
      examples.push(...matches.slice(0, 2).map(m => m.toLowerCase()))
    }
  })
  
  // 기본 예시 추가
  if (examples.length === 0) {
    examples.push('global perspective', 'cultural awareness', 'societal impact')
  }
  
  return Array.from(new Set(examples)).slice(0, 5)
}

