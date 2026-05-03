function MappingRuleEditor({ rules, onChange }) {
  const list = rules ?? []

  const add = () => onChange([...list, { id: Date.now(), sourcePath: '', targetPath: '', transformType: 'COPY', transformExpr: '', sortOrder: list.length + 1 }])

  const remove = (idx) => onChange(list.filter((_, i) => i !== idx))

  const update = (idx, key, val) => onChange(list.map((r, i) => i === idx ? { ...r, [key]: val } : r))

  return (
    <div className="eai-form-section">
      <h4>매핑 규칙</h4>
      <div style={{ overflowX: 'auto' }}>
        <table className="mapping-table">
          <thead>
            <tr>
              <th style={{ width: 30 }}>#</th>
              <th>소스 경로</th>
              <th>타깃 경로</th>
              <th style={{ width: 120 }}>변환유형</th>
              <th>변환식</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 12, color: '#9ca3af' }}>매핑 규칙이 없습니다.</td></tr>
            )}
            {list.map((r, i) => (
              <tr key={r.id ?? i}>
                <td style={{ textAlign: 'center' }}>{i + 1}</td>
                <td><input value={r.sourcePath} onChange={e => update(i, 'sourcePath', e.target.value)} placeholder="$.order.id" /></td>
                <td><input value={r.targetPath} onChange={e => update(i, 'targetPath', e.target.value)} placeholder="/Order/OrderNo" /></td>
                <td>
                  <select value={r.transformType} onChange={e => update(i, 'transformType', e.target.value)}>
                    {['COPY', 'FORMAT', 'CODE_MAP', 'EXPRESSION'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </td>
                <td><input value={r.transformExpr ?? ''} onChange={e => update(i, 'transformExpr', e.target.value)} placeholder="변환식" /></td>
                <td>
                  <button onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 }}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="eai-toggle-btn" style={{ marginTop: 8 }} onClick={add}>+ 행 추가</button>
    </div>
  )
}

export default MappingRuleEditor
