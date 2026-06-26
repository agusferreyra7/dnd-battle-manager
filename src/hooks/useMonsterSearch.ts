import { useState, useEffect, useRef, useCallback } from 'react'
import { searchMonsters } from '@/services/open5e'
import type { Open5eMonster } from '@/types'

interface UseMonsterSearchResult {
  results: Open5eMonster[]
  isLoading: boolean
  error: string | null
  search: (query: string) => void
  clear: () => void
}

const DEBOUNCE_MS = 350
const MIN_CHARS   = 2

export function useMonsterSearch(): UseMonsterSearchResult {
  const [results, setResults]   = useState<Open5eMonster[]>([])
  const [isLoading, setLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const timerRef                = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeQueryRef          = useRef<string>('')

  const clear = useCallback(() => {
    setResults([])
    setError(null)
    setLoading(false)
    activeQueryRef.current = ''
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const search = useCallback((query: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (query.trim().length < MIN_CHARS) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    timerRef.current = setTimeout(async () => {
      const q = query.trim()
      activeQueryRef.current = q
      try {
        const data = await searchMonsters(q)
        // Only update if this is still the active query
        if (activeQueryRef.current === q) {
          setResults(data)
        }
      } catch (err) {
        if (activeQueryRef.current === q) {
          setError('No se pudo conectar con Open5e. Verificá tu conexión.')
          setResults([])
        }
      } finally {
        if (activeQueryRef.current === q) setLoading(false)
      }
    }, DEBOUNCE_MS)
  }, [])

  // Cleanup on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  return { results, isLoading, error, search, clear }
}
