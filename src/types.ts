export type Project = 'Личное' | 'Студия' | 'Маркетинг' | 'Дизайн'
export type Priority = 'Высокий' | 'Обычный'

export interface Task {
  id: string
  title: string
  description?: string
  project: Project
  dueDate?: string
  priority: Priority
  status: 'open' | 'done'
  createdAt: string
}
