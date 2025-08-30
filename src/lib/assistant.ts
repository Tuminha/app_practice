export function generateAssistantReply(prompt: string): string {
  const trimmed = (prompt || '').trim()
  if (!trimmed) return "I'm here. Try asking me something."
  // Simple placeholder logic: echo with a friendly prefix.
  return `You said: ${trimmed}`
}

export async function getAssistantReply(prompt: string, opts?: { timeoutMs?: number; retries?: number }): Promise<string> {
  const base = import.meta.env.VITE_ASSISTANT_BASE_URL || 'http://localhost:8787'
  const timeoutMs = opts?.timeoutMs ?? 15000
  const retries = opts?.retries ?? 2

  const attempt = async (i: number): Promise<string> => {
    const ac = new AbortController()
    const t = setTimeout(() => ac.abort(), timeoutMs)
    try {
      const r = await fetch(`${base}/api/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt }),
        signal: ac.signal,
      })
      if (!r.ok) throw new Error(`assistant ${r.status}`)
      const data = await r.json()
      return (data?.reply as string) || generateAssistantReply(prompt)
    } catch (e) {
      if (i < retries) {
        const backoff = 300 * Math.pow(2, i)
        await new Promise((res) => setTimeout(res, backoff))
        return attempt(i + 1)
      }
      return generateAssistantReply(prompt)
    } finally {
      clearTimeout(t)
    }
  }
  return attempt(0)
}

export async function* streamAssistant(prompt: string): AsyncGenerator<string> {
  const base = import.meta.env.VITE_ASSISTANT_BASE_URL || 'http://localhost:8787'
  const url = `${base}/api/assistant/stream?` + new URLSearchParams({ message: prompt }).toString()
  const res = await fetch(url, { method: 'GET', headers: { Accept: 'text/event-stream' } })
  if (!res.ok || !res.body) {
    yield generateAssistantReply(prompt)
    return
  }
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''
    for (const p of parts) {
      if (!p.startsWith('data:')) continue
      const line = p.replace(/^data: /, '')
      if (line) yield line
    }
  }
  // ignore trailing partial buffer
}
