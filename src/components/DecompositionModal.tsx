import type { AnnDecomposition } from '../types'

interface Props {
  result: AnnDecomposition
  loading: boolean
  onApply: (steps: string[]) => void
  onClose: () => void
}

export function DecompositionModal({ result, loading, onApply, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ann-modal" onClick={e => e.stopPropagation()}>
        <div className="ann-header">
          <span className="ann-avatar">アン</span>
          <div>
            <p className="ann-label">AI秘書からの提案</p>
            <p className="ann-name">タスクを分解しました</p>
          </div>
        </div>

        <div className="ann-section">
          <p className="ann-section-title">🚀 最初の一歩（2分）</p>
          <p className="ann-first-step">{result.first_step}</p>
        </div>

        <div className="ann-section">
          <p className="ann-section-title">📋 実行ステップ</p>
          <ol className="ann-steps">
            {result.steps.map((step, i) => (
              <li key={i} className="ann-step-item">{step}</li>
            ))}
          </ol>
        </div>

        <div className="ann-advice-bubble">
          <span className="ann-bubble-icon">💡</span>
          <p>{result.secretary_advice}</p>
        </div>

        <div className="ann-value">
          <span className="ann-value-icon">✨</span>
          <p>{result.value_summary}</p>
        </div>

        <div className="form-actions">
          <button className="btn btn--secondary" onClick={onClose} disabled={loading}>
            閉じる
          </button>
          <button
            className="btn btn--primary"
            onClick={() => onApply(result.steps)}
            disabled={loading}
          >
            {loading ? '追加中...' : 'サブタスクとして追加'}
          </button>
        </div>
      </div>
    </div>
  )
}
