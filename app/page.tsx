import Link from 'next/link'
import { BookOpen, Globe, MessageSquare, Brain, Zap } from 'lucide-react'

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          NELS
        </h1>
        <p className="text-2xl text-gray-700 mb-4">
          News English Learning System
        </p>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          뉴스 컨텐츠를 기반으로 영어를 학습하는 맥락 중심 영어 학습 플랫폼입니다.
          시사 이슈를 통해 영어 표현뿐 아니라 문화적 배경, 사회적 맥락, 비판적 사고력을 함께 학습하세요.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/news" className="btn-primary">
            뉴스 시작하기
          </Link>
          <Link href="/about" className="btn-secondary">
            더 알아보기
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">핵심 기능</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card">
            <BookOpen className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Daily News Digest</h3>
            <p className="text-gray-600">
              AI가 매일 주요 글로벌 뉴스를 선별해 학습자 수준에 맞게 요약 제공합니다.
              핵심 어휘와 문법 포인트를 자동으로 표시합니다.
            </p>
          </div>

          <div className="card">
            <Globe className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Cultural Context Card</h3>
            <p className="text-gray-600">
              기사에 등장하는 문화적 배경, 사회적 맥락, 관용 표현을 카드 형태로 정리하여
              직관적으로 이해할 수 있습니다.
            </p>
          </div>

          <div className="card">
            <MessageSquare className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Writing Feedback</h3>
            <p className="text-gray-600">
              기사에 대한 의견문을 작성하면 AI가 문법, 어휘, 논리적 구조를 피드백합니다.
              수정 전후 비교 기능을 제공합니다.
            </p>
          </div>

          <div className="card">
            <Brain className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Rephrase and Compare</h3>
            <p className="text-gray-600">
              같은 문장을 초급, 중급, 고급 수준의 영어로 자동 변환하여 비교할 수 있습니다.
              자연스럽게 표현력과 문체 감각이 향상됩니다.
            </p>
          </div>

          <div className="card">
            <Zap className="w-12 h-12 text-primary-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Vocabulary Quiz</h3>
            <p className="text-gray-600">
              기사 내 주요 어휘와 표현에 관해 자동 생성되는 퀴즈를 풀 수 있습니다.
              오답은 복습 리스트에 저장되어 주기적으로 복습할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">지금 시작하세요</h2>
        <p className="text-lg text-gray-600 mb-8">
          영어를 "시험 과목"이 아니라 세계와 소통하는 언어로 배워보세요.
        </p>
        <Link href="/news" className="btn-primary text-lg px-8 py-3">
          무료로 시작하기
        </Link>
      </section>
    </div>
  )
}



