import { NextRequest, NextResponse } from 'next/server'
import { validateWebhookSecret, parseEvolutionPayload } from '@/lib/evolution'
import { analyzeMessage } from '@/lib/claude-agent'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') ?? ''
  if (!validateWebhookSecret(process.env.WEBHOOK_SECRET!, secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = parseEvolutionPayload(payload)
  if (!parsed) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const db = createServerClient()

  await db.from('raw_messages').upsert({
    id: parsed.id,
    body: parsed.body,
    from_number: parsed.from_number,
    from_name: parsed.from_name,
    chat_id: parsed.chat_id,
    chat_name: parsed.chat_name,
    processed: false,
    received_at: parsed.received_at,
  }, { onConflict: 'id' })

  const { data: team } = await db.from('team_members').select('*')
  const teamMembers = team ?? []

  const result = await analyzeMessage(parsed, teamMembers)

  await db.from('raw_messages').update({ processed: true }).eq('id', parsed.id)

  if (result.action === 'ignore_message') {
    return NextResponse.json({ ok: true, action: 'ignored' })
  }

  if (result.action === 'create_task' && result.task) {
    await db.from('tasks').insert({
      title: result.task.title,
      description: result.task.description,
      priority: result.task.priority,
      status: 'new',
      sender_name: result.task.sender_name,
      sender_phone: parsed.from_number,
      assignee: result.task.assignee,
      due_date: result.task.due_date,
      source: result.task.source,
      group_name: result.task.group_name,
      message_id: parsed.id,
    })
    return NextResponse.json({ ok: true, action: 'task_created' })
  }

  if (result.action === 'flag_for_review') {
    await db.from('tasks').insert({
      title: result.flagPartialTitle ?? 'Mensagem para revisão manual',
      description: `Motivo: ${result.flagReason}\n\nMensagem original: "${parsed.body}"`,
      priority: 'no_date',
      status: 'flagged',
      sender_name: parsed.from_name ?? parsed.from_number,
      sender_phone: parsed.from_number,
      assignee: 'Walter',
      due_date: null,
      source: parsed.is_group ? 'group' : 'direct',
      group_name: parsed.chat_name,
      message_id: parsed.id,
    })
    return NextResponse.json({ ok: true, action: 'flagged_for_review' })
  }

  return NextResponse.json({ ok: true })
}
