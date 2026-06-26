// ─── Enums ───────────────────────────────────────────────────────────────────

export type ParticipantType = 'adventurer' | 'monster'

export type CombatStatus = 'setup' | 'active' | 'ended'

export type LogEventType = 'damage' | 'heal' | 'death' | 'revive' | 'condition_add' | 'condition_remove' | 'turn_start' | 'round_start'

export type Condition =
  | 'blinded'
  | 'charmed'
  | 'deafened'
  | 'exhaustion'
  | 'frightened'
  | 'grappled'
  | 'incapacitated'
  | 'invisible'
  | 'paralyzed'
  | 'petrified'
  | 'poisoned'
  | 'prone'
  | 'restrained'
  | 'stunned'
  | 'unconscious'

// ─── Death saving throws (adventurers only) ───────────────────────────────────

export interface DeathSaves {
  successes: number   // 0–3
  failures: number    // 0–3
}

// ─── Open5e API types ─────────────────────────────────────────────────────────

export interface Open5eMonster {
  slug: string
  name: string
  size: string
  type: string
  alignment: string
  armor_class: number
  armor_desc: string | null
  hit_points: number
  hit_dice: string
  speed: Record<string, number>
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  strength_save: number | null
  dexterity_save: number | null
  challenge_rating: string
  cr: number
  actions: { name: string; desc: string }[]
  special_abilities: { name: string; desc: string }[]
  legendary_actions: { name: string; desc: string }[]
  senses: string
  languages: string
  document__title: string   // source book
}

export interface Open5eSearchResult {
  count: number
  next: string | null
  previous: string | null
  results: Open5eMonster[]
}

// ─── Core models (stored in IndexedDB via Dexie) ─────────────────────────────

export interface Combat {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  status: CombatStatus
  currentTurnIndex: number
  round: number
}

export interface Participant {
  id: string
  combatId: string
  type: ParticipantType
  name: string
  maxHp: number
  currentHp: number
  temporaryHp: number
  initiative: number
  initiativeBonus: number
  armorClass: number
  conditions: Condition[]
  isAlive: boolean
  isDown: boolean
  deathSaves: DeathSaves
  sortOrder: number
  notes: string
  createdAt: Date
}

export interface CombatLogEntry {
  id: string
  combatId: string
  round: number
  turnIndex: number
  event: LogEventType
  actorId: string | null
  targetId: string | null
  value: number | null
  description: string
  timestamp: Date
}

// ─── Form / UI-only types ─────────────────────────────────────────────────────

export interface ParticipantFormValues {
  name: string
  type: ParticipantType
  maxHp: number
  armorClass: number
  initiativeBonus: number
  initiative: number | null
  notes: string
}

export interface DamageFormValues {
  amount: number
  type: 'damage' | 'heal'
  applyToTemporary: boolean
}

// ─── Derived / computed types used in UI ─────────────────────────────────────

export interface ParticipantWithStatus extends Participant {
  isActive: boolean
  hpPercentage: number
}

export interface CombatWithParticipants extends Combat {
  participants: Participant[]
  activeParticipant: Participant | null
}
