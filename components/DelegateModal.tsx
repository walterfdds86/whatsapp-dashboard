'use client'

import { useState } from 'react'
import type { TeamMember } from '@/lib/supabase'

interface Props {
  taskId: string
  team: TeamMember[]
  onConfirm: (taskId: string, assignee: string) => void
  onClose: () => void
}

export default function DelegateModal({ taskId, team, onConfirm, onClose }: Props) {
  const [selected, setSelected] = useState<string>('')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-4">Delegar para...</h3>
        <div className="space-y-2 mb-6">
          {team.map(member => (
            <button
              key={member.id}
              onClick={() => setSelected(member.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selected === member.name
                  ? 'border-sky-500 bg-sky-500/10 text-sky-300'
                  : 'border-slate-600 bg-slate-700 text-slate-200 hover:border-slate-500'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm font-bold text-slate-200">
                {member.name[0]}
              </div>
              <div className="text-left">
                <div className="font-medium text-sm">{member.name}</div>
                {member.role && <div className="text-xs text-slate-400">{member.role}</div>}
              </div>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg py-2 text-sm transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => selected && onConfirm(taskId, selected)}
            disabled={!selected}
            className="flex-1 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Delegar
          </button>
        </div>
      </div>
    </div>
  )
}
