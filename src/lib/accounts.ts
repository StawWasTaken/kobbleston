/**
 * Accounts used on this device, so switching between them is a password away
 * rather than typing an email again.
 *
 * Only what is needed to show a face and a name is kept. Sessions are not:
 * holding several refresh tokens in the browser would mean one stolen token
 * hands over every account, so switching asks for the password again.
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

export function rememberAccount(account: Omit<RememberedAccount, 'lastUsed'>) {
  if (!account.email) return
  const rest = read().filter((a) => a.id !== account.id)
  write([{ ...account, lastUsed: Date.now() }, ...rest])
}

export function forgetAccount(id: string) {
  write(read().filter((a) => a.id !== id))
}
