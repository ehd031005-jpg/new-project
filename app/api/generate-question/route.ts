import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { title, content, level } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
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
    
    // 기사 내용을 더 많이 사용 (5000자)
    const articleContent = content.substring(0, 5000)
    
    // 기사에서 핵심 키워드와 주제 추출 (간단한 추출)
    const extractKeyTopics = (text: string): string[] => {
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 4)
      
      const wordCount: Record<string, number> = {}
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1
      })
      
      return Object.entries(wordCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word)
    }
    
    const keyTopics = extractKeyTopics(title + ' ' + articleContent)
    
    // 기사 내용의 핵심 문장 추출 (첫 3-5 문장)
    const extractKeySentences = (text: string): string => {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20)
      return sentences.slice(0, 5).join('. ').trim()
    }
    
    const keySentences = extractKeySentences(articleContent)
    
    // 기사 내용을 분석하여 쟁점 기반 질문 생성 (강화된 버전)
    const prompt = `You are an English language teacher. Your CRITICAL task is to ANALYZE this news article, identify a SPECIFIC CONTROVERSIAL ISSUE or DEBATE, and create a question that forces students to engage with the CONFLICT or DISAGREEMENT in the article.

${levelInstructions}

=== ARTICLE INFORMATION ===
Title: ${title}

Key Topics/Keywords: ${keyTopics.join(', ')}

Key Content Excerpt:
${keySentences}

Full Article Content:
${articleContent}

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
      
      // "This article discusses..." 같은 금지된 시작 패턴 제거 및 재생성
      const forbiddenStarts = [
        /^this\s+article\s+(discusses?|mentions?|talks?\s+about|describes?|reports?)/i,
        /^the\s+article\s+(discusses?|mentions?|talks?\s+about|describes?|reports?)/i,
        /^what\s+do\s+you\s+think\s+about\s+this\s+article/i,
        /^what\s+is\s+your\s+opinion\s+on\s+this/i,
      ]
      
      const hasForbiddenStart = forbiddenStarts.some(pattern => pattern.test(cleanQuestion))
      
      if (hasForbiddenStart) {
        console.warn('Generated question has forbidden format, attempting to fix...')
        // 금지된 시작을 제거하고 재구성 시도
        cleanQuestion = cleanQuestion
          .replace(/^(this\s+article|the\s+article)\s+(discusses?|mentions?|talks?\s+about|describes?|reports?)\s+/i, '')
          .replace(/^what\s+do\s+you\s+think\s+about\s+this\s+article[.,]?\s*/i, '')
          .replace(/^what\s+is\s+your\s+opinion\s+on\s+this[.,]?\s*/i, '')
          .trim()
        
        // 여전히 문제가 있으면 fallback 사용
        if (cleanQuestion.length < 30 || forbiddenStarts.some(p => p.test(cleanQuestion))) {
          throw new Error('Question format not acceptable, using fallback')
        }
      }
      
      return NextResponse.json({ question: cleanQuestion })
    } catch (error: any) {
      console.error('Error generating question:', error)
      
      // Fallback: 기사 내용에서 쟁점 추출하여 질문 생성
      const extractDebatableIssue = (title: string, content: string): { topic: string; issue: string } => {
        // 제목과 내용에서 논쟁적 키워드 찾기
        const debateKeywords = ['debate', 'controversy', 'disagreement', 'conflict', 'opposition', 'critics', 'supporters', 'pros and cons', 'benefits and drawbacks', 'challenges', 'concerns', 'opposing views']
        const text = (title + ' ' + content).toLowerCase()
        
        // 논쟁적 키워드가 있는지 확인
        const hasDebate = debateKeywords.some(keyword => text.includes(keyword))
        
        // 제목에서 주요 명사 추출
        const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
        const mainTopic = titleWords[0] || 'this topic'
        
        // 내용에서 잠재적 쟁점 찾기 (예: "some say", "others argue", "critics", "supporters")
        let issue = ''
        if (text.includes('some say') || text.includes('others argue')) {
          issue = 'different opinions'
        } else if (text.includes('critics') || text.includes('opponents')) {
          issue = 'opposing viewpoints'
        } else if (text.includes('benefits') && text.includes('drawbacks')) {
          issue = 'benefits and drawbacks'
        } else if (text.includes('challenges') || text.includes('concerns')) {
          issue = 'challenges and concerns'
        } else {
          issue = 'different perspectives'
        }
        
        return { topic: mainTopic, issue }
      }
      
      const { topic, issue } = extractDebatableIssue(title, content)
      
      const fallbackQuestions: Record<string, string> = {
        beginner: `The article talks about ${topic}. Some people have different opinions about this. What do you think? Write your opinion in simple English.`,
        intermediate: `The article discusses ${topic}, and there are ${issue} on this topic. What is your position on this debate? Please provide your analysis and explain your reasoning.`,
        advanced: `The article analyzes ${topic}, presenting ${issue}. Critically evaluate the different perspectives and discuss which position you support and why.`,
      }
      
      return NextResponse.json({ 
        question: fallbackQuestions[level] || fallbackQuestions['intermediate']
      })
    }
  } catch (error) {
    console.error('Error in generate-question API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

