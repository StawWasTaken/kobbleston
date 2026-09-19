/**
 * What the player is asking for, and nothing about what it means.
 *
 * The controller reads this; it never reads the keyboard. That is what lets
 * the same controller be driven by a test, by a gamepad later, or by another
 * player's packets over the network.
 */
export type Intent = {
  /** -1 to 1 across and along the camera's idea of forward. */
  x: number
  z: number
  jump: boolean
  run: boolean
  /** How far the camera has been dragged this frame, in radians. */
  turn: number
  pitch: number
  emote: boolean
}

export const stillIntent = (): Intent => ({
  x: 0, z: 0, jump: false, run: false, turn: 0, pitch: 0, emote: false,
})

const KEYS: Record<string, keyof Intent | 'left' | 'right' | 'forward' | 'back'> = {
  KeyW: 'forward', ArrowUp: 'forward',
  KeyS: 'back', ArrowDown: 'back',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'run', ShiftRight: 'run',
  KeyE: 'emote',
}

/** Reads a keyboard and a dragged mouse into an intent, once per frame. */
export class Keyboard {
  private down = new Set<string>()
  private dragX = 0
  private dragY = 0
  private dragging = false
  private stop: (() => void)[] = []

  constructor(private element: HTMLElement) {
    const keyDown = (e: KeyboardEvent) => {
      if (KEYS[e.code]) { this.down.add(e.code); e.preventDefault() }
    }
    const keyUp = (e: KeyboardEvent) => this.down.delete(e.code)
    const blur = () => this.down.clear()

    const pointerDown = (e: PointerEvent) => {
      this.dragging = true
      element.setPointerCapture(e.pointerId)
    }
    const pointerUp = () => { this.dragging = false }
    const pointerMove = (e: PointerEvent) => {
      if (!this.dragging) return
      this.dragX += e.movementX
      this.dragY += e.movementY
    }

    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('blur', blur)
    element.addEventListener('pointerdown', pointerDown)
    window.addEventListener('pointerup', pointerUp)
    window.addEventListener('pointermove', pointerMove)

    this.stop = [
      () => window.removeEventListener('keydown', keyDown),
      () => window.removeEventListener('keyup', keyUp),
      () => window.removeEventListener('blur', blur),
      () => element.removeEventListener('pointerdown', pointerDown),
      () => window.removeEventListener('pointerup', pointerUp),
      () => window.removeEventListener('pointermove', pointerMove),
    ]
  }

  read(): Intent {
    const held = (name: string) => [...this.down].some((code) => KEYS[code] === name)
    const intent: Intent = {
      x: (held('right') ? 1 : 0) - (held('left') ? 1 : 0),
      z: (held('forward') ? 1 : 0) - (held('back') ? 1 : 0),
      jump: held('jump'),
      run: held('run'),
      emote: held('emote'),
      turn: -this.dragX * 0.005,
      pitch: -this.dragY * 0.005,
    }
    this.dragX = 0
    this.dragY = 0
    return intent
  }

  dispose() {
    this.stop.forEach((off) => off())
    this.element.blur?.()
  }
}
