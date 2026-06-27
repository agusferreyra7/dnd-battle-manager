// ─── Enums ───────────────────────────────────────────────────────────────────

export type ParticipantType = 'adventurer' | 'monster'
export type CharacterSheetType = 'adventurer' | 'npc' | 'monster'
export type CombatStatus = 'setup' | 'active' | 'ended'
export type LogEventType = 'damage' | 'heal' | 'death' | 'revive' | 'condition_add' | 'condition_remove' | 'turn_start' | 'round_start'

export type Condition =
  | 'blinded' | 'charmed' | 'deafened' | 'exhaustion' | 'frightened'
  | 'grappled' | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified'
  | 'poisoned' | 'prone' | 'restrained' | 'stunned' | 'unconscious'

export type Alignment =
  | 'Lawful Good' | 'Neutral Good' | 'Chaotic Good'
  | 'Lawful Neutral' | 'True Neutral' | 'Chaotic Neutral'
  | 'Lawful Evil' | 'Neutral Evil' | 'Chaotic Evil'
  | 'Unaligned'

export type DndClass =
  | 'Barbarian' | 'Bard' | 'Cleric' | 'Druid' | 'Fighter'
  | 'Monk' | 'Paladin' | 'Ranger' | 'Rogue' | 'Sorcerer'
  | 'Warlock' | 'Wizard'

// ─── Ability scores ───────────────────────────────────────────────────────────

export interface AbilityScores {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

// ─── Spell slots per level ────────────────────────────────────────────────────

export interface SpellSlots {
  1: number; 2: number; 3: number; 4: number; 5: number
  6: number; 7: number; 8: number; 9: number
}

// ─── Limited-use features (short/long rest) ───────────────────────────────────

export interface LimitedFeature {
  name: string
  uses: number
  recharge: 'short' | 'long'
}

// ─── Death saving throws (adventurers in combat only) ─────────────────────────

export interface DeathSaves {
  successes: number
  failures: number
}

// ─── Character Sheet — persistent entity (not tied to a combat) ──────────────

export interface CharacterSheet {
  id: string
  type: CharacterSheetType
  name: string
  maxHp: number
  armorClass: number
  createdAt: Date
  updatedAt: Date

  // Optional shared
  abilityScores: AbilityScores | null
  alignment: Alignment | null
  notes: string

  // Adventurer-only
  className: DndClass | null
  subClass: string | null
  level: number | null
  spellSlots: SpellSlots | null          // computed from class+level, stored for display
  limitedFeatures: LimitedFeature[]      // class features with limited uses
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
  document__title: string
}

export interface Open5eSearchResult {
  count: number
  next: string | null
  previous: string | null
  results: Open5eMonster[]
}

// ─── Core combat models ───────────────────────────────────────────────────────

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
  // If participant was added from a CharacterSheet, store the reference
  characterSheetId: string | null
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
