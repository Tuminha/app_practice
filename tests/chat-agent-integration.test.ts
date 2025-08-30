import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAssistantReply } from '@/lib/assistant'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch as any
})

describe('chat agent integration (unit)', () => {
  it('returns a reply from the assistant endpoint', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ reply: 'Hello from GPT' }) })
    const reply = await getAssistantReply('Say hello')
    expect(reply).toBe('Hello from GPT')
  })
})

