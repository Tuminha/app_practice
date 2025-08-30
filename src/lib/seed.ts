export type SeedSession = {
  user_id: string
  title: string
}

export type SeedMessage = {
  user_id: string
  role: 'user' | 'assistant'
  content: string
}

export function buildSeedData(userId: string): { session: SeedSession, messages: SeedMessage[] } {
  const session: SeedSession = { user_id: userId, title: 'Demo Chat' }
  const messages: SeedMessage[] = [
    { user_id: userId, role: 'user', content: 'Hello, this is a demo.' },
    { user_id: userId, role: 'assistant', content: 'You said: Hello, this is a demo.' },
  ]
  return { session, messages }
}

