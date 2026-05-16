export interface ParsedMessage {
  id: string
  body: string
  from_number: string
  from_name: string | null
  chat_id: string
  chat_name: string | null
  is_group: boolean
  from_me: boolean
  received_at: string
}

export function validateWebhookSecret(expected: string, received: string): boolean {
  if (!received) return false
  return expected === received
}

function extractBody(message: Record<string, unknown>): string | null {
  if (typeof message.conversation === 'string') return message.conversation
  const ext = message.extendedTextMessage as Record<string, unknown> | undefined
  if (ext && typeof ext.text === 'string') return ext.text
  return null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function parseEvolutionPayload(payload: any): ParsedMessage | null {
  if (payload.event !== 'messages.upsert') return null

  const data = payload.data
  const key = data?.key
  if (!key || !data?.message) return null
  if (key.fromMe) return null

  const body = extractBody(data.message)
  if (!body) return null

  const isGroup = String(key.remoteJid).endsWith('@g.us')
  const senderJid: string = isGroup ? (key.participant ?? '') : key.remoteJid
  const fromNumber = senderJid.replace(/@[a-z.]+$/, '')

  return {
    id: key.id,
    body,
    from_number: fromNumber,
    from_name: data.pushName ?? null,
    chat_id: key.remoteJid,
    chat_name: data.chatName ?? null,
    is_group: isGroup,
    from_me: false,
    received_at: new Date((data.messageTimestamp as number) * 1000).toISOString(),
  }
}
