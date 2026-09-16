/**
 * Accounts used on this device.
 *
 * Switching is instant, so the session for each account is kept here, not
 * just its name. That is a deliberate trade: anything able to read this
 * origin's storage can reach every account listed, rather than only the one
 * signed in. Logging an account out drops its tokens, and a guest is never
 * stored at all.
 */
const KEY = 'kobbleston.accounts'
const LIMIT = 5

export type RememberedAccount = {
  id: string
  email: string
  username: string
  displayName: string
  avatarUrl: string | null
  lastUsed: number
  session?: { access_token: string; refresh_token: string }
}

function read(): RememberedAccount[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as RememberedAccount[]) : []
  } catch {
    return []
  }
}

function write(accounts: RememberedAccount[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(accounts.slice(0, LIMIT)))
  } catch {
    // Private windows and blocked storage are fine; switching just is not
    // offered there.
  }
}

export function rememberedAccounts(): RememberedAccount[] {
  return read().sort((a, b) => b.lastUsed - a.lastUsed)
}

export function rememberAccount(
  account: Omit<RememberedAccount, 'lastUsed' | 'session'>,
  session?: RememberedAccount['session'],
) {
  const existing = read().find((a) => a.id === account.id)
  const rest = read().filter((a) => a.id !== account.id)
  write([
    {
      ...account,
      // Keep whatever session we already hold when this call has none.
      session: session ?? existing?.session,
      lastUsed: Date.now(),
    },
    ...rest,
  ])
}

/** Drops the tokens but keeps the name, so the account stays offerable. */
export function clearAccountSession(id: string) {
  write(read().map((a) => (a.id === id ? { ...a, session: undefined } : a)))
}

export function forgetAccount(id: string) {
  write(read().filter((a) => a.id !== id))
}
