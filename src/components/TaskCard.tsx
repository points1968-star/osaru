import { useState } from 'react'
import type { Task, Priority } from '../types'

interface Props {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, title: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
  onIntervene?: (task: Task) => void
}

const PRIORITY_LABELS: Record<Priority, string> = { high: '高', medium: '中', low: '低' }

const NEGLECT_DAYS = 3

function isOverdue(dueDate: string, completed: boolean): boolean {
  if (!dueDate || completed) return false
  return new Date(dueDate) < new Date(new Date().toDateString())
}

function isNeglected(updatedAt: string, completed: boolean): boolean {
  if (completed) return false
  const ms = Date.now() - new Date(updatedAt).getTime()
  return ms > NEGLECT_DAYS * 24 * 60 * 60 * 1000
}

function getDaysSince(updatedAt: string): number {
  return Math.floor((Date.now() - new Date(updatedAt).getTime()) / (24 * 60 * 60 * 1000))
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

export function TaskCard({ task, onToggle, onEdit, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask, onIntervene }: Props) {
  const [showSubtasks, setShowSubtasks] = useState(false)
  const [newSubtask, setNewSubtask] = useState('')

  const overdue = isOverdue(task.dueDate, task.completed)
  const neglected = isNeglected(task.updatedAt, task.completed)
  const daysSince = getDaysSince(task.updatedAt)
  const subtasks = task.subtasks ?? []
  const completedSubs = subtasks.filter(s => s.completed).length
  const totalSubs = subtasks.length
  const subProgress = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : 0

  function handleAddSubtask(e: React.FormEvent) {
    e.preventDefault()
    if (!newSubtask.trim()) return
    onAddSubtask(task.id, newSubtask.trim())
    setNewSubtask('')
  }

  const cardClass = [
    'card',
    task.completed ? 'card--completed' : '',
    task.frozen ? 'card--frozen' : '',
    overdue && !task.frozen ? 'card--overdue' : '',
    neglected && !task.frozen ? 'card--neglected' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={cardClass}>
      <div className="card-left">
        <button
          className={`checkbox ${task.completed ? 'checkbox--checked' : ''}`}
          onClick={() => onToggle(task.id)}
          aria-label={task.completed ? '未完了に戻す' : '完了にする'}
        >
          {task.completed && (
            <svg viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1,5 4,8 11,1" />
            </svg>
          )}
        </button>
      </div>

      <div className="card-body">
        <div className="card-header">
          <span className={`priority-badge priority-badge--${task.priority}`}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.frozen && (
            <span className="frozen-badge">❄️ Maybeリスト</span>
          )}
          {neglected && !task.frozen && (
            <span className="neglect-badge">⏰ {NEGLECT_DAYS}日以上放置中</span>
          )}
          {task.dueDate && (
            <span className={`due-date ${overdue ? 'due-date--overdue' : ''}`}>
              {overdue ? '⚠ ' : ''}期限: {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <p className={`card-title ${task.completed ? 'card-title--completed' : ''}`}>
          {task.title}
        </p>

        {task.description && (
          <p className="card-description">{task.description}</p>
        )}

        {totalSubs > 0 && (
          <div className="subtask-progress">
            <div className="subtask-progress-bar">
              <div className="subtask-progress-fill" style={{ width: `${subProgress}%` }} />
            </div>
            <span className="subtask-progress-label">{completedSubs}/{totalSubs} 完了</span>
          </div>
        )}

        <button
          className="subtask-toggle"
          onClick={() => setShowSubtasks(v => !v)}
        >
          <PlusIcon />
          サブタスク{totalSubs > 0 ? ` (${totalSubs})` : ''}
          <span className={`chevron ${showSubtasks ? 'chevron--open' : ''}`}>▾</span>
        </button>

        {showSubtasks && (
          <div className="subtask-section">
            {subtasks.map(s => (
              <div key={s.id} className="subtask-item">
                <button
                  className={`subtask-check ${s.completed ? 'subtask-check--done' : ''}`}
                  onClick={() => onToggleSubtask(task.id, s.id)}
                >
                  {s.completed && (
                    <svg viewBox="0 0 12 10" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="1,5 4,8 11,1" />
                    </svg>
                  )}
                </button>
                <span className={`subtask-title ${s.completed ? 'subtask-title--done' : ''}`}>
                  {s.title}
                </span>
                <button
                  className="subtask-delete"
                  onClick={() => onDeleteSubtask(task.id, s.id)}
                  aria-label="削除"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <form className="subtask-form" onSubmit={handleAddSubtask}>
              <input
                className="subtask-input"
                value={newSubtask}
                onChange={e => setNewSubtask(e.target.value)}
                placeholder="サブタスクを追加..."
              />
              <button type="submit" className="subtask-add-btn">追加</button>
            </form>
          </div>
        )}

        {neglected && !task.completed && !task.frozen && onIntervene && (
          <button
            className="ann-intervene-btn"
            onClick={() => onIntervene(task)}
            title={`アンに相談する（${daysSince}日停滞）`}
          >
            アンに相談 💬
          </button>
        )}
      </div>

      <div className="card-actions">
        <button
          className="icon-btn icon-btn--edit"
          onClick={() => onEdit(task)}
          aria-label="編集"
          title="編集"
        >
          <EditIcon />
        </button>
        <button
          className="icon-btn icon-btn--delete"
          onClick={() => onDelete(task.id)}
          aria-label="削除"
          title="削除"
        >
          <TrashIcon />
        </button>
      </div>
    </div>
  )
}
