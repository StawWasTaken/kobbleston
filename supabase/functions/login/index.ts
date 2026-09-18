// Logging in with a username.
//
// Supabase signs people in with an email, so a username has to be turned into
// one first. Doing that lookup in the browser would mean handing anyone who
// knows a username the address behind it, which is an email harvesting hole.
// So the lookup happens here, behind the service role key, and the browser
// only ever sends a username and a password and gets a session back.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  let username = ''
  let password = ''
  try {
    const body = await request.json()
    username = String(body.username ?? '').trim()
    password = String(body.password ?? '')
  } catch {
    return json({ error: 'Send a username and a password.' }, 400)
  }

  if (!username || !password) return json({ error: 'Send a username and a password.' }, 400)

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

  // An email typed into the username box still works.
  let email = username.includes('@') ? username : ''

  if (!email) {
    // A name is matched whole and without case, in the database. It is not a
    // pattern: an underscore in somebody's name is an underscore.
    const { data: rows } = await admin.rpc('account_by_username', { name: username })
    const profile = Array.isArray(rows) ? rows[0] : rows

    // The same answer whether the name exists or the password is wrong, so
    // this cannot be used to find out which usernames are real.
    if (!profile || profile.is_guest) {
      return json({ error: 'Wrong username or password.' }, 400)
    }

    const { data: account } = await admin.auth.admin.getUserById(profile.id)
    email = account.user?.email ?? ''
    if (!email) return json({ error: 'Wrong username or password.' }, 400)
  }

  const anon = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data, error } = await anon.auth.signInWithPassword({ email, password })

  if (error || !data.session) {
    return json({ error: 'Wrong username or password.' }, 400)
  }

  return json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  })
})
