import { createApp } from './assistant-app.mjs'

const app = createApp(process.env)
const port = process.env.ASSISTANT_PORT || 8787
app.listen(port, () => {
  console.log(`[assistant-server] listening on http://localhost:${port}`)
})
