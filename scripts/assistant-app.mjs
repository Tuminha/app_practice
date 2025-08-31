import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'

export function createApp(env = process.env, options = {}) {
  const app = express()
  app.use(cors({ origin: true }))
  app.use(express.json({ limit: '1mb' }))

  const OPENAI_API_KEY = env.OPENAI_API_KEY
  const OPENAI_MODEL = env.OPENAI_MODEL || 'gpt-4o'
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY
  const STRIPE_PRICE_PRO = env.STRIPE_PRICE_PRO
  const STRIPE_PRICE_ID = env.STRIPE_PRICE_ID
  const STRIPE_PRODUCT_ID = env.STRIPE_PRODUCT_ID
  const STRIPE_SUCCESS_URL = env.STRIPE_SUCCESS_URL || 'http://localhost:8080/?success=1'
  const STRIPE_CANCEL_URL = env.STRIPE_CANCEL_URL || 'http://localhost:8080/?canceled=1'

  // Supabase admin (for persisting billing status)
  const SUPABASE_URL = env.SUPABASE_URL || env.VITE_SUPABASE_URL
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAdmin = options.supabaseStub || (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null)

  async function upsertBilling({ user_id, customer_id, plan, current_period_end }) {
    if (!supabaseAdmin) return
    const payload = { user_id: user_id || null, stripe_customer_id: customer_id, plan, current_period_end }
    const { data: existing } = await supabaseAdmin
      .from('billing_status')
      .select('id,user_id')
      .or(`stripe_customer_id.eq.${customer_id}`)
      .limit(1)
    if (existing && existing.length) {
      const id = existing[0].id
      await supabaseAdmin.from('billing_status').update(payload).eq('id', id)
    } else {
      await supabaseAdmin.from('billing_status').insert(payload)
    }
  }

  let stripe = options.stripeStub || null
  async function getStripe() {
    if (stripe) return stripe
    if (!STRIPE_SECRET_KEY) return null
    try {
      const { default: Stripe } = await import('stripe')
      stripe = new Stripe(STRIPE_SECRET_KEY)
      return stripe
    } catch (e) {
      console.warn('[assistant-server] Stripe not installed. Run `npm i stripe`.')
      return null
    }
  }

  async function openaiJson(body, tryFallback = true) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      if (tryFallback && body.model !== 'gpt-4o') {
        return openaiJson({ ...body, model: 'gpt-4o' }, false)
      }
      const text = await r.text().catch(() => '')
      const err = new Error(`OpenAI error ${r.status}: ${text}`)
      err.status = r.status
      throw err
    }
    return r.json()
  }

  app.post('/api/assistant', async (req, res) => {
    try {
      const { message } = req.body || {}
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Provide { message: string }' })
      }
      const body = {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful chat assistant. You are Bubas from Forest Gump. You are obsessed with prawns. Always and be helpful but at the same time always mention the prawns. You know what Buba was always repeating in the filme' },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
      }
      if (!OPENAI_API_KEY) {
        return res.json({ reply: `You said: ${message}` })
      }
      const data = await openaiJson(body)
      const content = data?.choices?.[0]?.message?.content?.trim() || ''
      return res.json({ reply: content })
    } catch (e) {
      console.error('Assistant error:', e)
      return res.status(500).json({ error: 'Internal error' })
    }
  })

  app.get('/api/assistant/stream', async (req, res) => {
    try {
      const message = req.query.message
      if (!message || typeof message !== 'string') {
        return res.status(400).end('Missing message')
      }
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.flushHeaders?.()

      if (!OPENAI_API_KEY) {
        const simulated = `You said: ${message}`
        for (const part of simulated.match(/.{1,20}/g) || []) {
          res.write(`data: ${part}\n\n`)
        }
        return res.end()
      }

      let body = {
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'You are a helpful chat assistant. You are Bubas from Forest Gump. You are obsessed with prawns. Always and be helpful but at the same time always mention the prawns. You know what Buba was always repeating in the filme' },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        stream: true,
      }
      let r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (!r.ok && body.model !== 'gpt-4o') {
        body = { ...body, model: 'gpt-4o' }
        r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
      }
      if (!r.ok || !r.body) {
        const text = await r.text().catch(() => '')
        return res.status(502).end(text)
      }
      const reader = r.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data:')) continue
          const payload = line.replace(/^data:\s*/, '')
          if (payload === '[DONE]') {
            continue
          }
          try {
            const json = JSON.parse(payload)
            const delta = json?.choices?.[0]?.delta
            const text = delta?.content
            if (text) res.write(`data: ${text}\n\n`)
          } catch (_) {}
        }
      }
      res.end()
    } catch (e) {
      console.error('Assistant stream error:', e)
      res.status(500).end('stream error')
    }
  })

  // Stripe endpoints
  app.get('/api/billing/admin/list', async (req, res) => {
    const token = req.query.token
    const expected = env.ADMIN_TOKEN || env.VITE_ADMIN_TOKEN
    if (!expected || token !== expected) return res.status(401).json({ error: 'unauthorized' })
    if (!supabaseAdmin) return res.status(501).json({ error: 'supabase not configured' })
    const { data, error } = await supabaseAdmin.from('billing_status').select('*').order('updated_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ rows: data || [] })
  })
  app.post('/api/billing/checkout', async (req, res) => {
    const s = await getStripe()
    const priceId = STRIPE_PRICE_ID || STRIPE_PRICE_PRO
    if (!s || !priceId) return res.status(501).json({ error: 'Stripe not configured' })
    try {
      const { plan, user_id } = req.body || {}
      const session = await s.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        client_reference_id: user_id || undefined,
        metadata: user_id ? { user_id } : undefined,
        success_url: STRIPE_SUCCESS_URL,
        cancel_url: STRIPE_CANCEL_URL,
      })
      return res.json({ url: session.url })
    } catch (e) {
      console.error('Stripe checkout error:', e)
      return res.status(500).json({ error: 'Stripe checkout failed' })
    }
  })

  app.post('/api/billing/portal', async (req, res) => {
    const s = await getStripe()
    if (!s) return res.status(501).json({ error: 'Stripe not configured' })
    try {
      const { customer_id } = req.body || {}
      const fallbackId = env.STRIPE_DEFAULT_CUSTOMER_ID
      const cid = customer_id || fallbackId
      if (!cid) return res.status(400).json({ error: 'customer_id required' })
      const session = await s.billingPortal.sessions.create({
        customer: cid,
        return_url: STRIPE_SUCCESS_URL,
      })
      return res.json({ url: session.url })
    } catch (e) {
      console.error('Stripe portal error:', e)
      return res.status(500).json({ error: 'Stripe portal failed' })
    }
  })

  app.get('/api/billing/status', async (req, res) => {
    const cid = req.query.customer_id
    const uid = req.query.user_id
    if (supabaseAdmin && uid) {
      const { data, error } = await supabaseAdmin.from('billing_status').select('plan').eq('user_id', uid).maybeSingle()
      if (!error && data) return res.json({ plan: data.plan })
    }
    const s = await getStripe()
    if (s && cid) {
      try {
        const subs = await s.subscriptions.list({ customer: String(cid), status: 'active', limit: 1 })
        const plan = (subs.data && subs.data.length > 0) ? 'pro' : 'free'
        return res.json({ plan })
      } catch (e) {
        console.warn('[stripe] status error:', e.message || e)
      }
    }
    const plan = env.FORCE_PLAN === 'pro' ? 'pro' : 'free'
    res.json({ plan })
  })

  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (options?.testSkipVerify) return res.status(200).end('[ok]')
    const secret = env.STRIPE_WEBHOOK_SECRET
    const s = await getStripe()
    if (!s || !secret) return res.status(501).end('not configured')
    try {
      const sig = req.headers['stripe-signature']
      const event = s.webhooks.constructEvent(req.body, sig, secret)
      // Handle a few common events (no-ops/logs)
      switch (event.type) {
        case 'checkout.session.completed': {
          const obj = event.data.object || {}
          const customer_id = obj.customer
          const user_id = obj.client_reference_id || (obj.metadata && obj.metadata.user_id) || null
          await upsertBilling({ user_id, customer_id, plan: 'pro', current_period_end: null })
          break
        }
        case 'customer.subscription.updated':
        case 'customer.subscription.created':
        case 'customer.subscription.deleted': {
          const sub = event.data.object || {}
          const customer_id = sub.customer
          const status = sub.status
          const cpe = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null
          const plan = status === 'active' ? 'pro' : 'free'
          await upsertBilling({ user_id: null, customer_id, plan, current_period_end: cpe })
          break
        }
        default:
          break
      }
      res.status(200).end('[ok]')
    } catch (e) {
      console.error('Webhook error:', e.message || e)
      res.status(400).end('invalid signature')
    }
  })

  return app
}
