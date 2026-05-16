import { createClient } from '@supabase/supabase-js'

export type Priority = 'urgent' | 'today' | 'week' | 'no_date'
export type TaskStatus = 'new' | 'in_progress' | 'delegated' | 'done' | 'flagged'
export type Source = 'direct' | 'group'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: Priority
  status: TaskStatus
  sender_name: string
  sender_phone: string
  assignee: string
  due_date: string | null
  source: Source
  group_name: string | null
  message_id: string | null
  created_at: string
  updated_at: string
}

export interface RawMessage {
  id: string
  body: string
  from_number: string
  from_name: string | null
  chat_id: string
  chat_name: string | null
  processed: boolean
  received_at: string
}

export interface TeamMember {
  id: string
  name: string
  phone: string
  role: string | null
}

// Browser client — uses anon key, for frontend components
// Lazy singleton to avoid build-time errors when env vars are empty
let _supabase: ReturnType<typeof createClient> | null = null
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!_supabase) {
      _supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    }
    const value = (_supabase as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(_supabase) : value
  },
})

// Server client — uses service role key, for API routes only
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
