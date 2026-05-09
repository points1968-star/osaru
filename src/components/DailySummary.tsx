import { useState, useEffect } from 'react'
import type { Task, AnnReflection } from '../types'
import { useAnn } from '../hooks/useAnn'

interface Props {
  completedToday: Task[]
  onClose: () => void
}

export function DailySummary({ completedToday, onClose }: Props) {
  const { loading, reflect } = useAnn()
  const [result, setResult] = useState<AnnReflection | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    reflect(completedToday).then(res => {
      if (typeof res === 'string') setError(res)
      else setResult(res)
    })
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ann-modal" onClick={e => e.stopPropagation()}>
        <div className="ann-header">
          <span className="ann-avatar">アン</span>
          <div>
            <p className="ann-label">本日の振り返り</p>
            <p className="ann-name">デイリー・サマリー</p>
          </div>
        </div>

        <div className="ann-section">
          <p className="ann-section-title">✅ 本日の完了タスク（{completedToday.length}件）</p>
          <ul className="ann-completed-list">
            {completedToday.map(t => (
              <li key={t.id} className="ann-completed-item">・{t.title}</li>
            ))}
          </ul>
        </div>

        {loading ? (
          <div className="ann-loading">
            <div className="loading-spinner" />
            <p>アンが振り返りを生成中...</p>
          </div>
        ) : error ? (
          <p className="ann-error">❌ {error}</p>
        ) : result ? (
          <>
            <div className="ann-advice-bubble ann-narrative">
              <span className="ann-bubble-icon">🌟</span>
              <p>{result.narrative}</p>
            </div>
            <div className="ann-value">
              <span className="ann-value-icon">📅</span>
              <p><strong>明日へのアドバイス：</strong>{result.advice}</p>
            </div>
          </>
        ) : null}

        <div className="form-actions" style={{ marginTop: '20px' }}>
          <button className="btn btn--primary" style={{ width: '100%' }} onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
