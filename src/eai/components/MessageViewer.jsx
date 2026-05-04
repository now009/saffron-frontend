// ============================================================
// MessageViewer — 메시지 본문 뷰어 (요청/응답 페이로드 표시용)
// 사용처: MessageHistory 모달, InterfaceForm 테스트 결과
// 기능: JSON 정렬 모드 ↔ RAW 토글, 접기/펼치기, 어두운 코드 블록 스타일
// ============================================================
import { useState } from 'react'

// JSON 모드에서 파싱 가능하면 들여쓰기, 실패 시 원본 그대로 — XML/Plain 텍스트도 안전하게 처리.
function tryFormat(text, mode) {
  if (!text) return ''
  if (mode === 'json') {
    try { return JSON.stringify(JSON.parse(text), null, 2) } catch { return text }
  }
  return text
}

function MessageViewer({ value, defaultMode = 'json' }) {
  const [mode, setMode] = useState(defaultMode)
  const [expanded, setExpanded] = useState(true)

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 4, alignItems: 'center' }}>
        <button
          className={`eai-toggle-btn ${mode === 'json' ? 'on' : ''}`}
          onClick={() => setMode('json')}
        >JSON</button>
        <button
          className={`eai-toggle-btn ${mode === 'raw' ? 'on' : ''}`}
          onClick={() => setMode('raw')}
        >RAW</button>
        <button
          className="eai-toggle-btn"
          style={{ marginLeft: 'auto' }}
          onClick={() => setExpanded(v => !v)}
        >{expanded ? '접기' : '펼치기'}</button>
      </div>
      {expanded && (
        <pre className="message-viewer">
          {tryFormat(value, mode) || '(내용 없음)'}
        </pre>
      )}
    </div>
  )
}

export default MessageViewer
