import type { Task } from '../types'
import { TaskCard } from './TaskCard'

interface Props {
  tasks: Task[]
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onAddSubtask: (taskId: string, title: string) => void
  onToggleSubtask: (taskId: string, subtaskId: string) => void
  onDeleteSubtask: (taskId: string, subtaskId: string) => void
}

export function TaskList({ tasks, onToggle, onEdit, onDelete, onAddSubtask, onToggleSubtask, onDeleteSubtask }: Props) {
  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p className="empty-text">タスクがありません</p>
      </div>
    )
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubtask={onAddSubtask}
          onToggleSubtask={onToggleSubtask}
          onDeleteSubtask={onDeleteSubtask}
        />
      ))}
    </div>
  )
}
