import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getAvailableGeminiModel } from './get-available-model'

// API 키 확인 및 초기화
const openaiApiKey = process.env.OPENAI_API_KEY
const googleApiKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY

const openai = openaiApiKey
  ? new OpenAI({
      apiKey: openaiApiKey,
    })
  : null

const genAI = googleApiKey ? new GoogleGenerativeAI(googleApiKey) : null

// 사용할 API 결정 (Google AI 우선, 없으면 OpenAI)
const useGoogleAI = !!googleApiKey
const useOpenAI = !!openaiApiKey && !googleApiKey

// Google AI로 텍스트 생성
async function generateWithGoogleAI(prompt: string, systemInstruction?: string) {
  if (!genAI) throw new Error('Google AI API key not configured')
  
  // 환경 변수로 지정된 모델이 있으면 사용, 없으면 gemini-2.5-pro 사용
  let modelName = process.env.GEMINI_MODEL || 'models/gemini-2.5-pro'
  
  // 모델 이름에서 'models/' 접두사 제거 (있는 경우)
  const cleanModelName = modelName.replace(/^models\//, '')
  
  try {
    const model = genAI.getGenerativeModel({ 
      model: cleanModelName,
    })
    
    // systemInstruction이 있으면 프롬프트에 포함
    const fullPrompt = systemInstruction 
      ? `${systemInstruction}\n\n${prompt}`
      : prompt
    
    const result = await model.generateContent(fullPrompt)
    const response = await result.response
    return response.text()
  } catch (error: any) {
    // 모델이 없으면 다른 모델 시도
    if (error.message?.includes('404') || error.message?.includes('not found')) {
      console.warn(`Model ${cleanModelName} not found, trying alternative models...`)
      
      // 대체 모델 시도
      const alternatives = ['gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
      for (const alt of alternatives) {
        if (alt === cleanModelName) continue
        try {
          const model = genAI.getGenerativeModel({ 
            model: alt,
          })
          const fullPrompt = systemInstruction 
            ? `${systemInstruction}\n\n${prompt}`
            : prompt
          const result = await model.generateContent(fullPrompt)
          const response = await result.response
          return response.text()
        } catch (e) {
          continue
        }
      }
    }
    throw error
  }
}

// OpenAI로 텍스트 생성
async function generateWithOpenAI(prompt: string, systemInstruction?: string) {
  if (!openai) throw new Error('OpenAI API key not configured')
  
  const messages: any[] = []
  if (systemInstruction) {
    messages.push({
      role: 'system',
      content: systemInstruction,
    })
  }
  messages.push({
    role: 'user',
    content: prompt,
  })
  
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.7,
  })
  
  return response.choices[0].message.content || ''
}

// 통합 텍스트 생성 함수
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  if (useGoogleAI) {
    return await generateWithGoogleAI(prompt, systemInstruction)
  } else if (useOpenAI) {
    return await generateWithOpenAI(prompt, systemInstruction)
  } else {
    throw new Error('No AI API key configured')
  }
}

/**
 * AI 응답에서 JSON을 추출합니다 (마크다운 코드 블록 처리)
 */
function extractJsonFromResponse(text: string): any {
  // 마크다운 코드 블록에서 JSON 추출
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || text.match(/(\{[\s\S]*\})/)
  
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1])
    } catch (e) {
      console.warn('Failed to parse JSON from code block, trying direct parse...')
    }
  }
  
  // 직접 JSON 파싱 시도
  try {
    return JSON.parse(text)
  } catch (e) {
    // JSON 객체를 찾기 위한 더 넓은 패턴
    const objectMatch = text.match(/\{[\s\S]*\}/)
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0])
      } catch (e2) {
        console.error('Failed to extract JSON from response:', e2)
        throw e2
      }
    }
    throw e
  }
}

export async function generateNewsSummary(
  title: string,
  content: string,
  level: 'beginner' | 'intermediate' | 'advanced'
): Promise<{
  summary: string
  keywords: string[]
  grammarPoints: string[]
}> {
  if (!useGoogleAI && !useOpenAI) {
    // Fallback to sample data if API key is not set
    return {
      summary: content.substring(0, 200) + '...',
      keywords: ['sample', 'keywords'],
      grammarPoints: ['Sample grammar point'],
    }
  }

  try {
    // 난이도별 상세한 지시사항
    let levelInstructions = ''
    let summaryGuidelines = ''
    let keywordGuidelines = ''
    let grammarGuidelines = ''
    
    if (level === 'beginner') {
      levelInstructions = `BEGINNER LEVEL (A1-A2) - STRICT REQUIREMENTS:
- Use ONLY simple, everyday vocabulary (e.g., "important", "people", "help", "good", "bad", "big", "small")
- Use VERY short sentences (8-12 words maximum)
- Use ONLY basic grammar: present tense, simple past tense, basic questions
- NO complex sentences, NO relative clauses, NO passive voice
- Use simple connecting words: "and", "but", "because", "so"
- Avoid: technical terms, academic vocabulary, complex structures`
      summaryGuidelines = `Write a VERY SIMPLE summary in 3-4 VERY SHORT sentences (8-12 words each) using ONLY basic vocabulary (A1-A2 level). 
- Use ONLY present tense and simple past tense
- Use simple words like "important", "people", "help", "change"
- NO complex grammar structures
- Make it easy for beginners to understand`
      keywordGuidelines = `Extract 5 VERY SIMPLE, common vocabulary words that beginners MUST learn (e.g., "important", "change", "people", "country", "help", "good", "bad", "big", "small", "new", "old").
- AVOID: technical terms, academic vocabulary, complex words
- Focus on words beginners see every day
- Words should be 4-8 letters, easy to pronounce`
      grammarGuidelines = `Identify 3 VERY BASIC grammar points suitable for absolute beginners:
- "Simple present tense" (I am, You are, He/She is)
- "Basic past tense" (I was, You were, He/She went)
- "Simple questions" (What is...?, Who are...?, Where is...?)
- "Basic prepositions" (in, on, at, with, for)
- NO complex grammar structures`
    } else if (level === 'intermediate') {
      levelInstructions = `INTERMEDIATE LEVEL (B1-B2) - CLEAR REQUIREMENTS:
- Use varied vocabulary including SOME academic and formal terms (e.g., "significant", "strategy", "impact", "develop", "analyze")
- Use medium-length sentences (15-25 words)
- Include SOME complex grammar structures (present perfect, passive voice, conditionals)
- Use connecting words: "however", "therefore", "furthermore", "although"
- Balance between simple and complex structures`
      summaryGuidelines = `Write a DETAILED summary in 5-6 sentences (15-25 words each) using intermediate vocabulary (B1-B2 level).
- Use various tenses: present, past, present perfect, future
- Include some complex sentence structures (relative clauses, conditionals)
- Use academic vocabulary appropriately
- Provide more detail than beginner level`
      keywordGuidelines = `Extract 5 intermediate-level vocabulary words including SOME academic or formal terms (e.g., "significant", "implement", "analysis", "strategy", "impact", "develop", "establish", "emphasize").
- Mix common words with academic vocabulary
- Include words that expand learners' vocabulary beyond basics
- Words should help learners progress to advanced level`
      grammarGuidelines = `Identify 3 intermediate grammar points:
- "Present perfect tense" (I have done, They have been)
- "Passive voice" (It was done, They are being helped)
- "Conditional sentences" (If I were, I would do)
- "Relative clauses" (The person who..., The thing that...)
- "Reported speech" (He said that...)`
    } else { // advanced
      levelInstructions = `ADVANCED LEVEL (C1-C2) - SOPHISTICATED REQUIREMENTS:
- Use sophisticated, academic, and nuanced vocabulary (e.g., "substantiate", "paradigm", "facilitate", "comprehensive", "nuanced", "elucidate", "pervasive")
- Use complex, varied sentence structures (20-35 words)
- Include advanced grammar patterns (subjunctive, inverted conditionals, cleft sentences)
- Use sophisticated connecting words: "furthermore", "consequently", "notwithstanding", "albeit"
- Demonstrate high-level English proficiency`
      summaryGuidelines = `Write a COMPREHENSIVE summary in 7-8 sentences (20-35 words each) using advanced vocabulary (C1-C2 level).
- Use sophisticated sentence structures with varied tenses and complex grammatical patterns
- Include nominalizations, advanced passive constructions, and complex noun phrases
- Use academic and formal vocabulary throughout
- Provide in-depth analysis and nuanced understanding`
      keywordGuidelines = `Extract 5 ADVANCED vocabulary words including academic, formal, and nuanced terms (e.g., "substantiate", "paradigm", "facilitate", "comprehensive", "nuanced", "elucidate", "pervasive", "concomitant").
- Focus on words that demonstrate high-level English proficiency
- Include sophisticated terms that show mastery of English
- Words should challenge even advanced learners`
      grammarGuidelines = `Identify 3 ADVANCED grammar points:
- "Subjunctive mood" (If I were to..., It is essential that he be...)
- "Inverted conditionals" (Had I known..., Were it not for...)
- "Cleft sentences" (It is... that..., What... is...)
- "Advanced passive constructions" (It has been suggested that...)
- "Complex noun phrases" (The rapidly increasing number of...)`
    }
    
    const prompt = `${levelInstructions}

Summarize this news article for a ${level} English learner.

Article Title: ${title}
Article Content: ${content.substring(0, 3000)}

${summaryGuidelines}

${keywordGuidelines}

${grammarGuidelines}

Provide a JSON response with this exact structure:
{
  "summary": "Your summary here following the guidelines above",
  "keywords": ["word1", "word2", "word3", "word4", "word5"],
  "grammarPoints": ["grammar point 1", "grammar point 2", "grammar point 3"]
}

Return ONLY valid JSON, no additional text.`

    const systemInstruction = `You are an English language teacher specializing in ${level}-level instruction. Your task is to adapt content to match the learner's proficiency level exactly. Always respond with valid JSON only, no markdown, no explanations.`

    const responseText = await generateText(prompt, systemInstruction)
    console.log('AI Response for news summary:', responseText.substring(0, 200))
    
    const result = extractJsonFromResponse(responseText)
    
    // 결과 검증 및 기본값 설정
    const keywords = Array.isArray(result.keywords) && result.keywords.length > 0 
      ? result.keywords.filter((k: any) => typeof k === 'string' && k.trim().length > 0)
      : []
    
    const grammarPoints = Array.isArray(result.grammarPoints) && result.grammarPoints.length > 0
      ? result.grammarPoints.filter((g: any) => typeof g === 'string' && g.trim().length > 0)
      : []
    
    // keywords나 grammarPoints가 비어있으면 난이도별 기본값 생성
    if (keywords.length === 0) {
      // 기사에서 자주 나오는 단어 추출 (난이도별 필터링)
      const words = content.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
      const wordFreq: Record<string, number> = {}
      words.forEach((word: string) => {
        wordFreq[word] = (wordFreq[word] || 0) + 1
      })
      const extractedWords = Object.entries(wordFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([word]) => word)
      
      // 난이도별 기본 키워드 추가
      if (level === 'beginner') {
        keywords.push(...['important', 'people', 'country', 'change', 'help'].slice(0, 5))
      } else if (level === 'intermediate') {
        keywords.push(...['significant', 'analysis', 'strategy', 'impact', 'develop'].slice(0, 5))
      } else {
        keywords.push(...['substantiate', 'comprehensive', 'facilitate', 'paradigm', 'nuanced'].slice(0, 5))
      }
    }
    
    if (grammarPoints.length === 0) {
      // 난이도별 기본 문법 포인트
      if (level === 'beginner') {
        grammarPoints.push('Simple present tense', 'Basic past tense', 'Simple questions')
      } else if (level === 'intermediate') {
        grammarPoints.push('Present perfect tense', 'Passive voice', 'Conditional sentences')
      } else {
        grammarPoints.push('Subjunctive mood', 'Inverted conditionals', 'Complex noun phrases')
      }
    }
    
    return {
      summary: result.summary || content.substring(0, 200) + '...',
      keywords: keywords.slice(0, 5), // 최대 5개
      grammarPoints: grammarPoints.slice(0, 3), // 최대 3개
    }
  } catch (error: any) {
    console.error('Error generating news summary:', error)
    console.error('Error details:', error.message)
    
    // Fallback: 난이도별 기본값
    let fallbackKeywords: string[]
    let fallbackGrammarPoints: string[]
    
    if (level === 'beginner') {
      fallbackKeywords = ['important', 'people', 'country', 'change', 'help']
      fallbackGrammarPoints = ['Simple present tense', 'Basic past tense', 'Simple questions']
    } else if (level === 'intermediate') {
      fallbackKeywords = ['significant', 'analysis', 'strategy', 'impact', 'develop']
      fallbackGrammarPoints = ['Present perfect tense', 'Passive voice', 'Conditional sentences']
    } else {
      fallbackKeywords = ['substantiate', 'comprehensive', 'facilitate', 'paradigm', 'nuanced']
      fallbackGrammarPoints = ['Subjunctive mood', 'Inverted conditionals', 'Complex noun phrases']
    }
    
    return {
      summary: content.substring(0, 200) + '...',
      keywords: fallbackKeywords,
      grammarPoints: fallbackGrammarPoints,
    }
  }
}

export async function getWritingFeedback(
  text: string,
  articleId?: string,
  articleTitle?: string,
  articleContent?: string,
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate',
  question?: string
): Promise<{
  grammar: { score: number; comments: string[] }
  vocabulary: { score: number; comments: string[] }
  structure: { score: number; comments: string[] }
  suggestions: string[]
  improved: string
}> {
  if (!useGoogleAI && !useOpenAI) {
    // Fallback to heuristic feedback when API key is not available
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const longSentences = sentences.filter((sentence) => sentence.split(/\s+/).length > 25)
    const passiveVoiceMatches = text.match(/\b(is|are|was|were|been|being)\s+\w+ed\b/gi) || []

    const grammarComments = [
      longSentences.length > 0
        ? '긴 문장이 많습니다. 문장을 나누어 가독성을 높여보세요.'
        : '문장 길이가 적절해 읽기 좋습니다.',
      passiveVoiceMatches.length > 0
        ? '수동태 표현이 자주 사용되었습니다. 능동태도 함께 활용해보세요.'
        : '문장 구조가 비교적 자연스럽습니다.',
      wordCount < 80
        ? '글 길이가 다소 짧습니다. 근거를 조금 더 추가해보세요.'
        : '충분한 분량으로 의견을 잘 전개했습니다.',
    ]

    const vocabularyComments = [
      text.match(/\b(very|really|good|bad|nice)\b/i)
        ? '단순한 형용사 대신 더 구체적인 단어를 사용해보세요.'
        : '어휘 선택이 비교적 안정적입니다.',
      text.includes('I think')
        ? '"I think" 대신 "I believe", "In my view" 같은 표현으로 다양성을 주세요.'
        : '의견 표현이 적절하게 사용되었습니다.',
      text.match(/\b(important|interesting|problem)\b/i)
        ? '"critical", "noteworthy", "challenge"와 같은 동의어를 고려해보세요.'
        : '어휘 선택이 다양합니다.',
    ]

    const structureComments = [
      sentences.length >= 3
        ? '도입과 본문, 결론 구조를 더욱 명확히 구분해보세요.'
        : '단락이 부족합니다. 최소 세 문단으로 구성해보세요.',
      text.includes('because') || text.includes('therefore')
        ? '근거와 결과를 연결하는 표현이 잘 사용되었습니다.'
        : '논리를 설명하는 연결어를 추가하면 더 설득력 있어집니다.',
      text.trim().endsWith('.')
        ? '마무리 문장이 명확합니다.'
        : '글을 완성된 문장으로 마무리해보세요.',
    ]

    const suggestions = [
      text.includes('I think')
        ? 'I think → I believe / From my perspective'
        : '문장 간 연결을 위해 "Furthermore", "Moreover" 같은 표현을 사용해보세요.',
      longSentences.length > 0
        ? '긴 문장은 둘 이상의 문장으로 나누어 가독성을 높이세요.'
        : '핵심 근거를 뒷받침할 구체적인 사례를 추가해보세요.',
      passiveVoiceMatches.length > 0
        ? '수동태 대신 능동태 표현을 사용하면 글이 더 생동감 있어집니다.'
        : '감정이나 의견을 강조하고 싶다면 형용사나 부사를 활용하세요.',
    ]

    return {
      grammar: {
        score: Math.max(60, 100 - longSentences.length * 5 - passiveVoiceMatches.length * 3),
        comments: grammarComments,
      },
      vocabulary: {
        score: 80,
        comments: vocabularyComments,
      },
      structure: {
        score: Math.min(85, 60 + sentences.length * 5),
        comments: structureComments,
      },
      suggestions,
      improved: generateImprovedDraft(text),
    }
  }

  try {
    // 난이도별 피드백 지시사항
    let levelGuidance = ''
    if (level === 'beginner') {
      levelGuidance = 'BEGINNER LEVEL: Focus on basic grammar, simple vocabulary, and clear sentence structure. Be encouraging and provide simple explanations.'
    } else if (level === 'intermediate') {
      levelGuidance = 'INTERMEDIATE LEVEL: Evaluate grammar accuracy, vocabulary variety, and logical structure. Provide constructive feedback for improvement.'
    } else {
      levelGuidance = 'ADVANCED LEVEL: Assess sophisticated grammar usage, nuanced vocabulary, and complex sentence structures. Provide detailed, professional feedback.'
    }

    // 기사 정보와 질문이 있으면 참고하도록 추가
    let articleContext = ''
    if (articleTitle && articleContent) {
      articleContext = `\n\nThis writing is a response to the following news article:\nTitle: ${articleTitle}\nContent: ${articleContent.substring(0, 500)}`
      if (question) {
        articleContext += `\n\nQuestion: ${question}\n\nEvaluate how well the writing answers the question and addresses the article's content and themes.`
      } else {
        articleContext += `\n\nEvaluate how well the writing addresses the article's content and themes.`
      }
    } else if (question) {
      articleContext = `\n\nQuestion: ${question}\n\nEvaluate how well the writing answers this question.`
    }

    const prompt = `Provide detailed feedback on this ${level}-level English writing. ${levelGuidance}

${text}${articleContext}

Provide feedback on:
1. Grammar (score 0-100 and 3 comments) - Evaluate grammar accuracy and complexity appropriate for ${level} level
2. Vocabulary (score 0-100 and 3 comments) - Evaluate vocabulary choice and variety appropriate for ${level} level
3. Structure (score 0-100 and 3 comments) - Evaluate logical structure and organization
4. 3 specific improvement suggestions (format: "original → improved")
5. An improved version of the text

Return as JSON with this exact structure:
{
  "grammar": {"score": number, "comments": [string, string, string]},
  "vocabulary": {"score": number, "comments": [string, string, string]},
  "structure": {"score": number, "comments": [string, string, string]},
  "suggestions": [string, string, string],
  "improved": string
}`

    const systemInstruction = `You are an English writing tutor specializing in ${level}-level instruction. Provide constructive, level-appropriate feedback. Always respond with valid JSON only, no additional text.`

    const responseText = await generateText(prompt, systemInstruction)
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
    }
    
    const result = JSON.parse(jsonText)
    
    return {
      grammar: result.grammar || { score: 75, comments: ['No feedback available'] },
      vocabulary: result.vocabulary || { score: 80, comments: ['No feedback available'] },
      structure: result.structure || { score: 70, comments: ['No feedback available'] },
      suggestions: result.suggestions || [],
      improved: result.improved || text,
    }
  } catch (error) {
    console.error('Error getting writing feedback:', error)
    return {
      grammar: { score: 75, comments: ['Error processing'] },
      vocabulary: { score: 80, comments: ['Error processing'] },
      structure: { score: 70, comments: ['Error processing'] },
      suggestions: [],
      improved: text,
    }
  }
}

function generateImprovedDraft(text: string): string {
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bvery good\b/gi, replacement: 'excellent' },
    { pattern: /\bvery important\b/gi, replacement: 'crucial' },
    { pattern: /\bI think\b/gi, replacement: 'I believe' },
    { pattern: /\bpeople\b/gi, replacement: 'individuals' },
    { pattern: /\bthings\b/gi, replacement: 'aspects' },
  ]

  let improved = text
  replacements.forEach(({ pattern, replacement }) => {
    improved = improved.replace(pattern, replacement)
  })

  if (!improved.endsWith('.')) {
    improved = `${improved.trim()}.`
  }

  return improved
}

export async function rephraseText(
  text: string
): Promise<{
  beginner: string
  intermediate: string
  advanced: string
}> {
  if (!useGoogleAI && !useOpenAI) {
    return {
      beginner: text,
      intermediate: text,
      advanced: text,
    }
  }

  try {
    const prompt = `Rewrite this text in three DIFFERENT English proficiency levels. Each level must be DISTINCTLY different in vocabulary, sentence structure, and complexity.

Original Text: ${text}

CRITICAL REQUIREMENTS:
1. BEGINNER (A1-A2): 
   - Use ONLY simple, everyday vocabulary (e.g., "important", "people", "help", "good", "bad", "big", "small")
   - Use VERY short sentences (8-12 words maximum)
   - Use ONLY basic grammar: present tense, simple past tense, basic questions
   - NO complex sentences, NO relative clauses, NO passive voice
   - Use simple connecting words: "and", "but", "because", "so"
   - Make it easy for beginners to understand
   - Example transformation: "The government implemented a comprehensive strategy" → "The government made a plan"

2. INTERMEDIATE (B1-B2):
   - Use varied vocabulary including SOME academic terms (e.g., "significant", "strategy", "impact", "develop", "analyze")
   - Use medium-length sentences (15-25 words)
   - Include SOME complex grammar structures (present perfect, passive voice, conditionals)
   - Use connecting words: "however", "therefore", "furthermore", "although"
   - Keep the original meaning but make it more detailed
   - Example: Keep similar to original but with some variation

3. ADVANCED (C1-C2):
   - Use sophisticated, academic, and nuanced vocabulary (e.g., "substantiate", "paradigm", "facilitate", "comprehensive", "elucidate", "pervasive")
   - Use complex, varied sentence structures (20-35 words)
   - Include advanced grammar patterns (subjunctive, inverted conditionals, complex noun phrases)
   - Use sophisticated connecting words: "furthermore", "consequently", "notwithstanding", "albeit"
   - Demonstrate high-level English proficiency
   - Example transformation: "The government made a plan" → "The government substantiated a comprehensive strategic framework"

IMPORTANT: 
- Each level MUST be clearly different from the others
- Maintain the same core meaning across all three levels
- Do NOT just copy the same text for all levels
- Make the differences obvious in vocabulary choice and sentence complexity

Return as JSON with this exact structure:
{
  "beginner": "Simple version with basic vocabulary and short sentences",
  "intermediate": "Intermediate version with varied vocabulary and medium sentences",
  "advanced": "Sophisticated version with advanced vocabulary and complex sentences"
}`

    const systemInstruction = `You are an English language teacher helping students understand different writing styles across proficiency levels. 
- You MUST create DISTINCTLY different versions for each level
- Beginner must use simple vocabulary and short sentences
- Intermediate must use varied vocabulary and medium sentences  
- Advanced must use sophisticated vocabulary and complex sentences
- Always respond with valid JSON only, no additional text.`

    const responseText = await generateText(prompt, systemInstruction)
    console.log('Rephrase response (first 300 chars):', responseText.substring(0, 300))
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = responseText.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '')
    }
    
    // JSON 객체 찾기
    let jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      const startIdx = jsonText.indexOf('{')
      const endIdx = jsonText.lastIndexOf('}')
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonMatch = [jsonText.substring(startIdx, endIdx + 1)]
      }
    }
    
    if (!jsonMatch || !jsonMatch[0]) {
      throw new Error('No JSON found in response')
    }
    
    const result = JSON.parse(jsonMatch[0])
    
    // 결과 검증 및 정리
    const beginner = result.beginner && typeof result.beginner === 'string' && result.beginner.trim().length > 0
      ? result.beginner.trim()
      : text
    
    const intermediate = result.intermediate && typeof result.intermediate === 'string' && result.intermediate.trim().length > 0
      ? result.intermediate.trim()
      : text
    
    const advanced = result.advanced && typeof result.advanced === 'string' && result.advanced.trim().length > 0
      ? result.advanced.trim()
      : text
    
    // 모든 레벨이 동일한지 확인
    if (beginner === intermediate && intermediate === advanced) {
      console.warn('All rephrased versions are identical, generating fallback versions')
      // Fallback: 수동으로 다른 버전 생성
      return {
        beginner: simplifyForBeginner(text),
        intermediate: text,
        advanced: enhanceForAdvanced(text),
      }
    }
    
    return {
      beginner,
      intermediate,
      advanced,
    }
  } catch (error: any) {
    console.error('Error rephrasing text:', error)
    console.error('Error details:', error.message)
    
    // Fallback: 기본 변환
    return {
      beginner: simplifyForBeginner(text),
      intermediate: text,
      advanced: enhanceForAdvanced(text),
    }
  }
}

// Fallback 함수들
function simplifyForBeginner(text: string): string {
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bcomprehensive\b/gi, replacement: 'complete' },
    { pattern: /\bimplement\b/gi, replacement: 'do' },
    { pattern: /\bsignificant\b/gi, replacement: 'important' },
    { pattern: /\bstrategy\b/gi, replacement: 'plan' },
    { pattern: /\bdevelop\b/gi, replacement: 'make' },
    { pattern: /\banalyze\b/gi, replacement: 'look at' },
    { pattern: /\bestablish\b/gi, replacement: 'make' },
    { pattern: /\bemphasize\b/gi, replacement: 'say' },
    { pattern: /\bfacilitate\b/gi, replacement: 'help' },
    { pattern: /\bsubstantiate\b/gi, replacement: 'show' },
  ]
  
  let simplified = text
  replacements.forEach(({ pattern, replacement }) => {
    simplified = simplified.replace(pattern, replacement)
  })
  
  // 긴 문장을 짧게 나누기
  const sentences = simplified.split(/(?<=[.!?])\s+/)
  const shortSentences = sentences.map(s => {
    if (s.split(/\s+/).length > 15) {
      // 문장이 너무 길면 나누기
      const parts = s.split(/,\s+/)
      return parts.length > 1 ? parts[0] + '.' : s
    }
    return s
  })
  
  return shortSentences.join(' ').substring(0, text.length + 50)
}

function enhanceForAdvanced(text: string): string {
  const replacements: Array<{ pattern: RegExp; replacement: string }> = [
    { pattern: /\bcomplete\b/gi, replacement: 'comprehensive' },
    { pattern: /\bdo\b/gi, replacement: 'implement' },
    { pattern: /\bimportant\b/gi, replacement: 'significant' },
    { pattern: /\bplan\b/gi, replacement: 'strategy' },
    { pattern: /\bmake\b/gi, replacement: 'develop' },
    { pattern: /\blook at\b/gi, replacement: 'analyze' },
    { pattern: /\bsay\b/gi, replacement: 'emphasize' },
    { pattern: /\bhelp\b/gi, replacement: 'facilitate' },
    { pattern: /\bshow\b/gi, replacement: 'substantiate' },
  ]
  
  let enhanced = text
  replacements.forEach(({ pattern, replacement }) => {
    enhanced = enhanced.replace(pattern, replacement)
  })
  
  return enhanced
}

export async function generateQuizFromArticle(
  title: string,
  content: string,
  keywords: string[] = [],
  level: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): Promise<Array<{
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  word: string
}>> {
  if (!useGoogleAI && !useOpenAI) {
    // Fallback: 간단한 퀴즈 생성
    const words = keywords.length > 0 ? keywords : extractKeywords(content)
    return words.slice(0, 5).map((word, idx) => ({
      id: `fallback-${idx + 1}`,
      question: `What does "${word}" mean in this article?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: `"${word}" is a key term in this article.`,
      word: word,
    }))
  }

  try {
    // 기사 내용을 더 많이 활용 (최대 3000자)
    const articleContent = content.length > 3000 ? content.substring(0, 3000) : content
    
    // 난이도별 지시사항
    let levelInstructions = ''
    if (level === 'beginner') {
      levelInstructions = `BEGINNER LEVEL (A1-A2):
- Use simple, everyday vocabulary words (e.g., "important", "help", "people", "change")
- Create questions with short, simple sentences (10-15 words)
- Use basic grammar structures (present tense, simple past)
- Make distractors clearly different and easy to distinguish
- Use simple explanations that beginners can understand
- Focus on common words that appear frequently in the article`
    } else if (level === 'intermediate') {
      levelInstructions = `INTERMEDIATE LEVEL (B1-B2):
- Use varied vocabulary including some academic terms (e.g., "significant", "strategy", "impact", "develop")
- Create questions with medium-length sentences (15-25 words)
- Include some complex grammar structures (present perfect, passive voice, conditionals)
- Make distractors plausible but clearly incorrect
- Provide detailed explanations that help learners understand
- Focus on words that expand vocabulary beyond basics`
    } else {
      levelInstructions = `ADVANCED LEVEL (C1-C2):
- Use sophisticated, academic, and nuanced vocabulary (e.g., "substantiate", "paradigm", "facilitate", "comprehensive")
- Create questions with complex sentence structures (20-35 words)
- Include advanced grammar patterns (subjunctive, inverted conditionals, complex noun phrases)
- Make distractors sophisticated but clearly wrong
- Provide comprehensive explanations with linguistic details
- Focus on words that demonstrate high-level English proficiency`
    }
    
    const prompt = `You are an English language teacher creating vocabulary quizzes from news articles for ${level}-level learners. Create 5 quiz questions that test understanding of SPECIFIC words and phrases from this article.

${levelInstructions}

CRITICAL REQUIREMENTS:
1. Questions MUST be based on ACTUAL words, phrases, or concepts from the article
2. The correct answer MUST appear in different positions (0, 1, 2, or 3) - DO NOT always put it in position 0
3. Distractors should be plausible but clearly wrong
4. Questions should test understanding of the article's content, not generic vocabulary
5. Questions MUST match the ${level} level - use appropriate vocabulary and sentence complexity

Article Title: ${title}
Article Content: ${articleContent}
${keywords.length > 0 ? `Key Vocabulary from Article: ${keywords.join(', ')}` : ''}

For each question:
1. Create a fill-in-the-blank question using a sentence from or based on the article
2. Generate 4 multiple choice options where:
   - ONE option is the correct answer (from the article)
   - THREE options are plausible distractors related to the topic but clearly wrong
3. Randomly place the correct answer in different positions (0, 1, 2, or 3) - vary the position for each question
4. Provide an explanation that references the article content
5. Identify the key word or phrase being tested

IMPORTANT: 
- Use words/phrases that actually appear in the article
- Make questions specific to this article's content
- Vary the correctAnswer index (0, 1, 2, 3) across questions - do NOT always use 0
- Ensure distractors are related to the topic but clearly incorrect

Return as JSON array with this exact structure:
[
  {
    "question": "Fill-in-the-blank question with _____ based on the article",
    "options": ["option A", "option B", "option C", "option D"],
    "correctAnswer": 2,
    "explanation": "Explanation referencing the article content",
    "word": "key word or phrase from article"
  },
  ...
]

Example of good question:
If the article mentions "The summit focused on accelerating the transition to renewable energy", a good question would be:
{
  "question": "According to the article, the summit focused on _____ the transition to renewable energy.",
  "options": ["delaying", "stopping", "accelerating", "preventing"],
  "correctAnswer": 2,
  "explanation": "The article states that the summit focused on 'accelerating the transition to sustainable energy sources.'",
  "word": "accelerating"
}

Note: correctAnswer should be 0, 1, 2, or 3, and should vary across questions.`

    const systemInstruction = 'You are an English language teacher creating vocabulary quizzes from news articles. Always respond with valid JSON array only, no additional text.'

    const responseText = await generateText(prompt, systemInstruction)
    console.log('Quiz generation response (first 500 chars):', responseText.substring(0, 500))
    
    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = responseText.trim()
    
    // Markdown 코드 블록 제거
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '')
    
    // JSON 배열 찾기
    let jsonMatch = jsonText.match(/\[[\s\S]*\]/)
    
    if (!jsonMatch) {
      // 대괄호로 시작하는 부분 찾기
      const startIdx = jsonText.indexOf('[')
      const endIdx = jsonText.lastIndexOf(']')
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        jsonMatch = [jsonText.substring(startIdx, endIdx + 1)]
      }
    }
    
    if (!jsonMatch || !jsonMatch[0]) {
      console.error('No JSON array found in response')
      console.error('Full response:', responseText)
      throw new Error('No JSON array found in AI response')
    }
    
    let result
    try {
      result = JSON.parse(jsonMatch[0])
      console.log(`Successfully parsed ${Array.isArray(result) ? result.length : 0} quiz questions`)
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Attempted to parse:', jsonMatch[0].substring(0, 300))
      throw new Error('Failed to parse JSON response')
    }
    
    // 결과 검증 및 ID 추가
    if (Array.isArray(result) && result.length > 0) {
      const validatedQuestions = result
        .filter((q: any) => {
          // 필수 필드 확인
          if (!q.question || typeof q.question !== 'string') return false
          if (!Array.isArray(q.options) || q.options.length !== 4) return false
          // 모든 옵션이 문자열인지 확인
          if (!q.options.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0)) return false
          // correctAnswer가 유효한지 확인
          if (typeof q.correctAnswer !== 'number' || q.correctAnswer < 0 || q.correctAnswer >= 4) return false
          return true
        })
        .slice(0, 10) // 최대 10개로 제한
        .map((q: any, idx: number) => {
          // 옵션 정리
          const options = q.options.map((opt: string) => opt.trim()).slice(0, 4)
          let correctAnswer = q.correctAnswer
          
          // correctAnswer가 유효한지 재확인
          if (correctAnswer < 0 || correctAnswer >= options.length) {
            correctAnswer = 0
          }
          
          // 정답 위치가 항상 같은지 확인하고, 필요시 섞기
          // (이미 AI가 다양한 위치에 배치했는지 확인)
          
          return {
            id: `quiz-${idx + 1}-${Date.now()}`,
            question: q.question.trim(),
            options: options,
            correctAnswer: correctAnswer,
            explanation: q.explanation?.trim() || 'No explanation available',
            word: q.word?.trim() || q.question.match(/\b\w+\b/)?.[0] || 'vocabulary',
          }
        })
      
      // 정답 위치 분포 확인 및 로깅
      const positionCounts = [0, 0, 0, 0]
      validatedQuestions.forEach(q => {
        positionCounts[q.correctAnswer]++
      })
      console.log('Correct answer positions before shuffling:', positionCounts)
      
      // 정답 위치가 모두 같은지 확인 (모두 0이면 문제)
      const allSamePosition = validatedQuestions.every(q => q.correctAnswer === validatedQuestions[0].correctAnswer)
      if (allSamePosition && validatedQuestions.length > 1) {
        console.warn(`All correct answers are in position ${validatedQuestions[0].correctAnswer}, shuffling options...`)
        // 옵션을 섞어서 정답 위치를 다양하게 만들기
        const shuffled = validatedQuestions.map((q, idx) => {
          const correctOption = q.options[q.correctAnswer]
          const wrongOptions = q.options.filter((_: string, i: number) => i !== q.correctAnswer)
          
          // 각 문제마다 다른 위치에 정답 배치 (0, 1, 2, 3 순환)
          const newCorrectIndex = idx % 4
          
          // 새 옵션 배열 생성: 정답을 지정된 위치에 배치
          const shuffledOptions = [...wrongOptions]
          shuffledOptions.splice(newCorrectIndex, 0, correctOption)
          
          return {
            ...q,
            options: shuffledOptions,
            correctAnswer: newCorrectIndex,
          }
        })
        
        // 섞은 후 위치 분포 확인
        const newPositionCounts = [0, 0, 0, 0]
        shuffled.forEach(q => {
          newPositionCounts[q.correctAnswer]++
        })
        console.log('Correct answer positions after shuffling:', newPositionCounts)
        
        return shuffled
      }
      
      if (validatedQuestions.length > 0) {
        return validatedQuestions
      }
    }
    
    throw new Error('Invalid quiz format')
  } catch (error: any) {
    console.error('Error generating quiz:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      title: title.substring(0, 50),
      contentLength: content.length,
      keywordsCount: keywords.length,
    })
    
    // Fallback: 기사 내용 기반 간단한 퀴즈 생성
    const words = keywords.length > 0 ? keywords : extractKeywords(content)
    
    if (words.length === 0) {
      // 키워드가 없으면 기본 퀴즈
      return [
        {
          id: 'fallback-1',
          question: 'Based on the article, what is the main topic?',
          options: ['The article discusses current events', 'The article covers important news', 'The article reports on recent developments', 'The article presents new information'],
          correctAnswer: 0,
          explanation: 'This is a fallback question. Please check the article content.',
          word: 'article',
        },
      ]
    }
    
    // 각 단어마다 다른 정답 위치에 배치
    return words.slice(0, 5).map((word, idx) => {
      const correctIndex = idx % 4
      const options = ['Option A', 'Option B', 'Option C', 'Option D']
      const correctOption = `The word "${word}" appears in the article`
      const shuffledOptions = [...options]
      shuffledOptions[correctIndex] = correctOption
      
      return {
        id: `fallback-${idx + 1}`,
        question: `What does "${word}" mean in this article?`,
        options: shuffledOptions,
        correctAnswer: correctIndex,
        explanation: `"${word}" is a key term in this article.`,
        word: word,
      }
    })
  }
}

function extractKeywords(text: string): string[] {
  // 간단한 키워드 추출 (명사 위주)
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []
  const wordCount: Record<string, number> = {}
  
  words.forEach(word => {
    if (word.length >= 4) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  })
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}
