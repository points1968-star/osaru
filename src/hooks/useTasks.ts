import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Task, Priority } from '../types'
import { supabase } from '../lib/supabase'

type DbTask = {
  id: string
  user_id: string
  title: string
  description: string
  priority: string
  due_date: string
  completed: boolean
  created_at: string
  updated_at: string
  subtasks: { id: string; title: string; completed: boolean }[]
}

function dbToTask(row: DbTask): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority as Priority,
    dueDate: row.due_date,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subtasks: (row.subtasks ?? []).map(s => ({
      id: s.id,
      title: s.title,
      completed: s.completed,
    })),
  }
}

function now(): string {
  return new Date().toISOString()
}

export function useTasks(user: User | null) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  const fetchTasks = useCallback(async () => {
    if (!user) { setTasks([]); setLoadingTasks(false); return }
    setLoadingTasks(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*, subtasks(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (!error && data) setTasks(data.map(dbToTask))
    setLoadingTasks(false)
  }, [user])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  // Real-time subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtasks' }, fetchTasks)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, fetchTasks])

  async function addTask(data: {
    title: string
    description: string
    priority: Priority
    dueDate: string
  }) {
    if (!user) return
    const { data: row, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.dueDate,
        completed: false,
        created_at: now(),
        updated_at: now(),
      })
      .select('*, subtasks(*)')
      .single()
    if (!error && row) setTasks(prev => [dbToTask(row), ...prev])
  }

  async function updateTask(id: string, data: { title: string; description: string; priority: Priority; dueDate: string }) {
    const { data: row, error } = await supabase
      .from('tasks')
      .update({
        title: data.title,
        description: data.description,
        priority: data.priority,
        due_date: data.dueDate,
        updated_at: now(),
      })
      .eq('id', id)
      .select('*, subtasks(*)')
      .single()
    if (!error && row) setTasks(prev => prev.map(t => t.id === id ? dbToTask(row) : t))
  }

  async function deleteTask(id: string) {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (!error) setTasks(prev => prev.filter(t => t.id !== id))
  }

  async function toggleComplete(id: string) {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const { data: row, error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed, updated_at: now() })
      .eq('id', id)
      .select('*, subtasks(*)')
      .single()
    if (!error && row) setTasks(prev => prev.map(t => t.id === id ? dbToTask(row) : t))
  }

  async function addSubtask(taskId: string, title: string) {
    const { data: row, error } = await supabase
      .from('subtasks')
      .insert({ task_id: taskId, title, completed: false })
      .select()
      .single()
    if (!error && row) {
      await supabase.from('tasks').update({ updated_at: now() }).eq('id', taskId)
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, subtasks: [...t.subtasks, { id: row.id, title: row.title, completed: row.completed }], updatedAt: now() }
            : t
        )
      )
    }
  }

  async function toggleSubtask(taskId: string, subtaskId: string) {
    const task = tasks.find(t => t.id === taskId)
    const sub = task?.subtasks.find(s => s.id === subtaskId)
    if (!sub) return
    const { error } = await supabase
      .from('subtasks')
      .update({ completed: !sub.completed })
      .eq('id', subtaskId)
    if (!error) {
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) }
            : t
        )
      )
    }
  }

  async function deleteSubtask(taskId: string, subtaskId: string) {
    const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId)
    if (!error) {
      await supabase.from('tasks').update({ updated_at: now() }).eq('id', taskId)
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId), updatedAt: now() }
            : t
        )
      )
    }
  }

  return {
    tasks,
    loadingTasks,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  }
}
