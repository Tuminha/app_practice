import { describe, it, expect, vi, afterEach } from 'vitest'
import { generateAssistantReply, getAssistantReply } from '@/lib/assistant'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch as any
})

describe('assistant reply', () => {
  it('echoes the user message with a prefix', () => {
    expect(generateAssistantReply('Hello there')).toBe('You said: Hello there')
  })

  it('handles empty input', () => {
    expect(generateAssistantReply('   ')).toMatch(/Try asking me/i)
  })

  it('getAssistantReply uses API when available', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: 'Hello from API' }) })
    const s = await getAssistantReply('Hi')
    expect(s).toBe('Hello from API')
  })

  it('getAssistantReply falls back on error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('net'))
    const s = await getAssistantReply('Hi')
    expect(s).toBe('You said: Hi')
  })
})
