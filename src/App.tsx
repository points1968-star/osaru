import { useState, useMemo, useCallback } from 'react'
import { useTasks } from './hooks/useTasks'
import { useAuth } from './hooks/useAuth'
import { TaskList } from './components/TaskList'
import { TaskForm } from './components/TaskForm'
import { FilterBar } from './components/FilterBar'
import { Toast, pickMessage } from './components/Toast'
import { Auth } from './components/Auth'
import { supabase } from './lib/supabase'
import type { Task, FilterState, Priority } from './types'
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
  const { tasks, loadingTasks, addTask, updateTask, deleteTask, toggleComplete, addSubtask, toggleSubtask, deleteSubtask } = useTasks(user)
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null)

  const neglectedTasks = useMemo(
    () => tasks.filter(t => !t.completed && Date.now() - new Date(t.updatedAt).getTime() > NEGLECT_MS),
    [tasks]
  )

  const filtered = useMemo(() => {
    let list = [...tasks]
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

  function handleAdd(data: { title: string; description: string; priority: Priority; dueDate: string }) {
    addTask(data)
    setShowForm(false)
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

  const clearToast = useCallback(() => setToast(null), [])

  const activeCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks])
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks])
  const completionRate = useMemo(
    () => tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0,
    [tasks, completedCount]
  )

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
          totalCount={tasks.length}
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
          />
        )}
      </main>

      {showForm && (
        <TaskForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      {editingTask && (
        <TaskForm initial={editingTask} onSubmit={handleEdit} onCancel={() => setEditingTask(null)} />
      )}

      {toast && (
        <Toast key={toast.key} message={toast.message} onDone={clearToast} />
      )}
    </div>
  )
}
