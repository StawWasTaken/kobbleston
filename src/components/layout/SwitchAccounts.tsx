import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Dialog } from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { forgetAccount, rememberedAccounts } from '@/lib/accounts'

export function SwitchAccounts({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState(rememberedAccounts)

  const switchTo = async (email: string) => {
    onClose()
    await signOut()
    navigate(`/login?email=${encodeURIComponent(email)}`)
  }

  const addAnother = async () => {
    onClose()
    await signOut()
    navigate('/login')
  }

  const others = accounts.filter((a) => a.id !== profile?.id)

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Switch accounts"
      description="Accounts you have used on this device. You will be asked for the password."
      size="sm"
    >
      {!others.length && (
        <p className="pb-4 text-sm text-muted">
          No other accounts here yet.
        </p>
      )}

      <ul className="space-y-1">
        {others.map((account) => (
          <li key={account.id} className="flex items-center gap-2">
            <button
              onClick={() => switchTo(account.email)}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-ink-hover"
            >
              <Avatar src={account.avatarUrl} name={account.displayName} size="md" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{account.displayName}</span>
                <span className="block truncate text-xs text-muted">@{account.username}</span>
              </span>
            </button>
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
          </li>
        ))}
      </ul>

      <Button variant="subtle" block icon={faPlus} className="mt-4" onClick={addAnother}>
        Log in to another account
      </Button>
    </Dialog>
  )
}
