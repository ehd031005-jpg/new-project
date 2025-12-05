'use client'

import { useState } from 'react'
import { Globe, ChevronDown, ChevronUp } from 'lucide-react'

interface CulturalContext {
  title: string
  description: string
  examples: string[]
}

interface CulturalContextCardProps {
  context: CulturalContext
}

export default function CulturalContextCard({ context }: CulturalContextCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 예시가 없을 때 기본값
  const examples = context.examples && context.examples.length > 0 
    ? context.examples 
    : ['cultural expression', 'relevant phrase', 'key concept']

  return (
    <div className="border border-primary-200 rounded-lg bg-gradient-to-br from-primary-50 to-white p-6 mt-6 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Globe className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">문화적 맥락</h3>
            <p className="text-sm text-gray-500">Cultural Context</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-lg font-semibold text-primary-800 mb-3">{context.title}</h4>
        <p className="text-gray-700 leading-relaxed mb-4">{context.description}</p>

        {examples.length > 0 && (
          <div className={`transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="mt-4 pt-4 border-t border-primary-200">
              <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-primary-600">💡</span>
                관련 표현 및 개념
              </h5>
              <div className="flex flex-wrap gap-2">
                {examples.map((example, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white border border-primary-200 rounded-lg text-sm text-gray-700 hover:bg-primary-50 transition-colors"
                  >
                    {example}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}



