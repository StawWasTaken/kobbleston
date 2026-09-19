// Tying a Discord account to a Kobblon one.
//
// Two ways in. `/discord/start` sends somebody to Discord with a signed note
// saying who they are; `/discord/callback` is where Discord sends them back,
// with a code that is worth exactly one question: who is this? The answer is
// written against their Kobblon account with the service role, which lives
// here and nowhere a browser can read.
//
// The browser never sees the client secret, never sees the code exchange, and
// cannot write the tie itself: the database refuses that from anybody but
// this function. docs/discord.md says how to set the application up.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SITE = 'https://kobblon.com'

const CLIENT_ID = Deno.env.get('DISCORD_CLIENT_ID') ?? ''
const CLIENT_SECRET = Deno.env.get('DISCORD_CLIENT_SECRET') ?? ''
const REDIRECT = Deno.env.get('DISCORD_REDIRECT_URI') ?? ''

const admin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

const said = (message: string, status = 400) =>
  new Response(message, { status, headers: { 'content-type': 'text/plain; charset=utf-8' } })

const sendTo = (path: string) =>
  new Response(null, { status: 302, headers: { location: `${SITE}${path}` } })

/*
 * The note that travels to Discord and back. It says who asked and when, and
 * it is signed with a secret this function holds, so a made up one is worth
 * nothing: without it, anybody could hand us back a callback claiming to be
 * somebody else's link.
 */
const key = await crypto.subtle.importKey(
  'raw',
  new TextEncoder().encode(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'unset'),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign', 'verify'],
)

const sign = async (value: string) => {
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const stateFor = async (userId: string) => {
  const body = `${userId}.${Date.now()}`
  return `${body}.${await sign(body)}`
}

const whoFromState = async (state: string) => {
  const [userId, at, mac] = state.split('.')
  if (!userId || !at || !mac) return null
  if (await sign(`${userId}.${at}`) !== mac) return null
  if (Date.now() - Number(at) > 10 * 60_000) return null
  return userId
}

Deno.serve(async (request) => {
  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT) {
    return said('Discord is not set up on this Kobblon yet.', 503)
  }

  const url = new URL(request.url)
  const step = url.pathname.split('/').filter(Boolean).pop()

  // ------------------------------------------------------------ the way out
  if (step === 'start') {
    const token = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? ''
    const { data, error } = await admin.auth.getUser(token)
    if (error || !data.user) return said('Sign in to Kobblon first.', 401)

    const authorize = new URL('https://discord.com/oauth2/authorize')
    authorize.searchParams.set('client_id', CLIENT_ID)
    authorize.searchParams.set('redirect_uri', REDIRECT)
    authorize.searchParams.set('response_type', 'code')
    authorize.searchParams.set('scope', 'identify')
    authorize.searchParams.set('state', await stateFor(data.user.id))
    authorize.searchParams.set('prompt', 'consent')

    return new Response(JSON.stringify({ url: authorize.toString() }), {
      headers: { 'content-type': 'application/json' },
    })
  }

  // ------------------------------------------------------------ and back in
  if (step === 'callback') {
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') ?? ''
    if (!code) return sendTo('/settings?discord=refused')

    const who = await whoFromState(state)
    if (!who) return sendTo('/settings?discord=expired')

    const exchange = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT,
      }),
    })
    if (!exchange.ok) return sendTo('/settings?discord=failed')

    const { access_token: token } = await exchange.json()

    const me = await fetch('https://discord.com/api/users/@me', {
      headers: { authorization: `Bearer ${token}` },
    })
    if (!me.ok) return sendTo('/settings?discord=failed')

    const account = await me.json()
    const name = account.global_name || account.username || ''

    const { error } = await admin.rpc('link_discord', {
      who,
      discord: String(account.id),
      discord_name: name,
    })
    if (error) return sendTo('/settings?discord=failed')

    return sendTo('/settings?discord=linked')
  }

  return said('Nothing here.', 404)
})
