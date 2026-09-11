import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Ellipsis,
  Folder,
  Plus,
  Trash2,
  X,
} from 'lucide-react'
import { initialTasks } from './data'
import figmaCheck from './assets/figma-check.svg'
import figmaPlus from './assets/figma-plus.svg'
import type { Priority, Project, Task } from './types'

type Screen = 'splash' | 'list' | 'details'
type Toast = { message: string; kind: 'success' | 'error' } | null

const projectColors: Record<Project, string> = {
  Личное: '#f1a64c',
  Студия: '#7b7dea',
  Маркетинг: '#67a678',
  Дизайн: '#d8789a',
}

const projectOrder: Project[] = ['Личное', 'Студия', 'Маркетинг', 'Дизайн']

function IconButton({ label, children, onClick, danger = false }: { label: string; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return <button type="button" className={`icon-button${danger ? ' danger' : ''}`} aria-label={label} onClick={onClick}>{children}</button>
}

function TaskRow({ task, onOpen, onToggle }: { task: Task; onOpen: () => void; onToggle: () => void }) {
  return (
    <article className={`task-row ${task.status === 'done' ? 'done' : ''}`}>
      <button className="check-button" aria-label={task.status === 'done' ? 'Открыть задачу' : 'Отметить выполненной'} onClick={onToggle}>
        {task.status === 'done' ? <Check size={15} strokeWidth={2.5} /> : <Circle size={21} strokeWidth={1.8} />}
      </button>
      <button className="task-main" onClick={onOpen}>
        <span className="task-title">{task.title}</span>
        <span className="task-meta">
          <span className="project-chip"><i style={{ backgroundColor: projectColors[task.project] }} />{task.project}</span>
          {task.dueDate && <span>{task.dueDate}</span>}
          {task.priority === 'Высокий' && <span className="focus-chip">#Фокус</span>}
        </span>
      </button>
    </article>
  )
}

function TaskSection({ title, tasks, onOpen, onToggle }: { title: string; tasks: Task[]; onOpen: (task: Task) => void; onToggle: (id: string) => void }) {
  if (!tasks.length) return null
  return (
    <section className="task-section">
      <div className="section-heading"><h2>{title}</h2><span>{tasks.length}</span></div>
      <div className="task-list">
        {tasks.map((task) => <TaskRow key={task.id} task={task} onOpen={() => onOpen(task)} onToggle={() => onToggle(task.id)} />)}
      </div>
    </section>
  )
}

function TaskDetails({ task, onBack, onToggle, onDelete, onMore }: { task: Task; onBack: () => void; onToggle: () => void; onDelete: () => void; onMore: () => void }) {
  return (
    <main className="screen details-screen">
      <header className="details-header">
        <IconButton label="Назад к задачам" onClick={onBack}><ArrowLeft size={20} /></IconButton>
        <h1>Задача</h1>
        <IconButton label="Дополнительные действия" onClick={onMore}><Ellipsis size={20} /></IconButton>
      </header>
      <div className="details-content">
        <section className="overview-card">
          <span className="status-label">{task.status === 'done' ? 'Выполнена' : 'В работе'}</span>
          <h2>{task.title}</h2>
          {task.description && <p>{task.description}</p>}
        </section>
        <section className="properties-card">
          <Property label="Проект"><span className="project-value"><i style={{ backgroundColor: projectColors[task.project] }} />{task.project}</span></Property>
          <Property label="Когда">{task.dueDate ? `Сегодня, ${task.dueDate}` : 'Без срока'}</Property>
          <Property label="Приоритет"><span className={task.priority === 'Высокий' ? 'priority-value high' : 'priority-value'}><i />{task.priority}</span></Property>
        </section>
      </div>
      <div className="details-actions">
        <button className={`primary-button ${task.status === 'done' ? 'completed' : ''}`} onClick={onToggle}>
          {task.status === 'done' ? <><CheckCircle2 size={20} />Вернуть в работу</> : <><img className="primary-icon" src={figmaCheck} alt="" />Завершить задачу</>}
        </button>
        <IconButton label="Удалить задачу" onClick={onDelete} danger><Trash2 size={20} /></IconButton>
      </div>
    </main>
  )
}

function Property({ label, children }: { label: string; children: ReactNode }) {
  return <div className="property"><span>{label}</span><strong>{children}</strong></div>
}

function TaskSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState<Project>('Личное')
  const [priority, setPriority] = useState<Priority>('Обычный')
  const [error, setError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!title.trim()) { setError('Введите название задачи'); return }
    onCreate({ title: title.trim(), description: description.trim() || undefined, project, priority, dueDate: '18:00' })
  }
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
      <button className="scrim" aria-label="Закрыть форму" onClick={onClose} />
      <form className="task-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <header className="sheet-header"><div><h2 id="new-task-title">Новая задача</h2><p>Добавьте главное — детали можно позже</p></div><IconButton label="Закрыть форму" onClick={onClose}><X size={18} /></IconButton></header>
        <div className="sheet-form-content">
          <label className="field"><span>НАЗВАНИЕ</span><input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="Что нужно сделать?" aria-invalid={Boolean(error)} />{error && <em>{error}</em>}</label>
          <label className="field"><span>ОПИСАНИЕ</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Добавьте заметку или контекст" /></label>
          <section className="settings-card" aria-label="Свойства задачи">
            <div className="setting"><span>Когда</span><strong>Сегодня, 18:00</strong></div>
            <label className="setting"><span>Проект</span><select value={project} onChange={(event) => setProject(event.target.value as Project)}>{projectOrder.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="setting"><span>Приоритет</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option>Обычный</option><option>Высокий</option></select></label>
          </section>
        </div>
        <button className="primary-button" type="submit"><Plus size={20} />Создать задачу</button>
      </form>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  useEffect(() => { const timeout = window.setTimeout(() => setScreen('list'), 1100); return () => window.clearTimeout(timeout) }, [])
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(null), 2800); return () => window.clearTimeout(timeout) }, [toast])
  const selectedTask = tasks.find((task) => task.id === selectedId)
  const openTasks = tasks.filter((task) => task.status === 'open')
  const doneTasks = tasks.filter((task) => task.status === 'done')
  const groups = useMemo(() => [
    ['Приоритет', openTasks.filter((task) => task.priority === 'Высокий')],
    ['Сегодня вечером', openTasks.filter((task) => task.priority !== 'Высокий' && task.project === 'Личное')],
    ['Работа', openTasks.filter((task) => task.priority !== 'Высокий' && task.project !== 'Личное')],
  ] as const, [openTasks])
  const openTask = (task: Task) => { setSelectedId(task.id); setScreen('details') }
  const toggleTask = (id: string) => setTasks((current) => current.map((task) => task.id === id ? { ...task, status: task.status === 'open' ? 'done' : 'open' } : task))
  const deleteTask = (id = selectedId) => {
    if (!id) return
    setTasks((current) => current.filter((task) => task.id !== id))
    setScreen('list'); setSelectedId(null); setToast({ message: 'Задача удалена', kind: 'success' })
  }
  const createTask = (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => {
    const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'open' }
    setTasks((current) => [newTask, ...current]); setSelectedId(newTask.id); setSheetOpen(false); setScreen('details'); setToast({ message: 'Задача создана', kind: 'success' })
  }
  if (screen === 'splash') return <div className="app-shell"><div className="workspace"><main className="screen splash"><div className="brand-mark"><Check size={50} strokeWidth={2.6} /></div><h1>Focus</h1><p>Личный трекер задач</p><div className="loading"><span /></div><small>Загружаем ваш день</small></main></div></div>
  return <div className="app-shell">
    <div className={`workspace desktop-workspace ${screen === 'details' && selectedTask ? 'has-selection' : ''}`}>
      <header className="desktop-toolbar"><div className="desktop-brand"><Check size={24} /><strong>Focus</strong><span>Личные задачи</span></div><button className="desktop-create" onClick={() => setSheetOpen(true)}><img src={figmaPlus} alt="" />Новая задача</button></header>
      <main className="screen list-screen">
      <header className="list-header"><div><h1>Сегодня</h1><p>Понедельник, 8 сентября</p></div><IconButton label="Параметры просмотра" onClick={() => setToast({ message: 'Настройки появятся позже', kind: 'error' })}><Ellipsis size={20} /></IconButton></header>
      <div className="progress-row"><div className="progress"><span style={{ width: `${tasks.length ? (doneTasks.length / tasks.length) * 100 : 0}%` }} /></div><span>Выполнено {doneTasks.length} из {tasks.length}</span></div>
      <div className="sections">{groups.map(([title, group]) => <TaskSection key={title} title={title} tasks={group} onOpen={openTask} onToggle={toggleTask} />)}<div className="desktop-completed"><TaskSection title="Выполнено" tasks={doneTasks} onOpen={openTask} onToggle={toggleTask} /></div>{tasks.length === 0 && <p className="empty-message">Пока нет задач. Создайте первую, чтобы начать.</p>}</div>
      <button className="floating-add" aria-label="Создать новую задачу" onClick={() => setSheetOpen(true)}><img src={figmaPlus} alt="" /></button>
      </main>
      {screen === 'details' && selectedTask ? <TaskDetails task={selectedTask} onBack={() => setScreen('list')} onToggle={() => toggleTask(selectedTask.id)} onDelete={() => deleteTask(selectedTask.id)} onMore={() => setToast({ message: 'Дополнительные действия появятся позже', kind: 'error' })} /> : <aside className="desktop-placeholder"><CheckCircle2 size={40} strokeWidth={1.2} /><h2>Всё начинается с одной задачи</h2><p>Выберите задачу в списке, чтобы посмотреть детали, или создайте новую.</p></aside>}
      {sheetOpen && <TaskSheet onClose={() => setSheetOpen(false)} onCreate={createTask} />}
    </div>
    {toast && <div className={`toast ${toast.kind}`} role="status">{toast.kind === 'success' ? <CheckCircle2 size={18} /> : <Folder size={18} />}{toast.message}</div>}
  </div>
}

export default App
