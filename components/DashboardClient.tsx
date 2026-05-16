'use client'

import { useState } from 'react'
import type { Task, TeamMember } from '@/lib/supabase'
import StatusBar from './StatusBar'
import KanbanBoard from './KanbanBoard'

interface Props {
  initialTasks: Task[]
  team: TeamMember[]
}

export default function DashboardClient({ initialTasks, team }: Props) {
  const [filterAssignee, setFilterAssignee] = useState('')
  const teamNames = team.map(m => m.name)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <StatusBar
        tasks={initialTasks}
        filterAssignee={filterAssignee}
        onFilterChange={setFilterAssignee}
        teamMembers={teamNames}
      />
      <main className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard
          initialTasks={initialTasks}
          team={team}
          filterAssignee={filterAssignee}
        />
      </main>
    </div>
  )
}
