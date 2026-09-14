import { createClient } from '@supabase/supabase-js'
import type { Task } from './types'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const supabase = url && key ? createClient(url, key) : null
export type NewTask = Omit<Task, 'id' | 'createdAt' | 'status'>
const fields = 'id,title,description,project,dueDate,priority,status,createdAt'
function client() {
  if (!supabase) throw new Error('Облачное подключение не настроено')
  return supabase
}
export async function listTasks(): Promise<Task[]> {
  const { data, error } = await client().from('tasks').select(fields).order('createdAt', { ascending: false }).abortSignal(AbortSignal.timeout(15000))
  if (error) throw error
  return data as Task[]
}
export async function saveTask(task: NewTask, id: string): Promise<Task> {
  const { error } = await client().from('tasks').upsert({ ...task, id }, { onConflict: 'id', ignoreDuplicates: true }).abortSignal(AbortSignal.timeout(15000))
  if (error) throw error
  const existing = await client().from('tasks').select(fields).eq('id', id).abortSignal(AbortSignal.timeout(15000)).single()
  if (existing.error) throw existing.error
  return existing.data as Task
}
export async function setTaskStatus(id: string, status: Task['status']): Promise<Task> {
  const { data, error } = await client().from('tasks').update({ status }).eq('id', id).select(fields).abortSignal(AbortSignal.timeout(15000)).single()
  if (error) throw error
  return data as Task
}
export async function removeTask(id: string) {
  const { error } = await client().from('tasks').delete().eq('id', id).abortSignal(AbortSignal.timeout(15000))
  if (error) throw error
}
export async function editTask(id: string, changes: Partial<NewTask>) {
  const { data, error } = await client().from('tasks').update(changes).eq('id', id).select(fields).abortSignal(AbortSignal.timeout(15000)).single()
  if (error) throw error
  return data as Task
}
