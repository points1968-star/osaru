import { useState, useEffect } from 'react'
import type { Task, Priority } from '../types'

interface Props {
  onSubmit: (data: {
    title: string
    description: string
    priority: Priority
    dueDate: string
  }) => void
  onCancel: () => void
  initial?: Task
}

const PRIORITY_LABELS: Record<Priority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

export function TaskForm({ onSubmit, onCancel, initial }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    onSubmit({ title: title.trim(), description: description.trim(), priority, dueDate })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">{initial ? 'タスクを編集' : 'タスクを追加'}</h2>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label className="label">タイトル *</label>
            <input
              className="input"
              value={title}
              onChange={e => {
                setTitle(e.target.value)
                setError('')
              }}
              placeholder="タスクのタイトル"
              autoFocus
            />
            {error && <p className="error">{error}</p>}
          </div>

          <div className="form-group">
            <label className="label">説明</label>
            <textarea
              className="textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="詳細（任意）"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label">優先度</label>
              <div className="priority-buttons">
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    className={`priority-btn priority-btn--${p} ${priority === p ? 'priority-btn--active' : ''}`}
                    onClick={() => setPriority(p)}
                  >
                    {PRIORITY_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">期限</label>
              <input
                type="date"
                className="input"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn--secondary" onClick={onCancel}>
              キャンセル
            </button>
            <button type="submit" className="btn btn--primary">
              {initial ? '更新' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
