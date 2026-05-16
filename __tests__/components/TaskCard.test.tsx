import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TaskCard from '@/components/TaskCard'
import type { Task } from '@/lib/supabase'

const mockTask: Task = {
  id: 'task-1',
  title: 'Enviar proposta para João',
  description: 'João pediu a proposta hoje antes das 18h',
  priority: 'urgent',
  status: 'new',
  sender_name: 'João Silva',
  sender_phone: '5561999354363',
  assignee: 'Walter',
  due_date: '2026-05-16T21:00:00Z',
  source: 'direct',
  group_name: null,
  message_id: 'MSG1',
  created_at: '2026-05-16T12:00:00Z',
  updated_at: '2026-05-16T12:00:00Z',
}

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={mockTask} onUpdate={vi.fn()} onDelegate={vi.fn()} />)
    expect(screen.getByText('Enviar proposta para João')).toBeInTheDocument()
  })

  it('renders sender name', () => {
    render(<TaskCard task={mockTask} onUpdate={vi.fn()} onDelegate={vi.fn()} />)
    expect(screen.getByText(/João Silva/)).toBeInTheDocument()
  })

  it('renders assignee', () => {
    render(<TaskCard task={mockTask} onUpdate={vi.fn()} onDelegate={vi.fn()} />)
    expect(screen.getByText(/Walter/)).toBeInTheDocument()
  })

  it('calls onUpdate with done when complete button clicked', () => {
    const onUpdate = vi.fn()
    render(<TaskCard task={mockTask} onUpdate={onUpdate} onDelegate={vi.fn()} />)
    fireEvent.click(screen.getByTitle('Concluir'))
    expect(onUpdate).toHaveBeenCalledWith('task-1', { status: 'done' })
  })

  it('calls onDelegate when delegate button clicked', () => {
    const onDelegate = vi.fn()
    render(<TaskCard task={mockTask} onUpdate={vi.fn()} onDelegate={onDelegate} />)
    fireEvent.click(screen.getByTitle('Delegar'))
    expect(onDelegate).toHaveBeenCalledWith('task-1')
  })

  it('shows group badge when source is group', () => {
    const groupTask = { ...mockTask, source: 'group' as const, group_name: 'Grupo Comercial' }
    render(<TaskCard task={groupTask} onUpdate={vi.fn()} onDelegate={vi.fn()} />)
    expect(screen.getByText('Grupo Comercial')).toBeInTheDocument()
  })
})
