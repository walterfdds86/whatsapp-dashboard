import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}))

import Anthropic from '@anthropic-ai/sdk'
import { analyzeMessage } from '@/lib/claude-agent'
import type { ParsedMessage } from '@/lib/evolution'
import type { TeamMember } from '@/lib/supabase'

const mockMessage: ParsedMessage = {
  id: 'MSG1',
  body: 'Walter, precisa da proposta hoje antes das 18h',
  from_number: '5561999354363',
  from_name: 'João Silva',
  chat_id: '5561999354363@s.whatsapp.net',
  chat_name: null,
  is_group: false,
  from_me: false,
  received_at: '2026-05-16T12:00:00Z',
}

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Walter', phone: '5561999354363', role: 'Gestor' },
  { id: '2', name: 'Ana', phone: '5561888880001', role: 'Assistente' },
]

describe('analyzeMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const MockAnthropic = vi.mocked(Anthropic)
    MockAnthropic.mockImplementation(() => ({
      messages: { create: vi.fn() },
    }))
  })

  it('returns create_task result for actionable message', async () => {
    const MockAnthropic = vi.mocked(Anthropic)
    const mockCreate = vi.fn().mockResolvedValue({
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          name: 'create_task',
          input: {
            title: 'Enviar proposta para João',
            description: 'João precisa da proposta hoje antes das 18h',
            priority: 'urgent',
            assignee: 'Walter',
            due_date: null,
            sender_name: 'João Silva',
            source: 'direct',
            group_name: null,
          },
        },
      ],
    })
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await analyzeMessage(mockMessage, mockTeam)
    expect(result.action).toBe('create_task')
    expect(result.task?.title).toBe('Enviar proposta para João')
    expect(result.task?.priority).toBe('urgent')
  })

  it('returns ignore for casual message', async () => {
    const MockAnthropic = vi.mocked(Anthropic)
    const mockCreate = vi.fn().mockResolvedValue({
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          name: 'ignore_message',
          input: { reason: 'Mensagem de saudação casual' },
        },
      ],
    })
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const casualMessage = { ...mockMessage, body: 'Oi! Tudo bem?' }
    const result = await analyzeMessage(casualMessage, mockTeam)
    expect(result.action).toBe('ignore_message')
    expect(result.task).toBeUndefined()
  })

  it('returns flag_for_review for ambiguous message', async () => {
    const MockAnthropic = vi.mocked(Anthropic)
    const mockCreate = vi.fn().mockResolvedValue({
      stop_reason: 'tool_use',
      content: [
        {
          type: 'tool_use',
          name: 'flag_for_review',
          input: { reason: 'Contexto insuficiente', partial_title: 'Ver isso aqui' },
        },
      ],
    })
    MockAnthropic.mockImplementation(() => ({
      messages: { create: mockCreate },
    }))

    const result = await analyzeMessage({ ...mockMessage, body: 'Precisa ver isso aqui...' }, mockTeam)
    expect(result.action).toBe('flag_for_review')
    expect(result.flagReason).toBe('Contexto insuficiente')
  })
})
