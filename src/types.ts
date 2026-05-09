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
  createdAt: string
  updatedAt: string
  subtasks: Subtask[]
}

export interface FilterState {
  status: Status
  priority: Priority | 'all'
  sortBy: 'createdAt' | 'dueDate' | 'priority'
}
