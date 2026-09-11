import type { Task } from './types'

export const initialTasks: Task[] = [
  {
    id: 'quarter-story',
    title: 'Составить план повествования продукта за 3-й квартал',
    description: 'Подготовить ясную структуру истории и ключевые тезисы для презентации команды.',
    project: 'Студия',
    dueDate: '10:30',
    priority: 'Высокий',
    status: 'open',
    createdAt: '2026-09-08T08:30:00.000Z',
  },
  {
    id: 'maya-research',
    title: 'Ответить Майе по исследованию',
    description: 'Собрать комментарии и отправить короткое сообщение.',
    project: 'Личное',
    dueDate: '14:00',
    priority: 'Высокий',
    status: 'open',
    createdAt: '2026-09-08T09:00:00.000Z',
  },
  {
    id: 'dentist',
    title: 'Записаться к стоматологу',
    project: 'Личное',
    priority: 'Обычный',
    status: 'done',
    createdAt: '2026-09-08T09:30:00.000Z',
  },
  {
    id: 'release-notes',
    title: 'Подготовить список изменений для версии 2.4',
    project: 'Маркетинг',
    priority: 'Обычный',
    status: 'open',
    createdAt: '2026-09-08T10:00:00.000Z',
  },
  {
    id: 'empty-states',
    title: 'Согласовать с дизайном пустые состояния',
    project: 'Дизайн',
    dueDate: '15:00',
    priority: 'Обычный',
    status: 'open',
    createdAt: '2026-09-08T10:30:00.000Z',
  },
]
