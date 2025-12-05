import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/openai'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { title, content, level } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // 난이도별 지시사항
    let levelInstructions = ''
    if (level === 'beginner') {
      levelInstructions = `BEGINNER LEVEL (A1-A2):
- Use simple, everyday vocabulary (e.g., "think", "like", "important", "good", "bad")
- Keep the question short and easy to understand (10-15 words)
- Use simple sentence structures (present tense, basic questions)
- Ask about personal opinions or simple facts
- Encourage responses of 50-100 words using simple English
- Example style: "What do you think about this news? Do you like it? Why?"`
    } else if (level === 'intermediate') {
      levelInstructions = `INTERMEDIATE LEVEL (B1-B2):
- Use clear language with some academic vocabulary (e.g., "opinion", "analysis", "impact", "perspective")
- Create a question with medium complexity (15-25 words)
- Use varied sentence structures (present perfect, conditionals, relative clauses)
- Ask for opinions with reasons and examples
- Encourage responses of 100-150 words with detailed explanations
- Example style: "What is your opinion on this article? Please provide your analysis and explain your reasoning."`
    } else {
      levelInstructions = `ADVANCED LEVEL (C1-C2):
- Use sophisticated, academic vocabulary (e.g., "analyze", "critically evaluate", "implications", "nuanced perspective")
- Create a complex, thought-provoking question (20-30 words)
- Use advanced sentence structures (subjunctive, complex conditionals, nominalizations)
- Ask for critical analysis, implications, and sophisticated viewpoints
- Encourage responses of 150-200 words with comprehensive analysis
- Example style: "Critically analyze this article and discuss the broader implications. Provide a nuanced perspective on the topic."`
    }
    
    // 기사 내용을 더 많이 사용 (8000자로 증가)
    const articleContent = content.substring(0, 8000)
    
    // STEP 1: AI를 사용하여 기사에서 구체적인 쟁점 추출 (강화된 버전)
    const extractControversyPrompt = `You are an expert news analyst. Your task is to DEEPLY ANALYZE this article and find a SPECIFIC, REAL CONTROVERSY or DEBATE.

Article Title: ${title}
Full Article Content (${articleContent.length} characters):
${articleContent}

CRITICAL ANALYSIS INSTRUCTIONS:
1. Read the ENTIRE article carefully - do not skip any paragraphs
2. Identify ALL stakeholders mentioned (government, experts, businesses, citizens, organizations, etc.)
3. Look for explicit disagreements, conflicts, or debates
4. Extract specific numbers, statistics, dates, and policies mentioned
5. Identify what different groups are saying about the same issue
6. Find trade-offs, dilemmas, or conflicting interests

WHAT TO LOOK FOR (in order of priority):
1. **Direct Quotes**: Who said what? Are there conflicting statements?
2. **Numbers & Statistics**: What do the numbers show? Do different groups interpret them differently?
3. **Policy Debates**: Are there specific policies, laws, or decisions being debated?
4. **Stakeholder Conflicts**: Which groups disagree? What are their specific arguments?
5. **Economic vs Social**: Are there trade-offs between economic benefits and social costs?
6. **Short-term vs Long-term**: Are there conflicts between immediate benefits and future consequences?

MANDATORY REQUIREMENTS:
- You MUST extract information DIRECTLY from the article text above
- You MUST identify SPECIFIC groups, people, or organizations mentioned in the article
- You MUST use EXACT quotes, numbers, or facts from the article
- You MUST NOT make up information that is not in the article
- You MUST NOT use generic phrases like "some people" or "experts" without identifying who they are from the article

If the article doesn't have an explicit controversy, analyze what COULD be debated based on:
- The stakeholders mentioned in the article
- The specific facts, numbers, or events described
- The potential implications of what is described
- Different interpretations of the same facts

MANDATORY OUTPUT: You MUST provide TWO CLEARLY OPPOSING SIDES with:
- Specific group names from the article (e.g., "the government officials mentioned in paragraph 3", "environmental groups cited in the article")
- Their specific arguments with quotes or paraphrased statements from the article
- Specific numbers, dates, or facts that support each side

Return your answer in this EXACT JSON format (no other text):
{
  "controversy": "One clear sentence describing what people are disagreeing about, referencing specific details from the article",
  "side1": {
    "group": "EXACT group name from the article (e.g., 'the government officials mentioned in paragraph 2', 'environmental groups cited in the article', 'hospital administrators quoted as saying...')",
    "argument": "Their EXACT claim from the article with specific numbers/details/quotes (e.g., 'will create 2 million jobs by 2030' or 'will cost $500 billion according to the report')",
    "evidence": "Specific quote, number, or fact from the article that supports this side"
  },
  "side2": {
    "group": "EXACT opposing group name from the article (e.g., 'economic analysts mentioned in the study', 'critics quoted in paragraph 5', 'opponents who argue...')",
    "argument": "Their EXACT opposing claim from the article with specific numbers/details/quotes (e.g., 'will cause 5% unemployment according to the analysis' or 'will harm small businesses as stated in the report')",
    "evidence": "Specific quote, number, or fact from the article that supports this side"
  },
  "specificDetails": ["Exact numbers, percentages, policies, dates, or events DIRECTLY from the article (e.g., '50% by 2030', '$500 billion investment', 'new immigration law passed in March')"],
  "articleContext": "Brief summary of the main topic and why this controversy matters (2-3 sentences)"
}

CRITICAL: 
- All information MUST come from the article text above
- Use exact quotes when possible (with quotation marks)
- Reference specific paragraphs or sections if helpful
- If a group is not explicitly named, describe them based on what they said in the article
- The controversy MUST be specific to THIS article, not a generic debate about the topic`

    let controversyData: {
      controversy: string
      side1: { group: string; argument: string; evidence?: string }
      side2: { group: string; argument: string; evidence?: string }
      specificDetails: string[]
      articleContext?: string
    } | null = null

    try {
      // 쟁점 추출 시도 (타임아웃 설정 - 더 긴 시간 허용)
      const controversyResponse = await Promise.race([
        generateText(extractControversyPrompt, 'You are an expert news analyst specializing in identifying controversies and debates in articles. You MUST carefully read the entire article and extract specific information. Always respond with valid JSON only, no other text. Use exact quotes and facts from the article.'),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 20000))
      ]) as string
      
      // JSON 추출 (여러 패턴 시도)
      let jsonMatch = controversyResponse.match(/```json\s*(\{[\s\S]*?\})\s*```/i)
      if (!jsonMatch) {
        jsonMatch = controversyResponse.match(/```\s*(\{[\s\S]*?\})\s*```/i)
      }
      if (!jsonMatch) {
        jsonMatch = controversyResponse.match(/(\{[\s\S]*\})/)
      }
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1])
          // 데이터 검증 (더 엄격하게)
          if (parsed.controversy && parsed.side1 && parsed.side2 && 
              parsed.side1.group && parsed.side1.argument && 
              parsed.side2.group && parsed.side2.argument &&
              parsed.controversy.length > 30 && // 충분히 구체적인 쟁점 설명
              parsed.side1.argument.length > 20 && // 충분히 구체적인 주장
              parsed.side2.argument.length > 20) {
            controversyData = parsed
            console.log('Successfully extracted controversy:', parsed.controversy)
            console.log('Side 1:', parsed.side1.group, '-', parsed.side1.argument)
            console.log('Side 2:', parsed.side2.group, '-', parsed.side2.argument)
            console.log('Specific details:', parsed.specificDetails)
          } else {
            console.warn('Extracted controversy data is incomplete or too generic:', {
              hasControversy: !!parsed.controversy,
              hasSide1: !!(parsed.side1?.group && parsed.side1?.argument),
              hasSide2: !!(parsed.side2?.group && parsed.side2?.argument),
              controversyLength: parsed.controversy?.length || 0,
              side1Length: parsed.side1?.argument?.length || 0,
              side2Length: parsed.side2?.argument?.length || 0
            })
          }
        } catch (e) {
          console.warn('Failed to parse controversy JSON:', e)
        }
      } else {
        console.warn('No JSON found in controversy response')
      }
    } catch (error) {
      console.warn('Failed to extract controversy, will use article content directly:', error)
    }
    
    // 기사에서 핵심 키워드와 주제 추출 (개선된 버전)
    const extractKeyTopics = (text: string): string[] => {
      // 고유명사, 숫자, 중요한 단어 추출
      const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || []
      const numbers = text.match(/\d+%|\$\d+|\d+\s+(?:million|billion|thousand|percent|people|countries|jobs|dollars)/gi) || []
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4 && !['this', 'that', 'these', 'those', 'their', 'there', 'would', 'could', 'should'].includes(word))
      
      const wordCount: Record<string, number> = {}
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
      
      const topWords = Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word)
      
      // 고유명사와 숫자도 포함 (중복 제거 - Set 대신 Record 사용)
      const combined = [...properNouns.slice(0, 5), ...numbers.slice(0, 3), ...topWords]
      const seen: Record<string, boolean> = {}
      const uniqueTopics: string[] = []
      for (const item of combined) {
        if (!seen[item.toLowerCase()]) {
          seen[item.toLowerCase()] = true
          uniqueTopics.push(item)
        }
      }
      return uniqueTopics.slice(0, 15)
    }
    
    const keyTopics = extractKeyTopics(title + ' ' + articleContent)
    
    // 기사 내용의 핵심 문장 추출 (개선된 버전 - 더 많은 문장)
    const extractKeySentences = (text: string): string => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
      // 첫 3문장 + 중간 2문장 + 마지막 2문장 (더 균형잡힌 추출)
      const firstSentences = sentences.slice(0, 3)
      const middleSentences = sentences.slice(Math.floor(sentences.length / 2), Math.floor(sentences.length / 2) + 2)
      const lastSentences = sentences.slice(-2)
      // 중복 제거 (Set 대신 Record 사용)
      const combined = [...firstSentences, ...middleSentences, ...lastSentences]
      const seen: Record<string, boolean> = {}
      const selected: string[] = []
      for (const sentence of combined) {
        const trimmed = sentence.trim()
        if (!seen[trimmed]) {
          seen[trimmed] = true
          selected.push(trimmed)
        }
      }
      return selected.join('. ').trim()
    }
    
    const keySentences = extractKeySentences(articleContent)
    
    // STEP 2: 추출된 쟁점을 기반으로 질문 생성
    let controversySection: string
    if (controversyData) {
      const cd = controversyData // TypeScript null 체크를 위한 변수
      controversySection = `=== IDENTIFIED CONTROVERSY (USE THIS EXACTLY) ===
Main Controversy: ${cd.controversy}

Side 1 - ${cd.side1.group}:
${cd.side1.argument}
${cd.side1.evidence ? `Evidence: ${cd.side1.evidence}` : ''}

Side 2 - ${cd.side2.group}:
${cd.side2.argument}
${cd.side2.evidence ? `Evidence: ${cd.side2.evidence}` : ''}

Specific Details from Article: ${cd.specificDetails.join(', ')}
${cd.articleContext ? `\n\nArticle Context: ${cd.articleContext}` : ''}

=== YOUR TASK ===
Create a debate question using the EXACT controversy above. Your question MUST:
1. Start with the controversy itself, NOT with "The article discusses..." or "The article mentions..."
2. Present BOTH sides clearly: ${cd.side1.group} vs ${cd.side2.group}
3. Include the specific details: ${cd.specificDetails.slice(0, 2).join(' and ')}
4. Ask students to take a position on this SPECIFIC debate

Example format:
"${cd.side1.group} argue that ${cd.side1.argument}, while ${cd.side2.group} claim ${cd.side2.argument}. The article mentions ${cd.specificDetails[0] || 'this issue'}. What is your position on this debate? Which side do you support and why?"

CRITICAL: Your question MUST start with the controversy, NOT with "The article discusses..." or "The article mentions...". Start directly with the group names and their arguments.`
    } else {
      controversySection = `=== ARTICLE INFORMATION ===
Title: ${title}

Key Topics/Keywords/Entities: ${keyTopics.join(', ')}

Key Content Excerpt (representative sentences from beginning, middle, and end):
${keySentences}

Full Article Content (${articleContent.length} characters):
${articleContent}

=== YOUR TASK ===
You MUST find a SPECIFIC CONTROVERSY in this article. Look for:
- Opposing viewpoints with specific arguments
- Conflicts between groups (supporters vs critics)
- Debates about policies with specific details
- Trade-offs with numbers or statistics

Then create a question that starts with the controversy itself, NOT with "The article discusses..."`
    }

    const prompt = `You are an English language teacher. Your CRITICAL task is to create a debate question based on the controversy identified below.

${levelInstructions}

${controversySection}

=== STEP 1: IDENTIFY THE CONTROVERSY ===
You MUST first identify what people are DISAGREEING about in this article. Look for:
- Opposing viewpoints (e.g., "some say X, but others argue Y")
- Conflicts between groups (e.g., "supporters vs critics", "experts disagree")
- Debates about policies or decisions (e.g., "pros and cons", "benefits vs drawbacks")
- Ethical dilemmas (e.g., "right vs wrong", "fair vs unfair")
- Trade-offs (e.g., "economic growth vs environmental protection")
- Controversial claims or arguments

If you cannot find a clear controversy, identify what COULD be debated:
- Potential negative consequences vs positive outcomes
- Different stakeholder perspectives (government, citizens, businesses, etc.)
- Short-term vs long-term implications
- Different solutions to the problem mentioned

=== STEP 2: CREATE A DEBATE QUESTION ===
Your question MUST:
1. **Present the TWO SIDES of the controversy** (e.g., "Some argue X, while others believe Y")
2. **Reference SPECIFIC details from the article** (numbers, policies, events, names)
3. **Ask students to TAKE A POSITION** on the debate
4. **NOT start with "This article discusses..." or "The article mentions..."** - these are too generic!
5. **Start directly with the CONTROVERSY or DEBATE** (e.g., "Some experts argue... while others claim...")

=== FORBIDDEN QUESTION FORMATS (DO NOT USE) ===
❌ "This article discusses [topic]. What do you think?"
❌ "The article mentions [topic]. What is your opinion?"
❌ "What do you think about this article?"
❌ "What is your opinion on [topic]?"
❌ "Do you agree or disagree with the article?"

These formats are TOO GENERIC and do not engage with specific controversies!

=== REQUIRED QUESTION FORMATS ===
✅ "Some experts argue that [specific claim from article], while others believe [opposing claim]. What is your position on this debate?"
✅ "[Specific policy/event from article] has divided opinion. Supporters say [specific reason], but critics argue [specific reason]. Which perspective do you support and why?"
✅ "The article presents a conflict between [group A] who want [X] and [group B] who prefer [Y]. What are the potential benefits and drawbacks of each approach? Which do you think is better?"
✅ "[Specific number/statistic from article] suggests [one perspective], but [another group] argues [opposing perspective]. What are your thoughts on this controversy?"

=== EXAMPLES OF EXCELLENT DEBATE QUESTIONS ===

Example 1 - Climate Article:
"Some experts argue that reducing emissions by 50% by 2030 will cause economic recession, while others claim it will create millions of green jobs. The article mentions that $500 billion will be invested. Do you think this investment will help or hurt the economy? Which side of this debate do you support?"

Example 2 - Technology Article:
"The article reports that AI is replacing healthcare workers. Hospital administrators support this for cost savings, but medical professionals worry about patient care quality. What are the potential benefits and risks of replacing human workers with AI? Should hospitals prioritize efficiency or human connection?"

Example 3 - Political Article:
"A new immigration policy has divided the country. Supporters claim it will add $50 billion to the economy, while critics argue it will increase unemployment by 2%. The article mentions both perspectives. Which economic argument do you find more convincing and why?"

Example 4 - Education Article:
"Some schools are banning smartphones, citing a 30% improvement in test scores. However, parents argue this prevents emergency communication. The article presents both sides. What is your position on this debate? Should schools prioritize academic performance or safety?"

=== CRITICAL INSTRUCTIONS ===
1. **DO NOT start with "This article discusses..."** - Start with the CONTROVERSY itself
2. **MUST present TWO opposing perspectives** from the article
3. **MUST reference SPECIFIC details** (numbers, policies, groups, events)
4. **MUST ask students to TAKE A POSITION** on the debate
5. **MUST be unique to this article's specific controversy**
6. Return ONLY the question text, no explanation

=== YOUR OUTPUT ===
Create ONE question that follows the required format above. Start directly with the controversy, not with "This article..." or "The article discusses..."`

    const systemInstruction = `You are an English language teacher creating debate-based writing prompts.

ABSOLUTE REQUIREMENTS:
1. You MUST identify a SPECIFIC CONTROVERSY or DEBATE in the article
2. You MUST present TWO OPPOSING PERSPECTIVES from the article
3. You MUST ask students to TAKE A POSITION on the debate
4. You MUST reference SPECIFIC details (numbers, policies, groups, events) from the article
5. You MUST NOT start with "This article discusses..." or "The article mentions..." - these are FORBIDDEN formats

FORBIDDEN QUESTION STARTS (NEVER USE):
- "This article discusses..."
- "The article mentions..."
- "What do you think about this article?"
- "What is your opinion on [topic]?"
- "Do you agree or disagree?"

REQUIRED QUESTION STRUCTURE:
Start with the CONTROVERSY itself, not the article:
- "Some experts argue [X], while others claim [Y]..."
- "[Policy/Event] has divided opinion. Supporters say [X], but critics argue [Y]..."
- "There is a debate between [Group A] who want [X] and [Group B] who prefer [Y]..."

Your question MUST:
1. Present TWO opposing sides of a controversy
2. Reference specific details from the article
3. Ask students to take a position
4. Be unique to this article's specific debate

Always respond with ONLY the question text. Start with the controversy, not with "This article..."`

    try {
      const question = await generateText(prompt, systemInstruction)
      
      // 질문 정리 (불필요한 텍스트 제거)
      let cleanQuestion = question.trim()
        .replace(/^Question:\s*/i, '')
        .replace(/^Q:\s*/i, '')
        .replace(/^Here's\s+(the\s+)?question:\s*/i, '')
        .replace(/^The\s+question\s+is:\s*/i, '')
        .trim()
      
      // 금지된 시작 패턴 (더 강력하게)
      const forbiddenStarts = [
        /^this\s+article\s+(discusses?|mentions?|talks?\s+about|describes?|reports?)/i,
        /^the\s+article\s+(discusses?|mentions?|talks?\s+about|describes?|reports?)/i,
        /^what\s+do\s+you\s+think\s+about\s+this\s+article/i,
        /^what\s+is\s+your\s+opinion\s+on\s+this/i,
      ]
      
      // 일반적인 표현 패턴 (쟁점이 구체적이지 않음) - 더 강력하게
      const genericPatterns = [
        /there\s+are\s+different\s+perspectives\s+on\s+this\s+topic/i,
        /there\s+are\s+different\s+perspectives/i,
        /people\s+have\s+different\s+opinions/i,
        /there\s+are\s+various\s+viewpoints/i,
        /some\s+people\s+think\s+[^,]+,\s+and\s+there\s+are\s+different\s+perspectives/i,
        /discusses\s+[^,]+,\s+and\s+there\s+are\s+different/i,
        /and\s+there\s+are\s+different\s+perspectives/i,
      ]
      
      const hasForbiddenStart = forbiddenStarts.some(pattern => pattern.test(cleanQuestion))
      const hasGenericPattern = genericPatterns.some(pattern => pattern.test(cleanQuestion))
      
      // 구체적인 쟁점이 있는지 확인 (두 가지 명확한 대립 관점이 있어야 함)
      const hasSpecificControversy = 
        /(?:some|many|experts|critics|supporters|proponents|opponents|administrators|professionals|analysts|economists)\s+(?:argue|claim|say|believe|think|worry|support|oppose|favor|prefer|contend|assert|maintain)/i.test(cleanQuestion) &&
        /(?:while|but|however|whereas|on\s+the\s+other\s+hand|conversely|in\s+contrast)\s+(?:others|some|many|experts|critics|supporters|opponents|proponents)/i.test(cleanQuestion)
      
      // 구체적인 세부사항이 있는지 확인 (숫자, 정책명, 그룹명 등)
      const hasSpecificDetails = 
        /(?:by\s+)?\d+%|\$\d+|\d+\s+(?:million|billion|thousand|percent|people|countries|jobs|dollars)/i.test(cleanQuestion) ||
        /(?:policy|law|plan|proposal|decision|agreement|treaty|regulation|bill)/i.test(cleanQuestion) ||
        /(?:government|experts|critics|supporters|opponents|proponents|administrators|professionals|analysts|economists|businesses|companies)/i.test(cleanQuestion) ||
        /(?:cyber\s+monday|black\s+friday|amazon|apple|walmart|best\s+buy|samsung|airpods|tv|deals|sales|discounts|prices)/i.test(cleanQuestion.toLowerCase())
      
      // 질문이 충분히 구체적인지 확인 (더 엄격하게)
      const isQuestionSpecific = hasSpecificControversy && hasSpecificDetails && cleanQuestion.length > 60
      
      // 추가 검증: "discusses"와 "different perspectives"가 함께 있으면 거부
      const hasDiscussesAndGeneric = /discusses/i.test(cleanQuestion) && /different\s+perspectives/i.test(cleanQuestion)
      
      if (hasForbiddenStart || hasGenericPattern || hasDiscussesAndGeneric || !isQuestionSpecific) {
        console.warn('Generated question is too generic or has forbidden format:', {
          hasForbiddenStart,
          hasGenericPattern,
          hasDiscussesAndGeneric,
          isQuestionSpecific,
          question: cleanQuestion.substring(0, 100)
        })
        throw new Error('Question format not acceptable - too generic or lacks specific controversy')
      }
      
      return NextResponse.json({ question: cleanQuestion })
    } catch (error: any) {
      console.error('Error generating question:', error)
      
      // Fallback: 기사 내용에서 구체적인 쟁점 추출하여 질문 생성 (강화된 버전)
      const extractSpecificControversy = (title: string, content: string): { side1: string; side2: string; detail: string; group1: string; group2: string } | null => {
        const text = (title + ' ' + content).toLowerCase()
        const fullText = title + ' ' + content
        
        // 구체적인 대립 관점 찾기 (더 많은 패턴)
        const patterns = [
          // "some say X, but others argue Y" 패턴
          {
            regex: /(?:some|many|experts?|analysts?)\s+(?:say|argue|claim|believe|think|warn|suggest)\s+that\s+([^,]+?)(?:,\s+but\s+|\s+but\s+|\s+while\s+)(?:others?|some|many|experts?|critics?)\s+(?:argue|claim|say|believe|think|warn|suggest)\s+that\s+([^.!?]+)/i,
            extract: (match: RegExpMatchArray) => ({ 
              side1: match[1].trim(), 
              side2: match[2].trim(),
              group1: 'Some experts',
              group2: 'Others'
            })
          },
          // "supporters say X, critics argue Y" 패턴
          {
            regex: /(?:supporters?|proponents?|advocates?)\s+(?:say|argue|claim|believe)\s+([^,]+?)(?:,\s+but\s+|\s+while\s+|\s+however\s+)(?:critics?|opponents?|skeptics?)\s+(?:argue|claim|say|believe|warn)\s+([^.!?]+)/i,
            extract: (match: RegExpMatchArray) => ({ 
              side1: match[1].trim(), 
              side2: match[2].trim(),
              group1: 'Supporters',
              group2: 'Critics'
            })
          },
          // "benefits vs drawbacks" 패턴
          {
            regex: /(?:benefits?|advantages?|pros)\s+(?:include|are|include:)\s+([^,]+?)(?:,\s+but\s+|\s+while\s+|\s+however\s+)(?:drawbacks?|disadvantages?|cons|concerns?)\s+(?:include|are|include:)\s+([^.!?]+)/i,
            extract: (match: RegExpMatchArray) => ({ 
              side1: `benefits include ${match[1].trim()}`, 
              side2: `drawbacks include ${match[2].trim()}`,
              group1: 'Proponents',
              group2: 'Critics'
            })
          },
          // "companies/retailers vs consumers" 패턴 (Cyber Monday 같은 경우)
          {
            regex: /(?:companies?|retailers?|businesses?|sellers?)\s+(?:say|argue|claim|believe)\s+([^,]+?)(?:,\s+but\s+|\s+while\s+)(?:consumers?|shoppers?|buyers?|customers?)\s+(?:argue|claim|say|worry|concern)\s+([^.!?]+)/i,
            extract: (match: RegExpMatchArray) => ({ 
              side1: match[1].trim(), 
              side2: match[2].trim(),
              group1: 'Retailers',
              group2: 'Consumers'
            })
          }
        ]
        
        for (const pattern of patterns) {
          const match = fullText.match(pattern.regex)
          if (match) {
            const extracted = pattern.extract(match)
            // 구체적인 세부사항 찾기 (숫자, 정책명, 제품명 등)
            const numbers = fullText.match(/\d+%|\$\d+|\d+\s+(?:million|billion|thousand|percent|dollars?)/i)
            const products = fullText.match(/(?:cyber\s+monday|black\s+friday|amazon|apple|walmart|best\s+buy|samsung|airpods|iphone|tv|television|deals|sales|discounts)/i)
            const detail = numbers ? numbers[0] : products ? products[0] : title.split(/\s+/).slice(0, 4).join(' ')
            return { ...extracted, detail }
          }
        }
        
        // 특정 주제에 대한 쟁점 생성 (Cyber Monday 같은 경우)
        if (text.includes('cyber monday') || text.includes('black friday') || text.includes('deals') || text.includes('sales') || text.includes('discount')) {
          const prices = fullText.match(/\$\d+/g)
          const priceDetail = prices ? prices[0] : 'these sales'
          return {
            side1: 'these sales provide great value and savings for consumers',
            side2: 'these sales encourage excessive spending and consumerism',
            detail: priceDetail,
            group1: 'Retailers and supporters',
            group2: 'Consumer advocates'
          }
        }
        
        // 일반적인 주제에 대한 쟁점 생성 (더 구체적으로)
        const mainTopic = title.split(/\s+/).slice(0, 4).join(' ')
        if (text.includes('technology') || text.includes('ai') || text.includes('artificial intelligence')) {
          return {
            side1: 'technology will improve efficiency and create new opportunities',
            side2: 'technology will cause job losses and privacy concerns',
            detail: mainTopic,
            group1: 'Technology advocates',
            group2: 'Critics'
          }
        } else if (text.includes('climate') || text.includes('environment') || text.includes('emission')) {
          return {
            side1: 'environmental policies will protect the planet for future generations',
            side2: 'environmental policies will hurt economic growth and jobs',
            detail: mainTopic,
            group1: 'Environmental advocates',
            group2: 'Economic analysts'
          }
        } else if (text.includes('education') || text.includes('school') || text.includes('student')) {
          return {
            side1: 'education reforms will improve learning outcomes',
            side2: 'education reforms will increase costs and reduce quality',
            detail: mainTopic,
            group1: 'Education reformers',
            group2: 'Critics'
          }
        }
        
        return null
      }
      
      const controversy = extractSpecificControversy(title, content)
      
      if (controversy) {
        // 구체적인 쟁점이 발견된 경우
        const fallbackQuestions: Record<string, string> = {
          beginner: `${controversy.group1} think ${controversy.side1}, but ${controversy.group2} believe ${controversy.side2}. What do you think? Write your opinion in simple English.`,
          intermediate: `There is a debate about ${controversy.detail}. ${controversy.group1} argue ${controversy.side1}, while ${controversy.group2} claim ${controversy.side2}. What is your position on this controversy? Please explain your reasoning.`,
          advanced: `The issue of ${controversy.detail} has divided opinion. ${controversy.group1} argue ${controversy.side1}, whereas ${controversy.group2} contend ${controversy.side2}. Critically evaluate both perspectives and discuss which position you support and why.`,
        }
        
        return NextResponse.json({ 
          question: fallbackQuestions[level] || fallbackQuestions['intermediate']
        })
      } else {
        // 구체적인 쟁점을 찾지 못한 경우 - 주제 기반으로 쟁점 생성
        const mainTopic = title.split(/\s+/).slice(0, 4).join(' ')
        const fallbackQuestions: Record<string, string> = {
          beginner: `Some people think ${mainTopic} is good, but others think it is bad. What do you think? Write your opinion in simple English.`,
          intermediate: `${mainTopic} has both benefits and drawbacks. Supporters say it helps people, while critics argue it causes problems. What is your position on this issue? Please provide your analysis.`,
          advanced: `${mainTopic} presents a complex issue with multiple perspectives. Proponents argue it provides significant benefits, whereas opponents contend it creates substantial challenges. Analyze both viewpoints and discuss which position you find more compelling and why.`,
        }
        
        return NextResponse.json({ 
          question: fallbackQuestions[level] || fallbackQuestions['intermediate']
        })
      }
    }
  } catch (error) {
    console.error('Error in generate-question API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

