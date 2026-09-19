import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Choices } from '@/components/ui/Choices'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { updateSpaceChatSettings } from '@/lib/api'
import type { Space } from '@/types/db'

const slowmodes = [0, 3, 10, 30, 60]

/** What the owner of a Space can change about its chat. */
export function ChatSettings({ space, onSaved }: { space: Space; onSaved: () => void }) {
  const toast = useToast()
  const [enabled, setEnabled] = useState(space.chat_enabled)
  const [greeting, setGreeting] = useState(space.chat_greeting ?? '')
  const [slowmode, setSlowmode] = useState(space.chat_slowmode_seconds)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    setEnabled(space.chat_enabled)
    setGreeting(space.chat_greeting ?? '')
    setSlowmode(space.chat_slowmode_seconds)
  }, [space])

  const save = async () => {
    setPending(true)
    try {
      await updateSpaceChatSettings(space.id, {
        chat_enabled: enabled,
        chat_greeting: greeting.trim() || null,
        chat_slowmode_seconds: slowmode,
      })
      toast('Chat settings saved.', 'success')
      onSaved()
    } catch (err) {
      toast(err instanceof Error ? err.message : 'That did not save.', 'error')
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="space-y-5 p-5">
      <h3 className="text-sm font-extrabold">Chat in your Space</h3>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-ink-line bg-ink-raised p-4">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#1B34E8]"
        />
        <span>
          <span className="block text-sm font-semibold">Chat is on</span>
          <span className="mt-0.5 block text-xs text-muted">
            Turn this off and nobody can talk here, including you.
          </span>
        </span>
      </label>

      <Input
        label="Greeting"
        labelNote="optional"
        value={greeting}
        onChange={(e) => setGreeting(e.target.value)}
        maxLength={200}
        placeholder="Welcome. Do not touch the red button."
        hint="Shown at the top of the chat to everyone who walks in."
      />

      <fieldset>
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Slow mode</legend>
        <Choices
          label="How long between messages"
          value={String(slowmode)}
          options={slowmodes.map((seconds) => ({
            value: String(seconds),
            label: seconds === 0 ? 'Off' : `${seconds}s`,
          }))}
          onChange={(next) => setSlowmode(Number(next))}
        />
      </fieldset>

      <p className="text-xs leading-relaxed text-muted">
        Messages are screened automatically wherever they are sent. You can clear anything
        that still lands badly.
      </p>

      <div className="flex justify-end">
        <Button loading={pending} onClick={save}>Save chat settings</Button>
      </div>
    </Card>
  )
}
