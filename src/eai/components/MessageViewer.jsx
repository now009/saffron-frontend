import { useState } from 'react'

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
