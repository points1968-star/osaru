import { useState, useMemo, useCallback } from 'react'
import { useTasks } from './hooks/useTasks'
import { useAuth } from './hooks/useAuth'
import { useAnn } from './hooks/useAnn'
import { TaskList } from './components/TaskList'
import { TaskForm } from './components/TaskForm'
import { FilterBar } from './components/FilterBar'
import { Toast, pickMessage } from './components/Toast'
import { Auth } from './components/Auth'
import { DecompositionModal } from './components/DecompositionModal'
import { InterventionDialog } from './components/InterventionDialog'
import { DailySummary } from './components/DailySummary'
import { supabase } from './lib/supabase'
import type { Task, FilterState, Priority, AnnDecomposition } from './types'
import './App.css'

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 }
const NEGLECT_MS = 3 * 24 * 60 * 60 * 1000

const DEFAULT_FILTER: FilterState = {
  status: 'all',
  priority: 'all',
  sortBy: 'createdAt',
}

export default function App() {
  const { user, loading: authLoading } = useAuth()
  const { tasks, loadingTasks, addTask, updateTask, deleteTask, toggleComplete, freezeTask, addSubtask, toggleSubtask, deleteSubtask } = useTasks(user)
  const { loading: annLoading, decompose } = useAnn()

  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)

  // Ann states
  const [decompositionResult, setDecompositionResult] = useState<{ task: Task; result: AnnDecomposition } | null>(null)
  const [interventionTask, setInterventionTask] = useState<Task | null>(null)
  const [showDailySummary, setShowDailySummary] = useState(false)

  const neglectedTasks = useMemo(
    () => tasks.filter(t => !t.completed && !t.frozen && Date.now() - new Date(t.updatedAt).getTime() > NEGLECT_MS),
    [tasks]
  )

  const filtered = useMemo(() => {
    let list = tasks.filter(t => !t.frozen)
    if (filter.status === 'active') list = list.filter(t => !t.completed)
    if (filter.status === 'completed') list = list.filter(t => t.completed)
    if (filter.priority !== 'all') list = list.filter(t => t.priority === filter.priority)
    list.sort((a, b) => {
      if (filter.sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      if (filter.sortBy === 'dueDate') {
        if (!a.dueDate && !b.dueDate) return 0
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return a.dueDate.localeCompare(b.dueDate)
      }
      return b.createdAt.localeCompare(a.createdAt)
    })
    return list
  }, [tasks, filter])

  const frozenTasks = useMemo(() => tasks.filter(t => t.frozen), [tasks])

  async function handleAdd(data: { title: string; description: string; priority: Priority; dueDate: string }) {
    const savedTask = await addTask(data)
    setShowForm(false)
    if (!savedTask) return

    setToast({ message: '🤔 アンが分析中...', key: Date.now() })
    const result = await decompose(savedTask)
    setToast(null)

    if (result) {
      setDecompositionResult({ task: savedTask, result })
    } else {
      setToast({ message: '💬 アンへの接続に失敗しました', key: Date.now() })
    }
  }

  function handleEdit(data: { title: string; description: string; priority: Priority; dueDate: string }) {
    if (!editingTask) return
    updateTask(editingTask.id, data)
    setEditingTask(null)
  }

  function handleDeleteConfirm(id: string) {
    if (window.confirm('このタスクを削除しますか？')) deleteTask(id)
  }

  async function handleToggle(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const willComplete = !task.completed
    await toggleComplete(id)
    if (willComplete) {
      setToast({ message: pickMessage(task.priority), key: Date.now() })
    }
  }

  async function handleApplyDecomposition(steps: string[]) {
    if (!decompositionResult) return
    for (const step of steps) {
      await addSubtask(decompositionResult.task.id, step)
    }
    setDecompositionResult(null)
  }

  async function handleRedecompose(taskId: string, steps: string[]) {
    for (const step of steps) {
      await addSubtask(taskId, step)
    }
    setInterventionTask(null)
  }

  async function handleFreeze(taskId: string) {
    await freezeTask(taskId)
    setInterventionTask(null)
  }

  async function handleInterventionDelete(taskId: string) {
    if (window.confirm('このタスクを削除しますか？')) {
      await deleteTask(taskId)
      setInterventionTask(null)
    }
  }

  const getDaysSince = (t: Task) =>
    Math.floor((Date.now() - new Date(t.updatedAt).getTime()) / (24 * 60 * 60 * 1000))

  const clearToast = useCallback(() => setToast(null), [])

  const activeCount = useMemo(() => tasks.filter(t => !t.completed && !t.frozen).length, [tasks])
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks])
  const completionRate = useMemo(() => {
    const total = tasks.filter(t => !t.frozen).length
    return total > 0 ? Math.round((completedCount / total) * 100) : 0
  }, [tasks, completedCount])

  const completedToday = useMemo(() => {
    const today = new Date().toDateString()
    return tasks.filter(t => t.completed && new Date(t.updatedAt).toDateString() === today)
  }, [tasks])

  if (authLoading) {
    return <div className="loading-screen"><div className="loading-spinner" /></div>
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <h1 className="header-title">タスク管理</h1>
          <div className="progress-wrap">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${completionRate}%` }} />
            </div>
            <span className="progress-label">{completionRate}% 完了</span>
          </div>
        </div>
        <div className="header-right">
          {completedToday.length > 0 && (
            <button className="btn btn--reflection" onClick={() => setShowDailySummary(true)}>
              📊 今日の振り返り
            </button>
          )}
          <span className="user-email">{user.email}</span>
          <button className="btn btn--secondary" onClick={() => supabase.auth.signOut()}>
            ログアウト
          </button>
          <button className="btn btn--primary" onClick={() => setShowForm(true)}>
            + タスクを追加
          </button>
        </div>
      </header>

      {neglectedTasks.length > 0 && (
        <div className="neglect-banner">
          <span className="neglect-banner-icon">⏰</span>
          <strong>{neglectedTasks.length}件のタスク</strong>が3日以上放置されています
          <button
            className="neglect-banner-btn"
            onClick={() => setFilter({ ...DEFAULT_FILTER, status: 'active', sortBy: 'createdAt' })}
          >
            確認する
          </button>
        </div>
      )}

      <main className="main">
        <FilterBar
          filter={filter}
          onChange={setFilter}
          totalCount={tasks.filter(t => !t.frozen).length}
          activeCount={activeCount}
          completedCount={completedCount}
        />

        {loadingTasks ? (
          <div className="loading-tasks"><div className="loading-spinner" /></div>
        ) : (
          <TaskList
            tasks={filtered}
            onToggle={handleToggle}
            onEdit={task => setEditingTask(task)}
            onDelete={handleDeleteConfirm}
            onAddSubtask={addSubtask}
            onToggleSubtask={toggleSubtask}
            onDeleteSubtask={deleteSubtask}
            onIntervene={task => setInterventionTask(task)}
          />
        )}

        {frozenTasks.length > 0 && (
          <div className="maybe-section">
            <h2 className="maybe-title">❄️ Maybeリスト（{frozenTasks.length}件）</h2>
            <TaskList
              tasks={frozenTasks}
              onToggle={handleToggle}
              onEdit={task => setEditingTask(task)}
              onDelete={handleDeleteConfirm}
              onAddSubtask={addSubtask}
              onToggleSubtask={toggleSubtask}
              onDeleteSubtask={deleteSubtask}
            />
          </div>
        )}
      </main>

      {showForm && (
        <TaskForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {editingTask && (
        <TaskForm initial={editingTask} onSubmit={handleEdit} onCancel={() => setEditingTask(null)} />
      )}

      {decompositionResult && (
        <DecompositionModal
          result={decompositionResult.result}
          loading={annLoading}
          onApply={handleApplyDecomposition}
          onClose={() => setDecompositionResult(null)}
        />
      )}

      {interventionTask && (
        <InterventionDialog
          task={interventionTask}
          daysSince={getDaysSince(interventionTask)}
          onRedecompose={handleRedecompose}
          onFreeze={handleFreeze}
          onDelete={handleInterventionDelete}
          onClose={() => setInterventionTask(null)}
        />
      )}

      {showDailySummary && (
        <DailySummary
          completedToday={completedToday}
          onClose={() => setShowDailySummary(false)}
        />
      )}

      {toast && (
        <Toast key={toast.key} message={toast.message} onDone={clearToast} />
      )}
    </div>
  )
}
