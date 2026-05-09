import { useState } from 'react'
import type { Task, AnnIntervention } from '../types'
import { useAnn } from '../hooks/useAnn'

interface Props {
  task: Task
  daysSince: number
  onRedecompose: (taskId: string, steps: string[]) => void
  onFreeze: (taskId: string) => void
  onDelete: (taskId: string) => void
  onClose: () => void
}

export function InterventionDialog({ task, daysSince, onRedecompose, onFreeze, onDelete, onClose }: Props) {
  const { loading, intervene } = useAnn()
  const [result, setResult] = useState<AnnIntervention | null>(null)
  const [asked, setAsked] = useState(false)

  async function handleAsk() {
    setAsked(true)
    const res = await intervene(task, daysSince)
    setResult(res)
  }

  const LABELS: Record<string, string> = {
    redecompose: '🔄 再分解する',
    freeze: '❄️ 一時凍結（Maybeリスト）',
    delete: '🗑️ 削除する（目的喪失）',
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal ann-modal" onClick={e => e.stopPropagation()}>
        <div className="ann-header">
          <span className="ann-avatar">アン</span>
          <div>
            <p className="ann-label">外科的処置の提案</p>
            <p className="ann-name">停滞タスクの対処</p>
          </div>
        </div>

        <div className="ann-intervention-task">
          <p className="ann-stagnant-label">⏰ {daysSince}日間停滞中</p>
          <p className="ann-task-title">「{task.title}」</p>
        </div>

        {!asked ? (
          <>
            <p className="ann-intervention-desc">
              アンがこのタスクの状況を分析し、最適な対処法を提案します。
            </p>
            <div className="form-actions">
              <button className="btn btn--secondary" onClick={onClose}>キャンセル</button>
              <button className="btn btn--primary" onClick={handleAsk}>アンに相談する</button>
            </div>
          </>
        ) : loading ? (
          <div className="ann-loading">
            <div className="loading-spinner" />
            <p>アンが分析中...</p>
          </div>
        ) : result ? (
          <>
            <div className="ann-advice-bubble">
              <span className="ann-bubble-icon">💬</span>
              <p>{result.reason}</p>
            </div>

            {result.recommendation === 'redecompose' && result.new_steps && result.new_steps.length > 0 && (
              <div className="ann-section">
                <p className="ann-section-title">📋 提案ステップ</p>
                <ol className="ann-steps">
                  {result.new_steps.map((s, i) => <li key={i} className="ann-step-item">{s}</li>)}
                </ol>
              </div>
            )}

            <p className="ann-recommendation-label">
              推奨アクション: <strong>{LABELS[result.recommendation]}</strong>
            </p>

            <div className="ann-action-buttons">
              <button className="btn btn--secondary" onClick={onClose}>閉じる</button>
              {result.recommendation === 'redecompose' && result.new_steps && (
                <button className="btn btn--primary" onClick={() => onRedecompose(task.id, result.new_steps!)}>
                  再分解を適用
                </button>
              )}
              {result.recommendation === 'freeze' && (
                <button className="btn btn--freeze" onClick={() => onFreeze(task.id)}>
                  Maybeリストへ移動
                </button>
              )}
              {result.recommendation === 'delete' && (
                <button className="btn btn--danger" onClick={() => onDelete(task.id)}>
                  タスクを削除
                </button>
              )}
            </div>
          </>
        ) : (
          <p className="ann-error">分析に失敗しました。もう一度お試しください。</p>
        )}
      </div>
    </div>
  )
}
