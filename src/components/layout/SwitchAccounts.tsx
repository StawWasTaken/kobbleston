import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faRightToBracket, faUserPlus, faXmark, faKey } from '@fortawesome/free-solid-svg-icons'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAuth } from '@/hooks/useAuth'
import { forgetAccount, rememberedAccounts } from '@/lib/accounts'
import type { RememberedAccount } from '@/lib/accounts'

export function SwitchAccounts({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, switchTo, signOut } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState(rememberedAccounts)
  const [busy, setBusy] = useState<string | null>(null)

  const use = async (account: RememberedAccount) => {
    setBusy(account.id)
    try {
      // A stored session switches straight over. Without one, or if it has
      // expired, the account signs in again with its name filled in.
      if (await switchTo(account)) {
        onClose()
        navigate('/home')
        return
      }
      onClose()
      await signOut()
      navigate(`/login?username=${encodeURIComponent(account.username)}`)
    } finally {
      setBusy(null)
      setAccounts(rememberedAccounts())
    }
  }

  const goTo = async (path: string) => {
    onClose()
    await signOut()
    navigate(path)
  }

  const others = accounts.filter((a) => a.id !== profile?.id)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Switch accounts"
      description="Accounts you have used on this device."
      size="sm"
    >
      {!others.length && <p className="pb-4 text-sm text-muted">No other accounts here yet.</p>}

      <ul className="space-y-1">
        {others.map((account) => (
          <li key={account.id} className="flex items-center gap-2">
            <button
              onClick={() => use(account)}
              disabled={busy === account.id}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-ink-hover disabled:opacity-60"
            >
              <Avatar src={account.avatarUrl} name={account.displayName} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{account.displayName}</span>
                <span className="block truncate text-xs text-muted">@{account.username}</span>
              </span>
              {!account.session && (
                <Tooltip label="Signed out here. Switching will ask for the password." side="left">
                  <span className="shrink-0 text-white/30">
                    <FontAwesomeIcon icon={faKey} />
                  </span>
                </Tooltip>
              )}
            </button>

            <Tooltip label={`Forget ${account.displayName}`} side="left">
              <button
                onClick={() => {
                  forgetAccount(account.id)
                  setAccounts(rememberedAccounts())
                }}
                aria-label={`Forget ${account.displayName}`}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white/35 transition-colors hover:bg-ink-hover hover:text-white"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </Tooltip>
          </li>
        ))}
      </ul>

      <div className="mt-4 space-y-2">
        <Button variant="subtle" block icon={faRightToBracket} onClick={() => goTo('/login')}>
          Log in to another account
        </Button>
        <Button block icon={faUserPlus} onClick={() => goTo('/signup')}>
          Create a new account
        </Button>
      </div>
    </Dialog>
  )
}
