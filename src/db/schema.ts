import Dexie, { type EntityTable } from 'dexie'
import type { Combat, Participant, CombatLogEntry } from '@/types'

class CombatTrackerDB extends Dexie {
  combats!: EntityTable<Combat, 'id'>
  participants!: EntityTable<Participant, 'id'>
  combatLog!: EntityTable<CombatLogEntry, 'id'>

  constructor() {
    super('DnDCombatTracker')
    this.version(2).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown',
      combatLog: 'id, combatId, round, event, timestamp',
    })
  }
}

export const db = new CombatTrackerDB()
