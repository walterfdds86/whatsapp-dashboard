'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Task, TeamMember } from '@/lib/supabase'
import TaskCard from './TaskCard'
import DelegateModal from './DelegateModal'

interface Column {
  id: string
  label: string
  color: string
  borderColor: string
  countColor: string
  filter: (tasks: Task[]) => Task[]
}

const COLUMNS: Column[] = [
  {
    id: 'urgent',
    label: '🔴 Urgente',
    color: 'text-red-400',
    borderColor: 'border-t-red-500',
    countColor: 'bg-red-500',
    filter: tasks => tasks.filter(t => t.priority === 'urgent' && t.status !== 'done' && t.status !== 'flagged'),
  },
  {
    id: 'today',
    label: '📋 Hoje',
    color: 'text-amber-400',
    borderColor: 'border-t-amber-500',
    countColor: 'bg-amber-500',
    filter: tasks => tasks.filter(t => t.priority === 'today' && t.status !== 'done' && t.status !== 'flagged'),
  },
  {
    id: 'week',
    label: '📅 Semana',
    color: 'text-violet-400',
    borderColor: 'border-t-violet-500',
    countColor: 'bg-violet-500',
    filter: tasks =>
      tasks.filter(t =>
        (t.priority === 'week' || t.priority === 'no_date') &&
        t.status !== 'done' &&
        t.status !== 'flagged'
      ),
  },
  {
    id: 'flagged',
    label: '⚠ Revisar',
    color: 'text-rose-400',
    borderColor: 'border-t-rose-400',
    countColor: 'bg-rose-400',
    filter: tasks => tasks.filter(t => t.status === 'flagged'),
  },
  {
    id: 'done',
    label: '✅ Concluído',
    color: 'text-emerald-400',
    borderColor: 'border-t-emerald-500',
    countColor: 'bg-emerald-500',
    filter: tasks => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      return tasks.filter(t => t.status === 'done' && t.updated_at >= cutoff)
    },
  },
]

interface Props {
  initialTasks: Task[]
  team: TeamMember[]
  filterAssignee: string
}

export default function KanbanBoard({ initialTasks, team, filterAssignee }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [delegateTarget, setDelegateTarget] = useState<string | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        payload => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [payload.new as Task, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t))
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleUpdate = useCallback(async (id: string, updates: Partial<Task>) => {
    await supabase.from('tasks').update(updates).eq('id', id)
  }, [])

  const handleDelegate = useCallback(async (taskId: string, assignee: string) => {
    await supabase.from('tasks').update({ assignee, status: 'delegated' }).eq('id', taskId)
    setDelegateTarget(null)
  }, [])

  const visibleTasks = filterAssignee
    ? tasks.filter(t => t.assignee === filterAssignee)
    : tasks

  return (
    <>
      <div className="flex gap-3 overflow-x-auto px-4 pb-6 pt-4 h-full min-h-0">
        {COLUMNS.map(col => {
          const columnTasks = col.filter(visibleTasks)
          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-72 bg-slate-800 rounded-xl border-t-4 ${col.borderColor} flex flex-col`}
            >
              <div className="flex items-center justify-between px-3 py-2.5">
                <span className={`text-xs font-black uppercase tracking-wider ${col.color}`}>
                  {col.label}
                </span>
                <span className={`${col.countColor} text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center`}>
                  {columnTasks.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto px-2 pb-2">
                {columnTasks.length === 0 ? (
                  <div className="text-slate-600 text-xs text-center py-6">Nenhuma tarefa</div>
                ) : (
                  columnTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={handleUpdate}
                      onDelegate={id => setDelegateTarget(id)}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {delegateTarget && (
        <DelegateModal
          taskId={delegateTarget}
          team={team}
          onConfirm={handleDelegate}
          onClose={() => setDelegateTarget(null)}
        />
      )}
    </>
  )
}
