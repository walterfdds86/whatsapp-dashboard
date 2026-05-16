'use client'

import { useEffect, useState } from 'react'
import type { Task, Priority } from '@/lib/supabase'

interface Props {
  tasks: Task[]
  filterAssignee: string
  onFilterChange: (v: string) => void
  teamMembers: string[]
}

const PRIORITY_LABELS: Record<Priority | 'flagged' | 'done', string> = {
  urgent: 'Urgente',
  today: 'Hoje',
  week: 'Semana',
  no_date: 'Sem data',
  flagged: 'Revisar',
  done: 'Concluído',
}

export default function StatusBar({ tasks, filterAssignee, onFilterChange, teamMembers }: Props) {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/status')
        const data = await res.json()
        setConnected(data.connected)
      } catch {
        setConnected(false)
      }
    }
    checkStatus()
    const interval = setInterval(checkStatus, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setLastUpdated(new Date())
  }, [tasks])

  const counts = {
    urgent: tasks.filter(t => t.priority === 'urgent' && t.status !== 'done').length,
    today: tasks.filter(t => t.priority === 'today' && t.status !== 'done').length,
    week: tasks.filter(t => (t.priority === 'week' || t.priority === 'no_date') && t.status !== 'done').length,
    flagged: tasks.filter(t => t.status === 'flagged').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-lg">WhatsApp Dashboard</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  connected === null ? 'bg-yellow-400' :
                  connected ? 'bg-green-400 shadow-[0_0_6px_#4ade80]' : 'bg-red-400'
                }`}
              />
              <span className={`text-xs ${
                connected === null ? 'text-yellow-400' :
                connected ? 'text-green-400' : 'text-red-400'
              }`}>
                {connected === null ? 'Verificando...' : connected ? 'WhatsApp conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Atualizado: {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <select
              value={filterAssignee}
              onChange={e => onFilterChange(e.target.value)}
              className="bg-slate-700 text-slate-200 text-xs rounded px-2 py-1 border border-slate-600"
            >
              <option value="">Todos</option>
              {teamMembers.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {([
            { key: 'urgent', color: 'text-red-400', bg: 'bg-red-400/10' },
            { key: 'today', color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { key: 'week', color: 'text-violet-400', bg: 'bg-violet-400/10' },
            { key: 'flagged', color: 'text-rose-400', bg: 'bg-rose-400/10' },
            { key: 'done', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          ] as const).map(({ key, color, bg }) => (
            <div key={key} className={`${bg} rounded-lg px-3 py-2 text-center`}>
              <div className={`text-2xl font-black ${color}`}>
                {counts[key]}
              </div>
              <div className="text-xs text-slate-500 uppercase tracking-wide mt-0.5">
                {PRIORITY_LABELS[key]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
