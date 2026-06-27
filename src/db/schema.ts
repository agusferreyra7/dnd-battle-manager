import Dexie, { type EntityTable } from 'dexie'
import type { Combat, Participant, CombatLogEntry, CharacterSheet } from '@/types'

class CombatTrackerDB extends Dexie {
  combats!: EntityTable<Combat, 'id'>
  participants!: EntityTable<Participant, 'id'>
  combatLog!: EntityTable<CombatLogEntry, 'id'>
  characterSheets!: EntityTable<CharacterSheet, 'id'>

  constructor() {
    super('DnDCombatTracker')

    this.version(2).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown',
      combatLog: 'id, combatId, round, event, timestamp',
    })

    // Version 3: add character sheets table + characterSheetId on participants
    this.version(3).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown, characterSheetId',
      combatLog: 'id, combatId, round, event, timestamp',
      characterSheets: 'id, type, name, createdAt',
    }).upgrade(tx => {
      // Patch existing participants with the new field
      return tx.table('participants').toCollection().modify(p => {
        if (p.characterSheetId === undefined) p.characterSheetId = null
      })
    })
  }
}

export const db = new CombatTrackerDB()
