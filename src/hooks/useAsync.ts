import { useCallback, useEffect, useState } from 'react'

type State<T> = { data: T | null; error: string | null; loading: boolean }

/** Small request helper: every list in the app gets loading/error/empty for free. */
export function useAsync<T>(run: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<State<T>>({ data: null, error: null, loading: true })

  const execute = useCallback(() => {
    let cancelled = false
    setState((s) => ({ ...s, loading: true, error: null }))
    run()
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            data: null,
            error: err instanceof Error ? err.message : 'Something went wrong.',
            loading: false,
          })
        }
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(execute, [execute])

  return { ...state, reload: execute, setData: (d: T) => setState({ data: d, error: null, loading: false }) }
}
