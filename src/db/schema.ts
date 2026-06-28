import Dexie, { type EntityTable } from 'dexie'
import type { Combat, Participant, CombatLogEntry, CharacterSheet, ResourceTracker } from '@/types'

class CombatTrackerDB extends Dexie {
  combats!: EntityTable<Combat, 'id'>
  participants!: EntityTable<Participant, 'id'>
  combatLog!: EntityTable<CombatLogEntry, 'id'>
  characterSheets!: EntityTable<CharacterSheet, 'id'>
  resourceTrackers!: EntityTable<ResourceTracker, 'id'>

  constructor() {
    super('DnDCombatTracker')

    this.version(2).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown',
      combatLog: 'id, combatId, round, event, timestamp',
    })

    this.version(3).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown, characterSheetId',
      combatLog: 'id, combatId, round, event, timestamp',
      characterSheets: 'id, type, name, createdAt',
    }).upgrade(tx => {
      return tx.table('participants').toCollection().modify(p => {
        if (p.characterSheetId === undefined) p.characterSheetId = null
      })
    })

    // Version 4: resource tracker for spell slots + feature usage per participant
    this.version(4).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown, characterSheetId',
      combatLog: 'id, combatId, round, event, timestamp',
      characterSheets: 'id, type, name, createdAt',
      resourceTrackers: 'id, participantId, combatId',
    })

    // Version 5: add race, racialTraits, npcClassName to characterSheets
    this.version(5).stores({
      combats: 'id, status, createdAt',
      participants: 'id, combatId, type, initiative, isAlive, isDown, characterSheetId',
      combatLog: 'id, combatId, round, event, timestamp',
      characterSheets: 'id, type, name, race, createdAt',
      resourceTrackers: 'id, participantId, combatId',
    }).upgrade(tx => {
      return tx.table('characterSheets').toCollection().modify((s: CharacterSheet) => {
        if (s.race === undefined) s.race = null
        if (s.racialTraits === undefined) s.racialTraits = []
        if (s.npcClassName === undefined) s.npcClassName = null
      })
    })
  }
}

export const db = new CombatTrackerDB()
