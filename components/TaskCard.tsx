'use client'

import type { Task, TaskStatus, Priority } from '@/lib/supabase'

interface Props {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
  onDelegate: (id: string) => void
}

const STATUS_BADGE: Record<TaskStatus, { label: string; className: string }> = {
  new: { label: 'Novo', className: 'bg-red-600 text-white' },
  in_progress: { label: 'Andamento', className: 'bg-blue-600 text-white' },
  delegated: { label: 'Delegado', className: 'bg-amber-500 text-slate-900' },
  done: { label: 'Concluído', className: 'bg-emerald-600 text-white' },
  flagged: { label: '⚠ Revisar', className: 'bg-rose-500 text-white' },
}

const PRIORITY_BORDER: Record<Priority, string> = {
  urgent: 'border-l-red-500',
  today: 'border-l-amber-500',
  week: 'border-l-violet-500',
  no_date: 'border-l-slate-600',
}

function formatDueDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function TaskCard({ task, onUpdate, onDelegate }: Props) {
  const badge = STATUS_BADGE[task.status]
  const border = PRIORITY_BORDER[task.priority]
  const dueDate = formatDueDate(task.due_date)

  return (
    <div className={`bg-slate-950 rounded-lg p-3 mb-2 border-l-4 ${border}`}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <span className="text-sm font-semibold text-slate-100 leading-tight">{task.title}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      <div className="text-xs text-slate-400 mb-1">
        💬 {task.sender_name}
        {task.source === 'group' && task.group_name && (
          <span className="ml-1 text-slate-500">· <span>{task.group_name}</span></span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-sky-400">→ {task.assignee}</span>
        {dueDate && (
          <span className="text-xs text-rose-400">⏰ {dueDate}</span>
        )}
      </div>

      {task.status !== 'done' && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-slate-800">
          {task.status === 'new' && (
            <button
              title="Em andamento"
              onClick={() => onUpdate(task.id, { status: 'in_progress' })}
              className="flex-1 bg-slate-800 hover:bg-blue-900 text-blue-400 text-xs rounded py-1 transition-colors"
            >
              ⚡ Iniciar
            </button>
          )}
          <button
            title="Delegar"
            onClick={() => onDelegate(task.id)}
            className="flex-1 bg-slate-800 hover:bg-amber-900 text-amber-400 text-xs rounded py-1 transition-colors"
          >
            👤 Delegar
          </button>
          <button
            title="Concluir"
            onClick={() => onUpdate(task.id, { status: 'done' })}
            className="flex-1 bg-slate-800 hover:bg-emerald-900 text-emerald-400 text-xs rounded py-1 transition-colors"
          >
            ✓ Feito
          </button>
        </div>
      )}

      {task.status === 'flagged' && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => onUpdate(task.id, { status: 'new', priority: 'urgent' })}
            className="flex-1 bg-red-950 hover:bg-red-900 text-red-400 text-xs rounded py-1 transition-colors"
          >
            🔴 Urgente
          </button>
          <button
            onClick={() => onUpdate(task.id, { status: 'new', priority: 'today' })}
            className="flex-1 bg-slate-800 hover:bg-amber-900 text-amber-400 text-xs rounded py-1 transition-colors"
          >
            📋 Hoje
          </button>
          <button
            onClick={() => onUpdate(task.id, { status: 'done' })}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded py-1 transition-colors"
          >
            Ignorar
          </button>
        </div>
      )}
    </div>
  )
}
