import { describe, it, expect, vi, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../scripts/assistant-app.mjs'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch as any
})

describe('assistant server endpoints', () => {
  const app = createApp({ OPENAI_API_KEY: 'dummy', OPENAI_MODEL: 'gpt-4o' })

  it('POST /api/assistant returns reply', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ choices: [{ message: { content: 'Hello there' } }] }) })
    const res = await request(app).post('/api/assistant').send({ message: 'Hi' })
    expect(res.status).toBe(200)
    expect(res.body.reply).toBe('Hello there')
  })

  it('GET /api/assistant/stream streams text chunks', async () => {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      start(controller) {
        const chunk1 = 'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Hello ' } }] }) + '\n\n'
        const chunk2 = 'data: ' + JSON.stringify({ choices: [{ delta: { content: 'world' } }] }) + '\n\n'
        const done = 'data: [DONE]\n\n'
        controller.enqueue(encoder.encode(chunk1))
        controller.enqueue(encoder.encode(chunk2))
        controller.enqueue(encoder.encode(done))
        controller.close()
      }
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: true, body: stream })
    const res = await request(app).get('/api/assistant/stream').query({ message: 'Hi' })
    expect(res.status).toBe(200)
    expect(res.text).toContain('data: Hello ')
    expect(res.text).toContain('data: world')
  })

  it('Stripe endpoints return 501 when not configured', async () => {
    const app2 = createApp({})
    const chk = await request(app2).post('/api/billing/checkout')
    expect(chk.status).toBe(501)
    const por = await request(app2).post('/api/billing/portal')
    expect(por.status).toBe(501)
  })

  it('Stripe checkout/portal work with stub', async () => {
    const stripeStub = {
      checkout: { sessions: { create: async () => ({ url: 'https://stripe.test/checkout' }) } },
      billingPortal: { sessions: { create: async () => ({ url: 'https://stripe.test/portal' }) } },
      webhooks: { constructEvent: (_b, _s, _w) => ({ type: 'checkout.session.completed' }) },
      subscriptions: { list: async () => ({ data: [{ id: 'sub_1', status: 'active' }] }) },
    }
    const app3 = createApp({ STRIPE_PRICE_PRO: 'price_test', STRIPE_SUCCESS_URL: 'http://ok', STRIPE_CANCEL_URL: 'http://no' }, { stripeStub, testSkipVerify: true })
    const chk = await request(app3).post('/api/billing/checkout')
    expect(chk.status).toBe(200)
    expect(chk.body.url).toContain('stripe.test/checkout')
    const por = await request(app3).post('/api/billing/portal').send({ customer_id: 'cus_123' })
    expect(por.status).toBe(200)
    expect(por.body.url).toContain('stripe.test/portal')
    const wh = await request(app3).post('/api/billing/webhook')
    expect(wh.status).toBe(200)
    const st = await request(app3).get('/api/billing/status').query({ customer_id: 'cus_123' })
    expect(st.status).toBe(200)
    expect(st.body.plan).toBe('pro')
  })

  it('Stripe checkout works when only STRIPE_PRICE_ID is set', async () => {
    const stripeStub = {
      checkout: { sessions: { create: async () => ({ url: 'https://stripe.test/checkout' }) } },
      billingPortal: { sessions: { create: async () => ({ url: 'https://stripe.test/portal' }) } },
      webhooks: { constructEvent: (_b, _s, _w) => ({ type: 'checkout.session.completed' }) },
    }
    const app4 = createApp({ STRIPE_PRICE_ID: 'price_alt', STRIPE_SUCCESS_URL: 'http://ok', STRIPE_CANCEL_URL: 'http://no' }, { stripeStub, testSkipVerify: true })
    const chk = await request(app4).post('/api/billing/checkout')
    expect(chk.status).toBe(200)
    expect(chk.body.url).toContain('stripe.test/checkout')
  })
})
