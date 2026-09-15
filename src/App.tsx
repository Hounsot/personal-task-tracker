import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
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
  Sparkles,
} from 'lucide-react'
import { listTasks, saveTask, setTaskStatus, removeTask, supabase } from './api'
import { Auth } from './Auth'
import { Assistant } from './Assistant'
import { AnalyticsConsent } from './AnalyticsConsent'
import { markTaskWorkStarted, timeToCompleteSeconds, trackEvent } from './analytics'
import figmaCheck from './assets/figma-check.svg'
import figmaPlus from './assets/figma-plus.svg'
import type { Priority, Project, Task } from './types'

type Screen = 'splash' | 'list' | 'details'
type Toast = { message: string; kind: 'success' | 'error' } | null
const formatDue = (date: string) => new Date(date).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

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
          {task.dueDate && <span>{formatDue(task.dueDate)}</span>}
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
        <IconButton label="Обсудить задачу с ИИ" onClick={onMore}><Sparkles size={20} /></IconButton>
      </header>
      <div className="details-content">
        <section className="overview-card">
          <span className="status-label">{task.status === 'done' ? 'Выполнена' : 'В работе'}</span>
          <h2>{task.title}</h2>
          {task.description && <p>{task.description}</p>}
        </section>
        <section className="properties-card">
          <Property label="Проект"><span className="project-value"><i style={{ backgroundColor: projectColors[task.project] }} />{task.project}</span></Property>
          <Property label="Когда">{task.dueDate ? formatDue(task.dueDate) : 'Без срока'}</Property>
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

function TaskSheet({ onClose, onCreate }: { onClose: () => void; onCreate: (task: Omit<Task, 'id' | 'createdAt' | 'status'>, id: string) => Promise<void> }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [project, setProject] = useState<Project>('Личное')
  const [priority, setPriority] = useState<Priority>('Обычный')
  const [error, setError] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [pending, setPending] = useState(false)
  const [id] = useState(() => crypto.randomUUID())
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (pending) return
    if (!title.trim()) { setError('Введите название задачи'); return }
    setPending(true)
    try { await onCreate({ title: title.trim(), description: description.trim() || undefined, project, priority, dueDate: dueDate ? new Date(dueDate).toISOString() : undefined }, id) }
    catch { setError('Не удалось сохранить задачу. Проверьте соединение и повторите попытку.') }
    finally { setPending(false) }
  }
  return (
    <div className="sheet-layer" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
      <button className="scrim" aria-label="Закрыть форму" onClick={() => { if (!pending) onClose() }} />
      <form className="task-sheet" onSubmit={submit}>
        <div className="sheet-handle" />
        <header className="sheet-header"><div><h2 id="new-task-title">Новая задача</h2><p>Добавьте главное — детали можно позже</p></div><IconButton label="Закрыть форму" onClick={() => { if (!pending) onClose() }}><X size={18} /></IconButton></header>
        <div className="sheet-form-content">
          <label className="field"><span>НАЗВАНИЕ</span><input autoFocus value={title} onChange={(event) => { setTitle(event.target.value); setError('') }} placeholder="Что нужно сделать?" aria-invalid={Boolean(error)} />{error && <em>{error}</em>}</label>
          <label className="field"><span>ОПИСАНИЕ</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Добавьте заметку или контекст" /></label>
          <section className="settings-card" aria-label="Свойства задачи">
            <label className="field"><span>КОГДА (НЕОБЯЗАТЕЛЬНО)</span><input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label>
            <label className="setting"><span>Проект</span><select value={project} onChange={(event) => setProject(event.target.value as Project)}>{projectOrder.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="setting"><span>Приоритет</span><select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}><option>Обычный</option><option>Высокий</option></select></label>
          </section>
        </div>
        <button className="primary-button" type="submit" disabled={pending}><Plus size={20} />{pending ? 'Сохраняем…' : 'Создать задачу'}</button>
      </form>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('splash')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const busy = useRef(false)
  const generation = useRef(0)
  const [saving, setSaving] = useState(false)
  async function refresh() {
    if (busy.current) return
    const current = ++generation.current
    try {
      const loaded = await listTasks()
      if (current === generation.current) { setTasks(loaded); setLoadError('') }
    } catch { if (current === generation.current) setLoadError('Не удалось обновить задачи. Проверьте соединение.') }
    finally { if (current === generation.current) setLoading(false) }
  }
  useEffect(() => {
    void refresh()
    const sync = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = window.setInterval(sync, 15000)
    window.addEventListener('focus', sync)
    window.addEventListener('online', sync)
    return () => { generation.current++; window.clearInterval(timer); window.removeEventListener('focus', sync); window.removeEventListener('online', sync) }
  }, [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [toast, setToast] = useState<Toast>(null)
  useEffect(() => { const timeout = window.setTimeout(() => setScreen('list'), 1100); return () => window.clearTimeout(timeout) }, [])
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(null), 2800); return () => window.clearTimeout(timeout) }, [toast])
  const selectedTask = tasks.find((task) => task.id === selectedId)
  const openTasks = tasks.filter((task) => task.status === 'open')
  const doneTasks = tasks.filter((task) => task.status === 'done')
  const groups = useMemo(() => [
    ['Приоритет', openTasks.filter((task) => task.priority === 'Высокий')],
    ['Личное', openTasks.filter((task) => task.priority !== 'Высокий' && task.project === 'Личное')],
    ['Работа', openTasks.filter((task) => task.priority !== 'Высокий' && task.project !== 'Личное')],
  ] as const, [openTasks])
  const openTask = (task: Task) => {
    if (task.status === 'open') markTaskWorkStarted(task.id)
    setSelectedId(task.id); setScreen('details')
  }
  const openAssistant = () => { trackEvent('ai_assistant_opened'); setAssistantOpen(true) }
  async function mutate(action: () => Promise<void>) {
    if (busy.current) return
    busy.current = true; generation.current++; setSaving(true)
    try { await action() }
    catch { setToast({ message: 'Изменения не подтверждены. Обновите список и повторите попытку.', kind: 'error' }) }
    finally { busy.current = false; setSaving(false); void refresh() }
  }
  const toggleTask = (id: string) => mutate(async () => {
    const task = tasks.find(item => item.id === id)
    if (!task) return
    const saved = await setTaskStatus(id, task.status === 'open' ? 'done' : 'open')
    setTasks(current => current.map(item => item.id === id ? saved : item))
    if (saved.status === 'done') trackEvent('task_completed', { time_to_complete_seconds: timeToCompleteSeconds(task.id, task.createdAt), time_basis: 'first_open_or_created' })
  })
  const deleteTask = (id = selectedId) => mutate(async () => {
    if (!id) return
    await removeTask(id)
    setTasks((current) => current.filter((task) => task.id !== id))
    setScreen('list'); setSelectedId(null); setToast({ message: 'Задача удалена', kind: 'success' })
  })
  const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'status'>, id: string) => {
    if (busy.current) throw new Error('Подождите завершения сохранения')
    busy.current = true; generation.current++
    try {
    const newTask = await saveTask(task, id)
    trackEvent('task_created', { source: 'form' })
    setTasks((current) => [newTask, ...current]); setSelectedId(newTask.id); setSheetOpen(false); setScreen('details'); setToast({ message: 'Задача создана', kind: 'success' })
    } finally { busy.current = false; void refresh() }
  }
  if (screen === 'splash') return <div className="app-shell"><div className="workspace"><main className="screen splash"><div className="brand-mark"><Check size={50} strokeWidth={2.6} /></div><h1>Focus</h1><p>Личный трекер задач</p><div className="loading"><span /></div><small>Загружаем ваш день</small></main></div></div>
  return <div className="app-shell">
    <div className={`workspace desktop-workspace ${screen === 'details' && selectedTask ? 'has-selection' : ''}`}>
      <header className="desktop-toolbar"><div className="desktop-brand"><Check size={24} /><strong>Focus</strong><span>Личные задачи</span></div><button className="desktop-create" onClick={() => setSheetOpen(true)}><img src={figmaPlus} alt="" />Новая задача</button></header>
      <main className="screen list-screen">
      <header className="list-header"><div><h1>Мои задачи</h1><p>{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p></div><button className="auth-switch" disabled={saving} onClick={async () => { const result = await supabase!.auth.signOut(); if (result.error) setToast({ message: 'Не удалось выйти. Повторите попытку.', kind: 'error' }) }}>Выйти</button></header>
      {loading && <p className="sync-state" role="status">Загружаем задачи…</p>}
      {saving && <p className="sync-state" role="status">Сохраняем…</p>}
      {loadError && <div className="sync-state" role="alert">{loadError} <button onClick={() => void refresh()}>Повторить</button></div>}
      <button className="assistant-launch" onClick={openAssistant}><Sparkles size={19} /><span>ИИ-ассистент<small>Поможет с задачами</small></span><span className="assistant-beta">Бета</span></button>
      <div className="progress-row"><div className="progress"><span style={{ width: `${tasks.length ? (doneTasks.length / tasks.length) * 100 : 0}%` }} /></div><span>Выполнено {doneTasks.length} из {tasks.length}</span></div>
      <div className="sections">{groups.map(([title, group]) => <TaskSection key={title} title={title} tasks={group} onOpen={openTask} onToggle={toggleTask} />)}<div className="completed-tasks"><TaskSection title="Выполнено" tasks={doneTasks} onOpen={openTask} onToggle={toggleTask} /></div>{!loading && !loadError && tasks.length === 0 && <p className="empty-message">Пока нет задач. Создайте первую, чтобы начать.</p>}</div>
      <button className="floating-add" aria-label="Создать новую задачу" onClick={() => setSheetOpen(true)}><img src={figmaPlus} alt="" /></button>
      </main>
      {screen === 'details' && selectedTask ? <TaskDetails task={selectedTask} onBack={() => setScreen('list')} onToggle={() => toggleTask(selectedTask.id)} onDelete={() => deleteTask(selectedTask.id)} onMore={openAssistant} /> : <aside className="desktop-placeholder"><CheckCircle2 size={40} strokeWidth={1.2} /><h2>Всё начинается с одной задачи</h2><p>Выберите задачу в списке, чтобы посмотреть детали, или создайте новую.</p></aside>}
      {sheetOpen && <TaskSheet onClose={() => setSheetOpen(false)} onCreate={createTask} />}
      {assistantOpen && <Assistant task={screen === 'details' ? selectedTask : undefined} onClose={() => setAssistantOpen(false)} onChanged={() => void refresh()} />}
    </div>
    {toast && <div className={`toast ${toast.kind}`} role="status">{toast.kind === 'success' ? <CheckCircle2 size={18} /> : <Folder size={18} />}{toast.message}</div>}
  </div>
}

export default function Root() { return <><AnalyticsConsent /><Auth>{userId => <App key={userId} />}</Auth></> }
