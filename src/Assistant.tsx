import { useEffect, useRef, useState } from 'react'
import { Sparkles, X, ArrowUp } from 'lucide-react'
import type { Task } from './types'
import { supabase, saveTask, editTask, removeTask, type NewTask } from './api'
type Proposal = { action: 'create' | 'update' | 'delete'; taskId: string; title: string; changes: Partial<NewTask> }

export function Assistant({ task, onClose, onChanged }: { task?: Task; onClose: () => void; onChanged: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const lock = useRef(false)
  async function send() {
    if (lock.current || !draft.trim()) return
    lock.current = true; setPending(true); setProposal(null); setMessage('')
    try {
      const { data, error } = await supabase!.functions.invoke('task-assistant', { body: { message: draft, selectedTaskId: task?.id, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, signal: AbortSignal.timeout(55000) })
      if (error) throw error
      setProposal(data.proposal || null)
      setMessage(data.proposal ? 'Проверьте предложенное действие перед применением.' : data.message)
    } catch { setMessage('Не удалось связаться с ассистентом. Возможно, подключение ещё не настроено. Задачи не изменены.') }
    finally { lock.current = false; setPending(false) }
  }
  async function apply() {
    if (!proposal || lock.current) return
    lock.current = true; setPending(true)
    try {
      if (proposal.action === 'create') await saveTask(proposal.changes as NewTask, proposal.taskId)
      if (proposal.action === 'update') await editTask(proposal.taskId, proposal.changes)
      if (proposal.action === 'delete') await removeTask(proposal.taskId)
      setProposal(null); setDraft(''); setMessage('Готово. Изменение сохранено.'); onChanged()
    } catch { setMessage('Сохранение не подтверждено. Проверьте список задач перед повторной попыткой.'); onChanged() }
    finally { lock.current = false; setPending(false) }
  }
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])
  const examples = task
    ? ['Перенеси эту задачу на завтра в 10:00', 'Сделай эту задачу приоритетной', 'Удали эту задачу']
    : ['Добавь задачу: подготовить презентацию завтра к 12:00', 'Переименуй задачу про презентацию', 'Удали задачу про презентацию']
  return <dialog ref={dialog} className="assistant-dialog" aria-labelledby="assistant-title" onCancel={event => { if (pending) event.preventDefault(); else onClose() }} onClick={event => { if (!pending && event.target === event.currentTarget) onClose() }}>
    <section className="assistant-panel">
      <header className="assistant-header"><div className="assistant-identity"><span className="assistant-mark"><Sparkles size={22} /></span><div><h2 id="assistant-title">ИИ-ассистент</h2><p>Помощь с вашими задачами</p></div></div><button disabled={pending} className="icon-button" onClick={onClose} aria-label="Закрыть ассистента"><X size={18} /></button></header>
      <div className="assistant-body">
        {task && <div className="assistant-context"><small>ОТКРЫТАЯ ЗАДАЧА</small><strong>{task.title}</strong></div>}
        <h3>Что нужно сделать?</h3><p>Попросите создать задачу, изменить название или срок либо удалить задачу. Перед применением вы увидите предложение.</p>
        <div className="assistant-examples">{examples.map(example => <button key={example} onClick={() => { setDraft(example); input.current?.focus() }}>{example}</button>)}</div>
        <div className="assistant-notice" role="status"><strong>{pending ? 'Подождите…' : 'Вы управляете изменениями'}</strong><p>{message || 'Каждая команда применяется только после вашего подтверждения. История диалога не сохраняется; каждый запрос должен содержать полную команду.'}</p></div>
        {proposal && <section className="assistant-proposal"><h3>{proposal.action === 'create' ? 'Создать задачу' : proposal.action === 'update' ? 'Изменить задачу' : 'Удалить задачу'}</h3><strong>{proposal.title}</strong><dl>{Object.entries(proposal.changes).map(([key, value]) => <div key={key}><dt>{{ title: 'Название', description: 'Описание', project: 'Проект', priority: 'Приоритет', dueDate: 'Срок' }[key] || key}</dt><dd>{key === 'dueDate' ? new Date(value!).toLocaleString('ru-RU') : value}</dd></div>)}</dl><button className="primary-button" disabled={pending} onClick={() => void apply()}>{proposal.action === 'delete' ? 'Подтвердить удаление' : 'Применить'}</button><button className="auth-switch" disabled={pending} onClick={() => setProposal(null)}>Отменить</button></section>}
      </div>
      <footer className="assistant-composer"><label htmlFor="assistant-prompt">Ваше сообщение</label><div><textarea disabled={pending} ref={input} id="assistant-prompt" value={draft} onChange={event => setDraft(event.target.value)} placeholder="Например: добавь встречу завтра в 15:00" rows={3} maxLength={2000} /><button disabled={pending || !draft.trim()} onClick={() => void send()} aria-label="Отправить сообщение"><ArrowUp size={20} /></button></div><small>Запрос и контекст ваших задач обрабатывает Yandex AI Studio.</small></footer>
    </section>
  </dialog>
}
