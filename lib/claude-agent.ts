import Anthropic from '@anthropic-ai/sdk'
import type { ParsedMessage } from './evolution'
import type { TeamMember, Priority, Source } from './supabase'

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

interface CreateTaskInput {
  title: string
  description: string
  priority: Priority
  assignee: string
  due_date: string | null
  sender_name: string
  source: Source
  group_name: string | null
}

export interface AgentResult {
  action: 'create_task' | 'ignore_message' | 'flag_for_review'
  task?: CreateTaskInput
  flagReason?: string
  flagPartialTitle?: string | null
}

const tools: Anthropic.Tool[] = [
  {
    name: 'create_task',
    description: 'Cria uma tarefa a partir de uma mensagem acionável do WhatsApp',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Ação resumida em 1 linha (máx 80 chars)' },
        description: { type: 'string', description: 'Contexto completo da mensagem' },
        priority: {
          type: 'string',
          enum: ['urgent', 'today', 'week', 'no_date'],
          description: 'urgent=hoje/agora, today=amanhã, week=essa semana, no_date=sem prazo',
        },
        assignee: { type: 'string', description: 'Nome do responsável pela execução' },
        due_date: { type: 'string', description: 'ISO 8601 se prazo explícito, senão null' },
        sender_name: { type: 'string' },
        source: { type: 'string', enum: ['direct', 'group'] },
        group_name: { type: 'string', description: 'Nome do grupo, ou null se direto' },
      },
      required: ['title', 'description', 'priority', 'assignee', 'sender_name', 'source'],
    },
  },
  {
    name: 'ignore_message',
    description: 'Ignora mensagem que não gera tarefa (saudação, confirmação, sticker, áudio)',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: { type: 'string', description: 'Motivo do descarte' },
      },
      required: ['reason'],
    },
  },
  {
    name: 'flag_for_review',
    description: 'Marca mensagem ambígua para revisão humana manual no dashboard',
    input_schema: {
      type: 'object' as const,
      properties: {
        reason: { type: 'string' },
        partial_title: { type: 'string', description: 'Título parcial se possível deduzir algo' },
      },
      required: ['reason'],
    },
  },
]

function buildSystemPrompt(team: TeamMember[]): string {
  const teamList = team.map(m => `- ${m.name} (${m.role ?? 'membro'})`).join('\n')
  return `Você é um assistente de gestão que analisa mensagens do WhatsApp do Walter Ferreira, consultor de marketing.

Seu trabalho: decidir se cada mensagem requer uma ação, quem deve executar e qual a prioridade.

MEMBROS DO TIME:
${teamList}

REGRAS DE PRIORIDADE:
- urgent: palavras como "hoje", "agora", "urgente", prazo < 24h
- today: "amanhã", "logo", prazo 24-48h
- week: "essa semana", "até sexta", prazo 2-7 dias
- no_date: sem prazo definido

REGRAS DE RESPONSÁVEL:
1. Se menciona nome de membro do time → atribui a ele
2. Mensagem direta → "Walter" por padrão
3. Sem clareza → "Walter" para revisão

IGNORE (não crie tarefa para):
- Saudações ("oi", "bom dia", "tudo bem?")
- Confirmações simples ("ok", "entendido", "👍")
- Informes sem ação necessária
- Áudios, figurinhas, stickers, reações
- Mensagens enviadas pelo próprio Walter

MARQUE PARA REVISÃO quando:
- Contexto insuficiente para classificar
- Urgência subentendida mas não explícita
- Mensagem incompleta ou ambígua

Responda sempre em português brasileiro.`
}

export async function analyzeMessage(
  msg: ParsedMessage,
  team: TeamMember[]
): Promise<AgentResult> {
  const userContent = `Mensagem recebida:
De: ${msg.from_name ?? msg.from_number}
Origem: ${msg.is_group ? `Grupo "${msg.chat_name ?? msg.chat_id}"` : 'Chat direto'}
Texto: "${msg.body}"
Horário: ${msg.received_at}`

  const response = await getClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    tools,
    tool_choice: { type: 'any' },
    system: buildSystemPrompt(team),
    messages: [{ role: 'user', content: userContent }],
  })

  const toolUse = response.content.find(b => b.type === 'tool_use')
  if (!toolUse || toolUse.type !== 'tool_use') {
    return { action: 'ignore_message' }
  }

  if (toolUse.name === 'create_task') {
    return { action: 'create_task', task: toolUse.input as CreateTaskInput }
  }
  if (toolUse.name === 'flag_for_review') {
    const input = toolUse.input as { reason: string; partial_title?: string }
    return { action: 'flag_for_review', flagReason: input.reason, flagPartialTitle: input.partial_title ?? null }
  }
  return { action: 'ignore_message' }
}
