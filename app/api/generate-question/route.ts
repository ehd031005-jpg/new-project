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
    
    // 기사 내용을 기반으로 질문 생성
    const prompt = `You are an English language teacher. Based on this news article, create a thought-provoking question that encourages ${level}-level students to express their opinion or analysis in writing.

${levelInstructions}

Article Title: ${title}
Article Content: ${content.substring(0, 2000)}

Create a question that:
1. Is directly related to the article's main topic or theme
2. Encourages critical thinking and personal opinion (appropriate for ${level} level)
3. Uses vocabulary and sentence complexity matching ${level} level
4. Requires a written response appropriate for ${level} level (see word count above)
5. Is open-ended and allows for various perspectives

Return ONLY the question text, no additional explanation or formatting.`

    const systemInstruction = 'You are an English language teacher creating writing prompts for students. Always respond with a clear, direct question only.'

    try {
      const question = await generateText(prompt, systemInstruction)
      
      // 질문 정리 (불필요한 텍스트 제거)
      const cleanQuestion = question.trim().replace(/^Question:\s*/i, '').replace(/^Q:\s*/i, '').trim()
      
      return NextResponse.json({ question: cleanQuestion })
    } catch (error: any) {
      console.error('Error generating question:', error)
      
      // Fallback: 기본 질문 생성
      const fallbackQuestions: Record<string, string> = {
        beginner: `What do you think about this news? Write your opinion in simple English.`,
        intermediate: `What is your opinion on this article? Please provide your analysis and thoughts.`,
        advanced: `Analyze this article and provide your critical perspective on the topic. Discuss the implications and your viewpoint.`,
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

