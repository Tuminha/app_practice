import { describe, it, expect, vi, afterEach } from 'vitest'
import { getAssistantReply, streamAssistant } from '@/lib/assistant'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch as any
})

describe('assistant retry/timeout and streaming', () => {
  it('retries on failure and eventually succeeds', async () => {
    const calls: any[] = []
    global.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('net1'))
      .mockRejectedValueOnce(new Error('net2'))
      .mockResolvedValue({ ok: true, json: async () => ({ reply: 'OK' }) })
    const s = await getAssistantReply('Hi', { timeoutMs: 10, retries: 2 })
    expect(s).toBe('OK')
    expect((global.fetch as any).mock.calls.length).toBeGreaterThanOrEqual(3)
  })

  it('streams chunks and yields them in order', async () => {
    // Create a minimal ReadableStream with two SSE chunks
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: hello\n\n'))
        controller.enqueue(encoder.encode('data: world\n\n'))
        controller.close()
      }
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream })
    const chunks: string[] = []
    for await (const c of streamAssistant('Hi')) {
      chunks.push(c)
    }
    expect(chunks.join('')).toBe('helloworld')
  })
})

