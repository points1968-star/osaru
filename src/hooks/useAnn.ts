import { useState } from 'react'
import type { Task, AnnDecomposition, AnnIntervention, AnnReflection } from '../types'

type AnnResponse = AnnDecomposition | AnnIntervention | AnnReflection

async function callAnn(body: object): Promise<AnnResponse | string> {
  try {
    const res = await fetch('/api/ann', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      return data.error ?? `HTTP ${res.status}`
    }
    return await res.json()
  } catch (err) {
    return err instanceof Error ? err.message : 'ネットワークエラー'
  }
}

export function useAnn() {
  const [loading, setLoading] = useState(false)

  async function decompose(task: Task): Promise<AnnDecomposition | string> {
    setLoading(true)
    const result = await callAnn({ phase: 'decomposition', task: { title: task.title, description: task.description } })
    setLoading(false)
    if (typeof result === 'string') return result
    return result?.phase === 'decomposition' ? result : '予期しないレスポンス形式'
  }

  async function intervene(task: Task, daysSince: number): Promise<AnnIntervention | string> {
    setLoading(true)
    const result = await callAnn({ phase: 'intervention', task: { title: task.title, description: task.description }, daysSince })
    setLoading(false)
    if (typeof result === 'string') return result
    return result?.phase === 'intervention' ? result : '予期しないレスポンス形式'
  }

  async function reflect(completedTasks: Task[]): Promise<AnnReflection | string> {
    if (completedTasks.length === 0) return 'タスクがありません'
    setLoading(true)
    const result = await callAnn({ phase: 'reflection', completedTasks: completedTasks.map(t => ({ title: t.title })) })
    setLoading(false)
    if (typeof result === 'string') return result
    return result?.phase === 'reflection' ? result : '予期しないレスポンス形式'
  }

  return { loading, decompose, intervene, reflect }
}
