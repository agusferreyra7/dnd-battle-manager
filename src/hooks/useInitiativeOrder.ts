import { useCallback } from 'react'
import { rollInitiative, rollAllInitiatives } from '@/db/queries'
import { db } from '@/db/schema'

// ─── Single roll ──────────────────────────────────────────────────────────────

export function useInitiativeRoll() {
  const rollOne = useCallback((bonus: number): number => {
    return rollInitiative(bonus)
  }, [])

  const rollAll = useCallback(async (combatId: string): Promise<void> => {
    await rollAllInitiatives(combatId)
  }, [])

  const setManual = useCallback(
    async (participantId: string, value: number): Promise<void> => {
      await db.participants.update(participantId, { initiative: value })
    },
    []
  )

  return { rollOne, rollAll, setManual }
}
