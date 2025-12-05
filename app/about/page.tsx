import { BookOpen, Target, Users, TrendingUp } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">NELS 소개</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary-600" />
          프로그램 개요
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          NELS (News English Learning System)는 뉴스 컨텐츠를 기반으로 영어를 학습하는
          맥락 중심 영어 학습 플랫폼입니다.
        </p>
        <p className="text-gray-700 leading-relaxed">
          사용자는 최신 시사 뉴스를 통해 영어 표현뿐 아니라 문화적 배경, 사회적 맥락,
          비판적 사고력을 함께 학습합니다. 이 플랫폼은 대학생 및 성인 학습자, 영어 교육자
          모두를 주요 타깃으로 합니다.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-primary-600" />
          기획 의도
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          오늘날 영어는 단순한 의사소통의 도구를 넘어, 세계의 흐름과 문화를 이해하기 위한
          지적 언어 능력으로 인식되고 있습니다. 그러나 기존의 영어 학습의 대부분은 문법과
          단어 암기에 치중되어, 언어가 사용되는 맥락과 문화적 의미를 충분히 전달하지 못하고
          있습니다.
        </p>
        <p className="text-gray-700 leading-relaxed">
          NELS는 영어권 뉴스 콘텐츠를 기반으로, 학습자가 시사적 맥락 속에서 언어와 문화를
          배우는 새로운 학습 플랫폼을 제안합니다. 뉴스는 단순한 언어 자료가 아니라, 언어와
          사회가 만나는 지점입니다. 이를 학습 도구로 활용함으로써, 사용자는 단어와 문법을
          배우는 것을 넘어 사고력, 표현력, 문화적 맥락 등을 함께 공부할 수 있습니다.
        </p>
        <p className="text-gray-700 leading-relaxed mt-4 font-semibold text-primary-700">
          NELS의 목표는 단순히 "영어를 잘하게 되는 것"이 아니라, "영어로 세상을 바라보고
          비판적으로 사고할 수 있는 능력"을 길러주는 것입니다.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          대상 사용자
        </h2>
        <ul className="space-y-3 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>
              <strong>대학생:</strong> 영어 실력을 향상시키는 동시에 시사 이슈에 대해서도
              공부하고 싶은 학습자
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>
              <strong>영어 교사:</strong> 영어 뉴스 자료를 수업 교재로 활용하고자 하는
              교육자
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>
              <strong>취업 준비생:</strong> 영어 인터뷰, 프레젠테이션, 시사 토론 대비를
              원하는 학습자
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-1">•</span>
            <span>
              <strong>성인 일반 학습자:</strong> 단순한 어학 학습을 넘어 실용적인 영어
              학습을 원하는 학습자
            </span>
          </li>
        </ul>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-600" />
          기대 효과
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-2">실용적 독해력 향상</h3>
            <p className="text-sm text-gray-600">
              뉴스 기사 기반 학습을 통해 자연스러운 문장 구조, 어휘 표현을 실제 사용 맥락
              속에서 습득합니다.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">문화 이해력 강화</h3>
            <p className="text-sm text-gray-600">
              언어가 사회와 연결되어 있다는 사실을 체감하는 동시에, 영어권의 문화와
              사고방식을 깊이 이해할 수 있습니다.
            </p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-2">비판적 사고력 향상</h3>
            <p className="text-sm text-gray-600">
              시사 이슈를 영어로 읽고, 의견문을 영어로 작성하는 과정에서 논리적 사고력과
              영어 표현력이 함께 성장합니다.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-primary-50 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">비전</h2>
        <p className="text-gray-700 leading-relaxed">
          NELS는 영어를 "시험 과목"이 아니라 세계와 소통하는 언어로 바라보게 하는
          플랫폼입니다. 뉴스를 통해 언어, 문화, 사고를 함께 배우는 경험은 학습자의 지적
          호기심을 자극하고, 단어 암기식 영어 교육의 한계를 넘어섭니다.
        </p>
        <p className="text-gray-700 leading-relaxed mt-4 font-semibold">
          "언어는 세상을 이해하고 내 의견을 표출할 수 있는 수단이다."
        </p>
      </section>
    </div>
  )
}



