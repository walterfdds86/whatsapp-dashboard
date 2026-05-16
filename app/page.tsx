import { createServerClient } from '@/lib/supabase'
import DashboardClient from '@/components/DashboardClient'

export const revalidate = 60

export default async function DashboardPage() {
  const db = createServerClient()

  const [{ data: tasks }, { data: team }] = await Promise.all([
    db.from('tasks').select('*').order('created_at', { ascending: false }).limit(200),
    db.from('team_members').select('*').order('name'),
  ])

  return (
    <DashboardClient
      initialTasks={tasks ?? []}
      team={team ?? []}
    />
  )
}
