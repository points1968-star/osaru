import { useState } from 'react'
import type { Task, AnnDecomposition, AnnIntervention, AnnReflection } from '../types'

type AnnResponse = AnnDecomposition | AnnIntervention | AnnReflection

async function callAnn(body: object): Promise<AnnResponse | null> {
  try {
    const res = await fetch('/api/ann', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export function useAnn() {
  const [loading, setLoading] = useState(false)

  async function decompose(task: Task): Promise<AnnDecomposition | null> {
    setLoading(true)
    const result = await callAnn({ phase: 'decomposition', task: { title: task.title, description: task.description } })
    setLoading(false)
    return result?.phase === 'decomposition' ? result : null
  }

  async function intervene(task: Task, daysSince: number): Promise<AnnIntervention | null> {
    setLoading(true)
    const result = await callAnn({ phase: 'intervention', task: { title: task.title, description: task.description }, daysSince })
    setLoading(false)
    return result?.phase === 'intervention' ? result : null
  }

  async function reflect(completedTasks: Task[]): Promise<AnnReflection | null> {
    if (completedTasks.length === 0) return null
    setLoading(true)
    const result = await callAnn({ phase: 'reflection', completedTasks: completedTasks.map(t => ({ title: t.title })) })
    setLoading(false)
    return result?.phase === 'reflection' ? result : null
  }

  return { loading, decompose, intervene, reflect }
}
