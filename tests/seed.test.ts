import { describe, it, expect } from 'vitest'
import { buildSeedData } from '@/lib/seed'

describe('seed builder', () => {
  it('builds a session and paired messages', () => {
    const { session, messages } = buildSeedData('user-123')
    expect(session.user_id).toBe('user-123')
    expect(messages.length).toBe(2)
    expect(messages[0].role).toBe('user')
    expect(messages[1].role).toBe('assistant')
  })
})

