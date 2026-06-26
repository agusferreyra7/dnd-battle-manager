import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db/schema'
import type { Combat, Participant, ParticipantWithStatus } from '@/types'

// ─── All combats (for home page list) ────────────────────────────────────────

export function useAllCombats(): Combat[] | undefined {
  return useLiveQuery(
    () => db.combats.orderBy('createdAt').reverse().toArray(),
    []
  )
}

// ─── Single combat ────────────────────────────────────────────────────────────

export function useCombat(id: string): Combat | undefined {
  return useLiveQuery(
    () => db.combats.get(id),
    [id]
  )
}

// ─── Participants for a combat, sorted by initiative (desc) ──────────────────

export function useParticipants(combatId: string): Participant[] | undefined {
  return useLiveQuery(
    async () => {
      const participants = await db.participants
        .where('combatId')
        .equals(combatId)
        .toArray()
      // Sort: alive first by initiative desc, then dead at the end
      return participants.sort((a, b) => {
        // Dead always sink to the bottom
        if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1
        if (b.initiative !== a.initiative) return b.initiative - a.initiative
        return a.sortOrder - b.sortOrder
      })
    },
    [combatId]
  )
}

// ─── Participants with computed UI state ──────────────────────────────────────
//
// IMPORTANT: currentTurnIndex is an index into the ALIVE-only subset of the
// sorted array. Dead participants are excluded from turn counting entirely.
// We derive the active participant's ID from that subset, then mark them in
// the full array (which includes dead, shown at the bottom).

export function useParticipantsWithStatus(
  combatId: string,
  currentTurnIndex: number
): ParticipantWithStatus[] | undefined {
  const participants = useParticipants(combatId)

  if (!participants) return undefined

  // Build the alive-only ordered list to find who is active
  const aliveInOrder = participants.filter((p) => p.isAlive)
  const activeId = aliveInOrder[currentTurnIndex]?.id ?? null

  return participants.map((p) => ({
    ...p,
    isActive: p.id === activeId,
    hpPercentage: p.maxHp > 0 ? Math.round((p.currentHp / p.maxHp) * 100) : 0,
  }))
}

// ─── Combat log ───────────────────────────────────────────────────────────────

export function useCombatLog(combatId: string) {
  return useLiveQuery(
    () =>
      db.combatLog
        .where('combatId')
        .equals(combatId)
        .sortBy('timestamp'),
    [combatId]
  )
}

// ─── Alive participant count (used for turn cycling) ─────────────────────────

export function useAliveCount(combatId: string): number | undefined {
  return useLiveQuery(
    async () => {
      const all = await db.participants.where('combatId').equals(combatId).toArray()
      return all.filter((p) => p.isAlive).length
    },
    [combatId]
  )
}
