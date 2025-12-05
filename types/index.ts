export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  level: Level
  keywords: string[]
  grammarPoints: string[]
  culturalContext?: CulturalContext
  publishedAt?: string
}

export interface CulturalContext {
  title: string
  description: string
  examples: string[]
  imageUrl?: string
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  word: string
}

export interface WritingFeedback {
  grammar: {
    score: number
    comments: string[]
  }
  vocabulary: {
    score: number
    comments: string[]
  }
  structure: {
    score: number
    comments: string[]
  }
  suggestions: string[]
  improved: string
}

export interface RephrasedText {
  beginner: string
  intermediate: string
  advanced: string
}

