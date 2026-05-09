export type Priority = 'high' | 'medium' | 'low'

export type Status = 'all' | 'active' | 'completed'

export interface Subtask {
  id: string
  title: string
  completed: boolean
}

export interface Task {
  id: string
  title: string
  description: string
  priority: Priority
  dueDate: string
  completed: boolean
  frozen: boolean
  createdAt: string
  updatedAt: string
  subtasks: Subtask[]
}

export interface FilterState {
  status: Status
  priority: Priority | 'all'
  sortBy: 'createdAt' | 'dueDate' | 'priority'
}

export interface AnnDecomposition {
  phase: 'decomposition'
  first_step: string
  steps: string[]
  secretary_advice: string
  value_summary: string
}

export interface AnnIntervention {
  phase: 'intervention'
  recommendation: 'redecompose' | 'freeze' | 'delete'
  reason: string
  new_steps?: string[]
}

export interface AnnReflection {
  phase: 'reflection'
  narrative: string
  advice: string
}
