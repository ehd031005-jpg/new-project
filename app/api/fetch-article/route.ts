import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 원문 URL에서 기사 본문을 추출합니다
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    console.log(`기사 원문 가져오기 시도: ${url}`)
    
    // 원문 URL에서 HTML 가져오기
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      // CORS 우회를 위해 서버 사이드에서 fetch
      next: { revalidate: 3600 }, // 1시간 캐시
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`)
    }

    const html = await response.text()
    console.log(`HTML 길이: ${html.length} bytes`)
    
    // HTML에서 기사 본문 추출
    const articleContent = extractArticleContent(html)
    
    if (!articleContent || articleContent.trim().length < 100) {
      console.warn(`기사 본문 추출 실패: URL=${url}, 추출된 길이=${articleContent?.length || 0}`)
      // 추출 실패 시 원본 content 반환
      return NextResponse.json({
        success: false,
        message: 'Could not extract full article content',
        fallback: true,
      })
    }

    console.log(`기사 본문 추출 성공: 길이=${articleContent.length} characters`)
    return NextResponse.json({
      success: true,
      content: articleContent,
    })
  } catch (error: any) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch article',
      },
      { status: 500 }
    )
  }
}

/**
 * HTML에서 기사 본문을 추출합니다 (개선된 정규식 기반)
 */
function extractArticleContent(html: string): string | null {
  // 스크립트, 스타일, 주석, 광고 등 제거
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, '')
    // 소셜 미디어, 공유 버튼 제거
    .replace(/<div[^>]*(?:class|id)=["'][^"']*(?:social|share|facebook|twitter|instagram|linkedin|pinterest|whatsapp|email-share|share-buttons|social-media)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    // 광고 관련 클래스/ID 제거
    .replace(/<div[^>]*(?:class|id)=["'][^"']*(?:ad|advertisement|promo|sponsor|banner|popup|modal)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    // 댓글, 관련 기사, 추천 기사 제거
    .replace(/<div[^>]*(?:class|id)=["'][^"']*(?:comment|related|recommended|more-articles|newsletter|subscribe|sign-up)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    // 저작권, 푸터 정보 제거
    .replace(/<div[^>]*(?:class|id)=["'][^"']*(?:copyright|footer|legal|terms|privacy)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    // 이메일, 연락처 정보 제거
    .replace(/<div[^>]*(?:class|id)=["'][^"']*(?:contact|email|phone|address)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi, '')
    // 소셜 미디어 링크 제거
    .replace(/<a[^>]*(?:href|class|id)=["'][^"']*(?:facebook|twitter|instagram|linkedin|pinterest|youtube|email|mailto)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi, '')

  // 일반적인 기사 본문 선택자들 (우선순위 순, 더 많은 패턴 추가)
  const patterns = [
    // article 태그 (가장 신뢰할 수 있음)
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    // 특정 클래스/ID를 가진 div들
    /<div[^>]*(?:class|id)=["'][^"']*article-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*article-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*article-text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*post-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*entry-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*story-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*content-body[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*main-content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*(?:class|id)=["'][^"']*article-main[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    // main 태그
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    // section 태그
    /<section[^>]*(?:class|id)=["'][^"']*(?:article|content|body|story)[^"']*["'][^>]*>([\s\S]*?)<\/section>/i,
  ]

  let content = ''
  let bestMatch = null
  let bestLength = 0
  
  // 패턴 순서대로 시도하고 가장 긴 것을 선택
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.source, 'gi')
    let match
    while ((match = regex.exec(cleaned)) !== null) {
      if (match && match[1]) {
        const text = extractTextFromHtml(match[1])
        // 충분한 길이이고 이전보다 길면 선택
        if (text.length > 200 && text.length > bestLength) {
          // 링크 비율 확인
          const linkCount = (match[1].match(/<a[^>]*>/gi) || []).length
          if (linkCount < text.length / 80) { // 링크 비율이 너무 높지 않으면
            bestLength = text.length
            bestMatch = match[1]
            content = text
          }
        }
      }
    }
  }

  // 패턴으로 찾지 못한 경우, p 태그들을 모아서 기사 본문 찾기
  if (!content || content.length < 200) {
    // p 태그들을 모아서 긴 문단 찾기 (가장 신뢰할 수 있는 방법)
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi
    let pTexts: string[] = []
    let totalLength = 0
    let pMatch
    
    while ((pMatch = pRegex.exec(cleaned)) !== null) {
      if (pMatch && pMatch[1]) {
        const text = extractTextFromHtml(pMatch[1])
        // 최소 길이 체크 및 불필요한 내용 필터링
        if (text.length > 50) {
          // 이메일, 소셜 미디어 관련 텍스트가 포함된 문단 제외
          const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)
          const hasSocial = /(?:Follow|Like|Share|Tweet|Connect|Subscribe|Facebook|Twitter|Instagram|LinkedIn|Bluesky|Flipboard|Reddit)/i.test(text)
          const hasComment = /(?:Comment|Leave a comment|Add your comment)/i.test(text)
          const hasRelated = /(?:Related|Read more|More articles|Recommended)/i.test(text)
          const hasSubscribe = /(?:Subscribe|Newsletter|Sign up)/i.test(text)
          const hasUIButton = /^(?:Share|Copy|Link copied|Print|Email|Save|Bookmark)$/i.test(text.trim())
          const hasPlatform = /^(?:LinkedIn|Bluesky|Flipboard|Reddit|Twitter|Facebook|Instagram)$/i.test(text.trim())
          const hasReporter = /^[A-Z][a-z]+\s+(?:is\s+a|has\s+reported|is\s+based)|^(?:She|He|They)\s+has\s+reported/i.test(text)
          const hasAddGoogle = /Add\s+[A-Z][^\n]{0,30}\s+on\s+Google|Add\s+[A-Z][^\n]{0,30}\s+as\s+your\s+preferred/i.test(text)
          const hasUpdated = /^Updated?\s+|^Published?\s+|^Last\s+updated?/i.test(text.trim())
          const hasLocation = /^[A-Z][A-Z\s,]+\([A-Z]+\)\s*—|^[A-Z][A-Z\s,]+—/i.test(text.trim())
          
          if (!hasEmail && !hasSocial && !hasComment && !hasRelated && !hasSubscribe && 
              !hasUIButton && !hasPlatform && !hasReporter && !hasAddGoogle && !hasUpdated && !hasLocation) {
            pTexts.push(text)
            totalLength += text.length
          }
        }
      }
    }
    
    // 충분한 p 태그가 모이면 사용
    if (pTexts.length > 3 && totalLength > 500) {
      content = pTexts.join('\n\n')
    } else {
      // div 요소들 중 가장 긴 것 찾기 (더 엄격한 필터링)
      const divRegex = /<div[^>]*>([\s\S]*?)<\/div>/gi
      let match
      
      while ((match = divRegex.exec(cleaned)) !== null) {
        const text = extractTextFromHtml(match[1])
        // 링크 비율이 너무 높지 않은지 확인
        const linkCount = (match[1].match(/<a[^>]*>/gi) || []).length
        // 불필요한 내용이 포함되어 있는지 확인
        const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)
        const hasSocial = /(?:Follow|Like|Share|Tweet|Connect|Subscribe|Facebook|Twitter|Instagram)/i.test(text)
        
        if (text.length > bestLength && text.length > 200 && text.length < 100000) {
          if (linkCount < text.length / 100 && !hasEmail && !hasSocial) {
            bestLength = text.length
            content = text
          }
        }
      }
    }
  }

  // 최종 필터링: 불필요한 정보 제거 (더 강력하게)
  if (!content || content.length < 100) {
    return null
  }
  
  const filteredContent = content
    // 이메일 주소 제거
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // 전화번호 제거
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '')
    // URL 제거
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    // 날짜/시간 메타데이터 제거
    .replace(/Updated?\s+[^\n]{0,50}/gi, '')
    .replace(/Published?\s+[^\n]{0,50}/gi, '')
    .replace(/Last\s+updated?[^\n]{0,50}/gi, '')
    .replace(/\d{1,2}:\d{2}\s*(?:AM|PM)\s*[A-Z]{2,4},?\s*[A-Z][a-z]+\s+\d{1,2},?\s+\d{4}/g, '')
    // "Add [source] on Google" 같은 패턴 제거
    .replace(/Add\s+[A-Z][^\n]{0,30}\s+on\s+Google[^\n]{0,50}/gi, '')
    .replace(/Add\s+[A-Z][^\n]{0,30}\s+as\s+your\s+preferred\s+source[^\n]{0,100}/gi, '')
    // UI 버튼 텍스트 제거
    .replace(/^(?:Share|Copy|Link copied|Print|Email|Save|Bookmark)$/gim, '')
    .replace(/^(?:Share|Copy|Print|Email|Save|Bookmark)\s*$/gim, '')
    // 소셜 미디어 플랫폼 이름만 있는 줄 제거
    .replace(/^(?:LinkedIn|Bluesky|Flipboard|Reddit|Twitter|Facebook|Instagram|Pinterest|YouTube|TikTok|Snapchat|WhatsApp|Telegram)$/gim, '')
    // 소셜 미디어 관련 문구 제거
    .replace(/(?:Follow|Like|Share|Tweet|Connect|Subscribe)[\s\w]*on[\s\w]*(?:Facebook|Twitter|Instagram|LinkedIn|Pinterest|YouTube)[\s\S]{0,50}/gi, '')
    // 댓글 관련 문구 제거
    .replace(/(?:Comment|Comments|Leave a comment|Add your comment|Join the discussion)[\s\S]{0,100}/gi, '')
    // 관련 기사 관련 문구 제거
    .replace(/(?:Related articles|Read more|More from|You might also like|Recommended for you|See also)[\s\S]{0,200}/gi, '')
    // 구독 관련 문구 제거
    .replace(/(?:Subscribe to|Newsletter|Sign up for|Get our newsletter|Email updates)[\s\S]{0,150}/gi, '')
    // 저작권 정보 제거
    .replace(/(?:Copyright|©|All rights reserved|Terms of Service|Privacy Policy)[\s\S]{0,100}/gi, '')
    // 위치 정보 제거 (예: "TAIPEI, Taiwan (AP) —")
    .replace(/^[A-Z][A-Z\s,]+\([A-Z]+\)\s*—?\s*/gm, '')
    .replace(/^[A-Z][A-Z\s,]+—\s*/gm, '')
    // 기자 정보/바이오 제거 (문단 시작이 이름이고 "is a" 또는 "reporter" 포함)
    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s+is\s+a[^\n]{0,200}/gim, '')
    .replace(/^[A-Z][a-z]+\s+is\s+a[^\n]{0,200}/gim, '')
    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s+has\s+reported[^\n]{0,200}/gim, '')
    .replace(/^[A-Z][a-z]+\s+has\s+reported[^\n]{0,200}/gim, '')
    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s+is\s+based[^\n]{0,200}/gim, '')
    .replace(/^[A-Z][a-z]+\s+is\s+based[^\n]{0,200}/gim, '')
    // "reporter for" 패턴 제거
    .replace(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+is\s+a\s+[^\n]{0,50}\s+reporter\s+for[^\n]{0,200}/gim, '')
    // "She has reported" 같은 패턴 제거
    .replace(/^(?:She|He|They)\s+has\s+reported[^\n]{0,200}/gim, '')
    // 연속된 공백 정리
    .replace(/[ \t]+/g, ' ')
    // 빈 줄 제거
    .replace(/^\s*$/gm, '')
    // 문장 끝 후 대문자로 시작하면 문단 구분
    .replace(/\.\s+([A-Z][a-z])/g, '.\n\n$1')
    .replace(/\?\s+([A-Z][a-z])/g, '?\n\n$1')
    .replace(/!\s+([A-Z][a-z])/g, '!\n\n$1')
    // 연속된 줄바꿈 정리
    .replace(/\n{3,}/g, '\n\n')
    // 앞뒤 공백 정리
    .trim()

  // 최종 길이 체크 (너무 짧으면 null 반환)
  if (!filteredContent || filteredContent.length < 100) {
    return null
  }

  return filteredContent
}

/**
 * HTML에서 텍스트만 추출 (문단 구조 보존, 불필요한 정보 제거)
 */
function extractTextFromHtml(html: string): string {
  // 먼저 불필요한 요소들 제거
  let cleaned = html
    // 소셜 미디어 관련 텍스트 제거
    .replace(/<[^>]*(?:class|id)=["'][^"']*(?:social|share|facebook|twitter|instagram|linkedin|pinterest|whatsapp|email-share)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, '')
    // 이메일 주소 패턴 제거
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // 전화번호 패턴 제거
    .replace(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '')
    // URL 패턴 제거 (http, https, www)
    .replace(/https?:\/\/[^\s]+/gi, '')
    .replace(/www\.[^\s]+/gi, '')
    // 소셜 미디어 링크 텍스트 제거
    .replace(/(?:Follow|Like|Share|Tweet|Connect|Subscribe)[\s\w]*on[\s\w]*(?:Facebook|Twitter|Instagram|LinkedIn|Pinterest|YouTube)/gi, '')
    // 댓글 관련 텍스트 제거
    .replace(/(?:Comment|Comments|Leave a comment|Add your comment)/gi, '')
    // 관련 기사, 더 읽기 관련 텍스트 제거
    .replace(/(?:Related|Read more|More articles|Recommended|You may also like)/gi, '')
    // 구독, 뉴스레터 관련 텍스트 제거
    .replace(/(?:Subscribe|Newsletter|Sign up|Get updates)/gi, '')
    // 저작권, 법적 정보 제거
    .replace(/(?:Copyright|©|All rights reserved|Terms|Privacy Policy|Legal)/gi, '')
  
  // 블록 레벨 요소를 줄바꿈으로 변환하여 구조 보존
  let text = cleaned
    // 블록 레벨 요소를 줄바꿈으로 변환
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<br[^>]*>/gi, '\n')
    // 스크립트, 스타일 제거
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // 나머지 HTML 태그 제거
    .replace(/<[^>]+>/g, ' ')
    // HTML 엔티티 디코딩
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '...')
    // 연속된 공백 정리
    .replace(/[ \t]+/g, ' ')
    // 연속된 줄바꿈 정리
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  // 추가 필터링: 불필요한 텍스트 패턴 제거
  text = text
    // 이메일 주소 (다시 한번)
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
    // 날짜/시간 메타데이터 제거
    .replace(/Updated?\s+[^\n]{0,50}/gi, '')
    .replace(/Published?\s+[^\n]{0,50}/gi, '')
    // "Add [source] on Google" 패턴 제거
    .replace(/Add\s+[A-Z][^\n]{0,30}\s+on\s+Google[^\n]{0,50}/gi, '')
    // UI 버튼 텍스트 제거
    .replace(/^(?:Share|Copy|Link copied|Print|Email|Save|Bookmark)$/gim, '')
    // 소셜 미디어 플랫폼 이름만 있는 줄 제거
    .replace(/^(?:LinkedIn|Bluesky|Flipboard|Reddit|Twitter|Facebook|Instagram|Pinterest|YouTube)$/gim, '')
    // 소셜 미디어 관련 문구 제거
    .replace(/(?:Follow us|Like us|Share this|Tweet this|Connect with us)[\s\S]{0,100}/gi, '')
    // 댓글 관련 문구 제거
    .replace(/(?:Comments|Leave a comment|Add your comment|Join the discussion)[\s\S]{0,50}/gi, '')
    // 관련 기사 관련 문구 제거
    .replace(/(?:Related articles|Read more|More from|You might also like|Recommended for you)[\s\S]{0,200}/gi, '')
    // 구독 관련 문구 제거
    .replace(/(?:Subscribe to|Newsletter|Sign up for|Get our newsletter)[\s\S]{0,100}/gi, '')
    // 위치 정보 제거
    .replace(/^[A-Z][A-Z\s,]+\([A-Z]+\)\s*—?\s*/gm, '')
    // 기자 정보 제거
    .replace(/^[A-Z][a-z]+\s+[A-Z][a-z]+\s+is\s+a[^\n]{0,200}/gim, '')
    .replace(/^[A-Z][a-z]+\s+is\s+a\s+[^\n]{0,50}\s+reporter\s+for[^\n]{0,200}/gim, '')
    .replace(/^(?:She|He|They)\s+has\s+reported[^\n]{0,200}/gim, '')
    // 연속된 공백 다시 정리
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  return text
}
