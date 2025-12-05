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
    
    // 기사 내용을 기반으로 질문 생성 (강화된 프롬프트)
    const prompt = `You are an English language teacher. Based on this specific news article, create a thought-provoking question that is DIRECTLY related to the article's content, main arguments, and specific details.

${levelInstructions}

=== ARTICLE INFORMATION ===
Title: ${title}

Key Topics/Keywords: ${keyTopics.join(', ')}

Key Content Excerpt:
${keySentences}

Full Article Content:
${articleContent}

=== YOUR TASK ===
Create a question that:
1. **MUST reference specific details, events, or arguments from the article** (e.g., "What do you think about [specific event/policy/issue mentioned in the article]?")
2. **MUST be directly related to the article's main topic** - NOT a generic question
3. **MUST encourage students to engage with the article's specific content** - ask about the article's implications, the events described, or the arguments presented
4. Uses vocabulary and sentence complexity matching ${level} level
5. Requires a written response appropriate for ${level} level (see word count above)
6. Is open-ended and allows for various perspectives

=== EXAMPLES OF GOOD QUESTIONS ===
- If the article is about climate change: "The article mentions that countries agreed to reduce emissions by 50% by 2030. Do you think this goal is achievable? What challenges might countries face?"
- If the article is about technology: "The article discusses AI's impact on healthcare. How do you think AI will change the way doctors work in the future?"
- If the article is about politics: "The article describes a new policy. What are the potential benefits and drawbacks of this policy?"

=== EXAMPLES OF BAD QUESTIONS (TOO GENERIC) ===
- "What do you think about this article?" (too generic)
- "What is your opinion?" (not article-specific)
- "Do you agree or disagree?" (not engaging with article content)

=== IMPORTANT ===
- Your question MUST reference specific content from the article
- Your question MUST be unique to this article, not a generic writing prompt
- Return ONLY the question text, no additional explanation or formatting
- The question should make it clear that the student has read and understood the article`

    const systemInstruction = `You are an English language teacher creating writing prompts for students. 
Your questions MUST be:
1. Directly related to the SPECIFIC article content provided
2. Reference specific details, events, or arguments from the article
3. NOT generic - each question should be unique to the article
4. Encourage critical thinking about the article's specific content

Always respond with a clear, direct question only. Do NOT use generic phrases like "What do you think about this article?" Instead, reference specific content from the article.`

    try {
      const question = await generateText(prompt, systemInstruction)
      
      // 질문 정리 (불필요한 텍스트 제거)
      const cleanQuestion = question.trim().replace(/^Question:\s*/i, '').replace(/^Q:\s*/i, '').trim()
      
      return NextResponse.json({ question: cleanQuestion })
    } catch (error: any) {
      console.error('Error generating question:', error)
      
      // Fallback: 기사 내용 기반 기본 질문 생성
      const extractMainTopic = (title: string, content: string): string => {
        // 제목에서 주요 명사 추출
        const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 4)
        const mainTopic = titleWords[0] || 'this topic'
        return mainTopic
      }
      
      const mainTopic = extractMainTopic(title, content)
      
      const fallbackQuestions: Record<string, string> = {
        beginner: `The article talks about ${mainTopic}. What do you think about this? Write your opinion in simple English.`,
        intermediate: `The article discusses ${mainTopic}. What is your opinion on this topic? Please provide your analysis and thoughts.`,
        advanced: `The article analyzes ${mainTopic}. Critically evaluate the arguments presented and discuss the broader implications of this topic.`,
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
