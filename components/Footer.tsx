export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">NELS</h3>
            <p className="text-sm">
              뉴스 기반 영어 학습 플랫폼으로 언어, 문화, 사고를 통합적으로 학습합니다.
            </p>
          </div>
          
          <div>
            <h4 className="text-white text-lg font-semibold mb-4">주요 기능</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/news" className="hover:text-white">Daily News Digest</a></li>
              <li><a href="/quiz" className="hover:text-white">Vocabulary Quiz</a></li>
              <li><a href="/writing" className="hover:text-white">Writing Feedback</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white text-lg font-semibold mb-4">연락처</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-gray-400">전화</span>
                <br />
                <a href="tel:01084011468" className="hover:text-white">
                  010-8401-1468
                </a>
              </li>
              <li>
                <span className="text-gray-400">이메일</span>
                <br />
                <a href="mailto:ehd031005@gmail.com" className="hover:text-white">
                  ehd031005@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; 2025 NELS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}



