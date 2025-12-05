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
    
    // 기사 내용을 분석하여 쟁점 기반 질문 생성
    const prompt = `You are an English language teacher. Your task is to ANALYZE this news article, identify the KEY DEBATABLE ISSUES or CONTROVERSIAL POINTS, and create a question that asks students to engage with these specific issues.

${levelInstructions}

=== ARTICLE INFORMATION ===
Title: ${title}

Key Topics/Keywords: ${keyTopics.join(', ')}

Key Content Excerpt:
${keySentences}

Full Article Content:
${articleContent}

=== YOUR TASK ===
1. **ANALYZE the article** to identify:
   - What are the main debatable issues or controversial points?
   - What are the different perspectives or viewpoints mentioned?
   - What are the potential benefits and drawbacks?
   - What are the implications or consequences?
   - What are the ethical, social, economic, or political concerns?

2. **CREATE a question** that:
   - Focuses on a SPECIFIC DEBATABLE ISSUE from the article (not just a summary)
   - Asks students to take a position or analyze different perspectives
   - References specific details, policies, events, or arguments from the article
   - Encourages critical thinking about the controversy or debate
   - Uses vocabulary and sentence complexity matching ${level} level
   - Requires a written response appropriate for ${level} level (see word count above)

=== EXAMPLES OF GOOD ISSUE-BASED QUESTIONS ===

Example 1 - Climate Policy Article:
"The article states that countries agreed to reduce emissions by 50% by 2030, but some experts argue this will hurt economic growth. What are the potential benefits and drawbacks of this policy? Do you think the environmental benefits outweigh the economic costs?"

Example 2 - Technology Article:
"The article discusses AI replacing human workers in healthcare. Some people support this for efficiency, while others worry about job losses. What is your opinion on this debate? Should AI replace human workers, or should it only assist them?"

Example 3 - Political Article:
"The article describes a new immigration policy that has divided public opinion. Supporters say it will strengthen the economy, while critics argue it will harm social cohesion. What are your thoughts on this controversy? Which perspective do you agree with and why?"

Example 4 - Social Issue Article:
"The article reports that some schools are banning smartphones, with supporters citing improved focus and critics pointing to communication needs. What is your position on this debate? Should schools ban smartphones?"

=== EXAMPLES OF BAD QUESTIONS (TOO GENERIC) ===
- "What do you think about this article?" (doesn't identify a specific issue)
- "What is your opinion on this topic?" (too vague, no controversy identified)
- "Do you agree or disagree with the article?" (doesn't engage with specific debate points)
- "Summarize the main points of this article." (not a debate question)

=== CRITICAL REQUIREMENTS ===
- Your question MUST identify and focus on a SPECIFIC DEBATABLE ISSUE from the article
- Your question MUST present different perspectives or sides of the debate
- Your question MUST ask students to take a position or analyze the controversy
- Your question MUST reference specific details from the article (policies, numbers, events, arguments)
- Your question MUST be unique to this article's specific controversy, not a generic question
- Return ONLY the question text, no additional explanation or formatting
- The question should make it clear that the student has read and understood the article's key debate points`

    const systemInstruction = `You are an English language teacher creating writing prompts for students.

CRITICAL INSTRUCTIONS:
1. ANALYZE the article to identify DEBATABLE ISSUES, CONTROVERSIES, or CONFLICTING PERSPECTIVES
2. Create a question that focuses on a SPECIFIC DEBATABLE ISSUE from the article
3. The question MUST present different sides or perspectives of the debate
4. The question MUST ask students to take a position or analyze the controversy
5. Reference specific details, policies, events, or arguments from the article
6. NOT generic - each question should be unique to the article's specific controversy

Your questions MUST:
- Identify a specific debatable issue or controversy from the article
- Present different perspectives or viewpoints
- Ask students to engage with the debate, not just summarize
- Reference specific content from the article

BAD examples (DO NOT CREATE):
- "What do you think about this article?" (too generic, no issue identified)
- "What is your opinion?" (no specific controversy)
- "Do you agree or disagree?" (doesn't engage with debate points)

GOOD examples:
- Questions that identify a controversy and ask students to take a position
- Questions that present different perspectives and ask for analysis
- Questions that reference specific policies, events, or arguments from the article

Always respond with a clear, direct question only. Focus on DEBATABLE ISSUES, not just article content.`

    try {
      const question = await generateText(prompt, systemInstruction)
      
      // 질문 정리 (불필요한 텍스트 제거)
      const cleanQuestion = question.trim().replace(/^Question:\s*/i, '').replace(/^Q:\s*/i, '').trim()
      
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

