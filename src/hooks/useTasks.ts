import { useState, useEffect } from 'react'
import type { Task, Priority, Subtask } from '../types'

const STORAGE_KEY = 'task-manager-tasks'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function now(): string {
  return new Date().toISOString()
}

function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const tasks: Task[] = JSON.parse(raw)
    return tasks.map(t => ({
      ...t,
      updatedAt: t.updatedAt ?? t.createdAt,
      subtasks: t.subtasks ?? [],
    }))
  } catch {
    return []
  }
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  function addTask(data: {
    title: string
    description: string
    priority: Priority
    dueDate: string
  }) {
    const task: Task = {
      id: generateId(),
      ...data,
      completed: false,
      createdAt: now(),
      updatedAt: now(),
      subtasks: [],
    }
    setTasks(prev => [task, ...prev])
  }

  function updateTask(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>) {
    setTasks(prev =>
      prev.map(t => (t.id === id ? { ...t, ...data, updatedAt: now() } : t))
    )
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function toggleComplete(id: string) {
    setTasks(prev =>
      prev.map(t =>
        t.id === id ? { ...t, completed: !t.completed, updatedAt: now() } : t
      )
    )
  }

  function addSubtask(taskId: string, title: string) {
    const subtask: Subtask = { id: generateId(), title, completed: false }
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? { ...t, subtasks: [...t.subtasks, subtask], updatedAt: now() }
          : t
      )
    )
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    setTasks(prev =>
      prev.map(t => {
        if (t.id !== taskId) return t
        const subtasks = t.subtasks.map(s =>
          s.id === subtaskId ? { ...s, completed: !s.completed } : s
        )
        return { ...t, subtasks, updatedAt: now() }
      })
    )
  }

  function deleteSubtask(taskId: string, subtaskId: string) {
    setTasks(prev =>
      prev.map(t =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.filter(s => s.id !== subtaskId),
              updatedAt: now(),
            }
          : t
      )
    )
  }

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  }
}
