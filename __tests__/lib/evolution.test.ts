import { describe, it, expect } from 'vitest'
import { validateWebhookSecret, parseEvolutionPayload } from '@/lib/evolution'

describe('validateWebhookSecret', () => {
  it('returns true when secret matches', () => {
    expect(validateWebhookSecret('my-secret', 'my-secret')).toBe(true)
  })

  it('returns false when secret does not match', () => {
    expect(validateWebhookSecret('my-secret', 'wrong')).toBe(false)
  })

  it('returns false when secret is empty', () => {
    expect(validateWebhookSecret('my-secret', '')).toBe(false)
  })
})

describe('parseEvolutionPayload', () => {
  it('parses a direct message', () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: { remoteJid: '5561999354363@s.whatsapp.net', fromMe: false, id: 'MSG1' },
        pushName: 'João Silva',
        message: { conversation: 'Preciso da proposta hoje' },
        messageType: 'conversation',
        messageTimestamp: 1715874600,
      },
    }
    const result = parseEvolutionPayload(payload)
    expect(result).toEqual({
      id: 'MSG1',
      body: 'Preciso da proposta hoje',
      from_number: '5561999354363',
      from_name: 'João Silva',
      chat_id: '5561999354363@s.whatsapp.net',
      chat_name: null,
      is_group: false,
      from_me: false,
      received_at: new Date(1715874600 * 1000).toISOString(),
    })
  })

  it('parses a group message', () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: {
          remoteJid: '12345@g.us',
          fromMe: false,
          id: 'MSG2',
          participant: '5561999354363@s.whatsapp.net',
        },
        pushName: 'Ana Souza',
        message: { conversation: 'Walter, precisa revisar o relatório' },
        messageType: 'conversation',
        messageTimestamp: 1715874700,
      },
    }
    const result = parseEvolutionPayload(payload)
    expect(result?.is_group).toBe(true)
    expect(result?.from_number).toBe('5561999354363')
    expect(result?.chat_id).toBe('12345@g.us')
  })

  it('returns null for fromMe messages', () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: { remoteJid: '5561999354363@s.whatsapp.net', fromMe: true, id: 'MSG3' },
        pushName: 'Walter',
        message: { conversation: 'Minha própria mensagem' },
        messageType: 'conversation',
        messageTimestamp: 1715874800,
      },
    }
    expect(parseEvolutionPayload(payload)).toBeNull()
  })

  it('returns null for non-text messages', () => {
    const payload = {
      event: 'messages.upsert',
      data: {
        key: { remoteJid: '5561999354363@s.whatsapp.net', fromMe: false, id: 'MSG4' },
        pushName: 'Pedro',
        message: { audioMessage: {} },
        messageType: 'audioMessage',
        messageTimestamp: 1715874900,
      },
    }
    expect(parseEvolutionPayload(payload)).toBeNull()
  })

  it('returns null for non-upsert events', () => {
    const payload = { event: 'connection.update', data: {} }
    expect(parseEvolutionPayload(payload)).toBeNull()
  })
})
