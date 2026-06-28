import { v4 as uuidv4 } from 'uuid'
import { db } from './schema'
import type {
  Combat,
  CombatStatus,
  CombatLogEntry,
  Participant,
  ParticipantType,
  ParticipantFormValues,
  Condition,
  CharacterSheet,
  ResourceTracker,
} from '@/types'

// ─── Combat CRUD ──────────────────────────────────────────────────────────────

export async function createCombat(name: string): Promise<Combat> {
  const now = new Date()
  const combat: Combat = {
    id: uuidv4(),
    name,
    createdAt: now,
    updatedAt: now,
    status: 'setup',
    currentTurnIndex: 0,
    round: 1,
  }
  await db.combats.add(combat)
  return combat
}

export async function updateCombat(
  id: string,
  changes: Partial<Omit<Combat, 'id' | 'createdAt'>>
): Promise<void> {
  await db.combats.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteCombat(id: string): Promise<void> {
  await db.transaction('rw', db.combats, db.participants, db.combatLog, async () => {
    await db.combats.delete(id)
    await db.participants.where('combatId').equals(id).delete()
    await db.combatLog.where('combatId').equals(id).delete()
  })
}

export async function getCombat(id: string): Promise<Combat | undefined> {
  return db.combats.get(id)
}

export async function getAllCombats(): Promise<Combat[]> {
  return db.combats.orderBy('createdAt').reverse().toArray()
}

// ─── Participant CRUD ─────────────────────────────────────────────────────────

export async function addParticipant(
  combatId: string,
  formValues: ParticipantFormValues,
  characterSheetId: string | null = null
): Promise<Participant> {
  const now = new Date()
  const existingCount = await db.participants.where('combatId').equals(combatId).count()

  const participant: Participant = {
    id: uuidv4(),
    combatId,
    characterSheetId,
    type: formValues.type,
    name: formValues.name,
    maxHp: formValues.maxHp,
    currentHp: formValues.maxHp,
    temporaryHp: 0,
    initiative: formValues.initiative ?? 0,
    initiativeBonus: formValues.initiativeBonus,
    armorClass: formValues.armorClass,
    conditions: [],
    isAlive: true,
    isDown: false,
    deathSaves: { successes: 0, failures: 0 },
    sortOrder: existingCount,
    notes: formValues.notes,
    createdAt: now,
  }

  await db.participants.add(participant)
  return participant
}

/** Add a participant directly from a saved CharacterSheet. */
export async function addParticipantFromSheet(
  combatId: string,
  sheet: CharacterSheet,
  initiative: number
): Promise<Participant> {
  const dexMod = sheet.abilityScores
    ? Math.floor((sheet.abilityScores.dexterity - 10) / 2)
    : 0

  const type: ParticipantType = sheet.type === 'adventurer' ? 'adventurer' : 'monster'

  return addParticipant(
    combatId,
    {
      name:            sheet.name,
      type,
      maxHp:           sheet.maxHp,
      armorClass:      sheet.armorClass,
      initiativeBonus: dexMod,
      initiative,
      notes:           sheet.notes,
    },
    sheet.id
  )
}

export async function updateParticipant(
  id: string,
  changes: Partial<Omit<Participant, 'id' | 'combatId' | 'createdAt'>>
): Promise<void> {
  await db.participants.update(id, changes)
}

export async function removeParticipant(id: string): Promise<void> {
  await db.participants.delete(id)
}

export async function getParticipantsByCombat(combatId: string): Promise<Participant[]> {
  return db.participants
    .where('combatId')
    .equals(combatId)
    .sortBy('initiative')
    .then((arr) => arr.reverse())
}

// ─── HP management ───────────────────────────────────────────────────────────

export async function applyDamage(
  participant: Participant,
  amount: number,
  combatRound: number,
  turnIndex: number
): Promise<void> {
  let remaining = amount
  let newTempHp = participant.temporaryHp
  let newCurrentHp = participant.currentHp

  if (newTempHp > 0) {
    const absorbed = Math.min(newTempHp, remaining)
    newTempHp -= absorbed
    remaining -= absorbed
  }

  newCurrentHp = Math.max(0, newCurrentHp - remaining)
  const dropsToZero = newCurrentHp === 0

  const isAdventurer = participant.type === 'adventurer'
  const isAlive = isAdventurer ? true : !dropsToZero
  const isDown  = isAdventurer && dropsToZero
  const monsterDied = !isAdventurer && dropsToZero

  await db.transaction('rw', db.participants, db.combats, db.combatLog, async () => {
    // 1. Update the participant
    await db.participants.update(participant.id, {
      currentHp: newCurrentHp,
      temporaryHp: newTempHp,
      isAlive,
      isDown,
      ...(isDown && !participant.isDown ? { deathSaves: { successes: 0, failures: 0 } } : {}),
    })

    // 2. If a monster died mid-turn, correct currentTurnIndex atomically so
    //    the alive-only index stays coherent with the now-smaller array.
    //
    //    The alive array order mirrors the UI sort: alive by initiative desc,
    //    dead at the bottom. When a monster is removed from that array, every
    //    slot after its position shifts left by one.
    //
    //    Rules:
    //      deadPosition < currentTurnIndex  → shift pointer left by 1
    //      deadPosition >= currentTurnIndex → pointer is unaffected
    //      (if it was the active participant's own turn, position === index
    //       and we do NOT shift — the pointer will naturally land on the next
    //       alive participant after the removal)
    if (monsterDied) {
      const combat = await db.combats.get(participant.combatId)
      if (combat) {
        const allParticipants = await db.participants
          .where('combatId')
          .equals(participant.combatId)
          .toArray()

        // Position of the dying participant in the current alive order
        // (participant.isAlive is still true in DB at this point — we just wrote
        //  isAlive=false above inside the same transaction, so Dexie reflects it)
        // We sort the same way as useParticipants does in the hook
        const aliveBeforeDeath = allParticipants
          .filter((p) => p.isAlive)           // Dexie already sees isAlive=false for this one
          .sort((a, b) => {
            if (b.initiative !== a.initiative) return b.initiative - a.initiative
            return a.sortOrder - b.sortOrder
          })

        // aliveBeforeDeath excludes the dead monster because we updated it above.
        // To find its old position we reconstruct the pre-death order including it.
        const aliveIncludingDead = [
          ...aliveBeforeDeath,
          participant,
        ].sort((a, b) => {
          if (b.initiative !== a.initiative) return b.initiative - a.initiative
          return a.sortOrder - b.sortOrder
        })

        const deadPosition = aliveIncludingDead.findIndex((p) => p.id === participant.id)
        const newAliveCount = aliveBeforeDeath.length

        let newTurnIndex = combat.currentTurnIndex

        if (deadPosition !== -1 && deadPosition < combat.currentTurnIndex) {
          newTurnIndex = combat.currentTurnIndex - 1
        }

        // Clamp: if we ended up out of range (e.g. last alive died), reset to 0
        newTurnIndex = newAliveCount > 0
          ? Math.max(0, Math.min(newTurnIndex, newAliveCount - 1))
          : 0

        if (newTurnIndex !== combat.currentTurnIndex) {
          await db.combats.update(participant.combatId, {
            currentTurnIndex: newTurnIndex,
            updatedAt: new Date(),
          })
        }
      }
    }

    // 3. Log the event
    await db.combatLog.add({
      id: uuidv4(),
      combatId: participant.combatId,
      round: combatRound,
      turnIndex,
      event: dropsToZero && !isAdventurer ? 'death' : 'damage',
      actorId: null,
      targetId: participant.id,
      value: amount,
      description: dropsToZero
        ? isAdventurer
          ? `${participant.name} cayó abatido (0 HP) — tirando salvaciones contra la muerte`
          : `${participant.name} fue eliminado (0 HP)`
        : `${participant.name} recibió ${amount} de daño (HP: ${participant.currentHp} → ${newCurrentHp})`,
      timestamp: new Date(),
    })
  })
}

export async function applyHeal(
  participant: Participant,
  amount: number,
  combatRound: number,
  turnIndex: number
): Promise<void> {
  const newCurrentHp = Math.min(participant.maxHp, participant.currentHp + amount)
  const stabilized = participant.isDown && newCurrentHp > 0

  await db.participants.update(participant.id, {
    currentHp: newCurrentHp,
    isAlive: true,
    isDown: stabilized ? false : participant.isDown,
    ...(stabilized ? { deathSaves: { successes: 0, failures: 0 } } : {}),
  })

  await addLogEntry({
    combatId: participant.combatId,
    round: combatRound,
    turnIndex,
    event: stabilized ? 'revive' : 'heal',
    actorId: null,
    targetId: participant.id,
    value: amount,
    description: stabilized
      ? `${participant.name} fue estabilizado y recuperó ${amount} HP`
      : `${participant.name} recuperó ${amount} HP (${participant.currentHp} → ${newCurrentHp})`,
  })
}

/** Add temporary HP to a participant. Temp HP don't stack — only the higher value is kept. */
export async function applyTempHp(
  participant: Participant,
  amount: number,
  combatRound: number,
  turnIndex: number
): Promise<void> {
  // D&D 5e rule: temp HP don't stack; take the higher value
  const newTempHp = Math.max(participant.temporaryHp, amount)
  const actually  = newTempHp - participant.temporaryHp  // net change (may be 0 if existing is higher)

  await db.participants.update(participant.id, { temporaryHp: newTempHp })

  await addLogEntry({
    combatId: participant.combatId,
    round: combatRound,
    turnIndex,
    event: 'heal',
    actorId: null,
    targetId: participant.id,
    value: amount,
    description: actually > 0
      ? `${participant.name} recibió ${amount} HP temporales (total: ${newTempHp})`
      : `${participant.name} ya tiene ${participant.temporaryHp} HP temporales (${amount} ignorados)`,
  })
}

// ─── Death saving throws ──────────────────────────────────────────────────────

export async function registerDeathSave(
  participant: Participant,
  result: 'success' | 'failure'
): Promise<'stable' | 'dead' | 'ongoing'> {
  const current = participant.deathSaves
  const updated = {
    successes: result === 'success' ? Math.min(3, current.successes + 1) : current.successes,
    failures:  result === 'failure' ? Math.min(3, current.failures  + 1) : current.failures,
  }

  if (updated.successes >= 3) {
    // Stabilized — stays at 0 HP but no longer rolling
    await db.participants.update(participant.id, {
      deathSaves: updated,
      isDown: false,
    })
    return 'stable'
  }

  if (updated.failures >= 3) {
    // Truly dead
    await db.participants.update(participant.id, {
      deathSaves: updated,
      isDown: false,
      isAlive: false,
    })
    return 'dead'
  }

  await db.participants.update(participant.id, { deathSaves: updated })
  return 'ongoing'
}

export async function resetDeathSaves(participantId: string): Promise<void> {
  await db.participants.update(participantId, {
    deathSaves: { successes: 0, failures: 0 },
  })
}

// ─── Conditions ───────────────────────────────────────────────────────────────

export async function toggleCondition(
  participant: Participant,
  condition: Condition
): Promise<void> {
  const has = participant.conditions.includes(condition)
  const updated = has
    ? participant.conditions.filter((c) => c !== condition)
    : [...participant.conditions, condition]
  await db.participants.update(participant.id, { conditions: updated })
}

// ─── Turn / round management ──────────────────────────────────────────────────

export async function advanceTurn(
  combat: Combat,
  totalAliveParticipants: number
): Promise<void> {
  const nextIndex = combat.currentTurnIndex + 1
  if (nextIndex >= totalAliveParticipants) {
    await updateCombat(combat.id, { currentTurnIndex: 0, round: combat.round + 1 })
    await addLogEntry({
      combatId: combat.id,
      round: combat.round + 1,
      turnIndex: 0,
      event: 'round_start',
      actorId: null,
      targetId: null,
      value: null,
      description: `── Ronda ${combat.round + 1} ──`,
    })
  } else {
    await updateCombat(combat.id, { currentTurnIndex: nextIndex })
  }
}

// ─── Combat log ──────────────────────────────────────────────────────────────

type NewLogEntry = Omit<CombatLogEntry, 'id' | 'timestamp'>

export async function addLogEntry(entry: NewLogEntry): Promise<void> {
  await db.combatLog.add({ ...entry, id: uuidv4(), timestamp: new Date() })
}

export async function getLogByCombat(combatId: string): Promise<CombatLogEntry[]> {
  return db.combatLog.where('combatId').equals(combatId).sortBy('timestamp')
}

// ─── Initiative helpers ───────────────────────────────────────────────────────

export function rollInitiative(bonus: number): number {
  return Math.floor(Math.random() * 20) + 1 + bonus
}

export async function rollAllInitiatives(combatId: string): Promise<void> {
  const participants = await db.participants.where('combatId').equals(combatId).toArray()
  await db.transaction('rw', db.participants, async () => {
    for (const p of participants) {
      await db.participants.update(p.id, { initiative: rollInitiative(p.initiativeBonus) })
    }
  })
}

export async function setCombatStatus(id: string, status: CombatStatus): Promise<void> {
  await updateCombat(id, { status })
}

// ─── Character Sheet CRUD ─────────────────────────────────────────────────────

export async function createCharacterSheet(
  data: Omit<CharacterSheet, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CharacterSheet> {
  const now = new Date()
  const sheet: CharacterSheet = { ...data, id: uuidv4(), createdAt: now, updatedAt: now }
  await db.characterSheets.add(sheet)
  return sheet
}

export async function updateCharacterSheet(
  id: string,
  changes: Partial<Omit<CharacterSheet, 'id' | 'createdAt'>>
): Promise<void> {
  await db.characterSheets.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteCharacterSheet(id: string): Promise<void> {
  await db.characterSheets.delete(id)
}

export async function getAllCharacterSheets(): Promise<CharacterSheet[]> {
  return db.characterSheets.orderBy('createdAt').reverse().toArray()
}

export async function getCharacterSheet(id: string): Promise<CharacterSheet | undefined> {
  return db.characterSheets.get(id)
}

// ─── Resource Tracker (spell slots + feature uses in combat) ──────────────────

export async function getOrCreateResourceTracker(
  participantId: string,
  combatId: string
): Promise<ResourceTracker> {
  const existing = await db.resourceTrackers.get(participantId)
  if (existing) return existing

  const tracker: ResourceTracker = {
    id: participantId,          // 1:1 with participant — same id for simplicity
    participantId,
    combatId,
    usedSlots: {},
    usedFeatures: {},
  }
  await db.resourceTrackers.add(tracker)
  return tracker
}

/** Spend one slot of the given spell level. No-op if already at max. */
export async function spendSpellSlot(
  participantId: string,
  combatId: string,
  level: number,
  maxSlots: number
): Promise<void> {
  const tracker = await getOrCreateResourceTracker(participantId, combatId)
  const current = tracker.usedSlots[level] ?? 0
  if (current >= maxSlots) return
  await db.resourceTrackers.update(participantId, {
    usedSlots: { ...tracker.usedSlots, [level]: current + 1 },
  })
}

/** Recover one slot of the given spell level (un-spend). */
export async function recoverSpellSlot(
  participantId: string,
  combatId: string,
  level: number
): Promise<void> {
  const tracker = await getOrCreateResourceTracker(participantId, combatId)
  const current = tracker.usedSlots[level] ?? 0
  if (current <= 0) return
  await db.resourceTrackers.update(participantId, {
    usedSlots: { ...tracker.usedSlots, [level]: current - 1 },
  })
}

/** Spend one use of a limited feature. No-op if already exhausted. */
export async function spendFeatureUse(
  participantId: string,
  combatId: string,
  featureName: string,
  maxUses: number
): Promise<void> {
  const tracker = await getOrCreateResourceTracker(participantId, combatId)
  const current = tracker.usedFeatures[featureName] ?? 0
  if (maxUses > 0 && current >= maxUses) return
  await db.resourceTrackers.update(participantId, {
    usedFeatures: { ...tracker.usedFeatures, [featureName]: current + 1 },
  })
}

/** Recover one use of a limited feature. */
export async function recoverFeatureUse(
  participantId: string,
  combatId: string,
  featureName: string
): Promise<void> {
  const tracker = await getOrCreateResourceTracker(participantId, combatId)
  const current = tracker.usedFeatures[featureName] ?? 0
  if (current <= 0) return
  await db.resourceTrackers.update(participantId, {
    usedFeatures: { ...tracker.usedFeatures, [featureName]: current - 1 },
  })
}

/** Reset all resource usage for a participant (e.g. after a long rest). */
export async function resetResourceTracker(participantId: string): Promise<void> {
  await db.resourceTrackers.update(participantId, {
    usedSlots: {},
    usedFeatures: {},
  })
}

// ─── Tie-break resolution ─────────────────────────────────────────────────────

/** Returns groups of alive participants that share the same initiative value (ties). */
export async function getTieGroups(combatId: string): Promise<Participant[][]> {
  const all = await db.participants
    .where('combatId')
    .equals(combatId)
    .toArray()

  const alive = all.filter(p => p.isAlive)

  // Group by initiative
  const byInit: Record<number, Participant[]> = {}
  for (const p of alive) {
    if (!byInit[p.initiative]) byInit[p.initiative] = []
    byInit[p.initiative].push(p)
  }

  // Only return groups with 2+ participants
  return Object.values(byInit)
    .filter(group => group.length >= 2)
    .sort((a, b) => b[0].initiative - a[0].initiative)
}

/**
 * Write the resolved order for a tie group.
 * `orderedIds` is the full ordered list of participant IDs for that initiative value,
 * from first to last. We assign sortOrder 0, 1, 2... accordingly.
 */
export async function resolveTieGroup(
  orderedIds: string[],
  baseOrder: number
): Promise<void> {
  await db.transaction('rw', db.participants, async () => {
    for (let i = 0; i < orderedIds.length; i++) {
      await db.participants.update(orderedIds[i], { sortOrder: baseOrder + i })
    }
  })
}
