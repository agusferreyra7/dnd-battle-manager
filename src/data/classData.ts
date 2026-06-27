import type { DndClass, SpellSlots, LimitedFeature } from '@/types'

export const SPELLCASTING_CLASSES = new Set<DndClass>([
  'Bard', 'Cleric', 'Druid', 'Paladin', 'Ranger',
  'Sorcerer', 'Warlock', 'Wizard',
])
export const HALF_CASTERS = new Set<DndClass>(['Paladin', 'Ranger'])

const FULL_CASTER_SLOTS: Record<number, SpellSlots> = {
  1:  { 1:2, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  2:  { 1:3, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  3:  { 1:4, 2:2, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  4:  { 1:4, 2:3, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  5:  { 1:4, 2:3, 3:2, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  6:  { 1:4, 2:3, 3:3, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  7:  { 1:4, 2:3, 3:3, 4:1, 5:0, 6:0, 7:0, 8:0, 9:0 },
  8:  { 1:4, 2:3, 3:3, 4:2, 5:0, 6:0, 7:0, 8:0, 9:0 },
  9:  { 1:4, 2:3, 3:3, 4:3, 5:1, 6:0, 7:0, 8:0, 9:0 },
  10: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:0, 7:0, 8:0, 9:0 },
  11: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:0, 8:0, 9:0 },
  12: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:0, 8:0, 9:0 },
  13: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:0, 9:0 },
  14: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:0, 9:0 },
  15: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:1, 9:0 },
  16: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:1, 9:0 },
  17: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:1, 7:1, 8:1, 9:1 },
  18: { 1:4, 2:3, 3:3, 4:3, 5:3, 6:1, 7:1, 8:1, 9:1 },
  19: { 1:4, 2:3, 3:3, 4:3, 5:3, 6:2, 7:1, 8:1, 9:1 },
  20: { 1:4, 2:3, 3:3, 4:3, 5:3, 6:2, 7:2, 8:1, 9:1 },
}

const HALF_CASTER_SLOTS: Record<number, SpellSlots> = {
  1:  { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  2:  { 1:2, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  3:  { 1:3, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  4:  { 1:3, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  5:  { 1:4, 2:2, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  6:  { 1:4, 2:2, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  7:  { 1:4, 2:3, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  8:  { 1:4, 2:3, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  9:  { 1:4, 2:3, 3:2, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  10: { 1:4, 2:3, 3:2, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  11: { 1:4, 2:3, 3:3, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  12: { 1:4, 2:3, 3:3, 4:0, 5:0, 6:0, 7:0, 8:0, 9:0 },
  13: { 1:4, 2:3, 3:3, 4:1, 5:0, 6:0, 7:0, 8:0, 9:0 },
  14: { 1:4, 2:3, 3:3, 4:1, 5:0, 6:0, 7:0, 8:0, 9:0 },
  15: { 1:4, 2:3, 3:3, 4:2, 5:0, 6:0, 7:0, 8:0, 9:0 },
  16: { 1:4, 2:3, 3:3, 4:2, 5:0, 6:0, 7:0, 8:0, 9:0 },
  17: { 1:4, 2:3, 3:3, 4:3, 5:1, 6:0, 7:0, 8:0, 9:0 },
  18: { 1:4, 2:3, 3:3, 4:3, 5:1, 6:0, 7:0, 8:0, 9:0 },
  19: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:0, 7:0, 8:0, 9:0 },
  20: { 1:4, 2:3, 3:3, 4:3, 5:2, 6:0, 7:0, 8:0, 9:0 },
}

const WARLOCK_SLOTS: Record<number, { slots: number; level: number }> = {
  1:{slots:1,level:1}, 2:{slots:2,level:1}, 3:{slots:2,level:2}, 4:{slots:2,level:2},
  5:{slots:2,level:3}, 6:{slots:2,level:3}, 7:{slots:2,level:4}, 8:{slots:2,level:4},
  9:{slots:2,level:5}, 10:{slots:2,level:5}, 11:{slots:3,level:5}, 12:{slots:3,level:5},
  13:{slots:3,level:5}, 14:{slots:3,level:5}, 15:{slots:3,level:5}, 16:{slots:3,level:5},
  17:{slots:4,level:5}, 18:{slots:4,level:5}, 19:{slots:4,level:5}, 20:{slots:4,level:5},
}

export function getSpellSlots(cls: DndClass, level: number): SpellSlots | null {
  const l = Math.max(1, Math.min(20, level))
  if (!SPELLCASTING_CLASSES.has(cls)) return null
  if (cls === 'Warlock') {
    const w = WARLOCK_SLOTS[l]
    const empty: SpellSlots = { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0 }
    ;(empty as unknown as Record<number, number>)[w.level] = w.slots
    return empty
  }
  if (HALF_CASTERS.has(cls)) return HALF_CASTER_SLOTS[l]
  return FULL_CASTER_SLOTS[l]
}

export function getLimitedFeatures(cls: DndClass, level: number): LimitedFeature[] {
  const features: LimitedFeature[] = []
  const l = level
  switch (cls) {
    case 'Barbarian':
      features.push({ name: 'Furia', uses: l<3?2:l<6?3:l<12?4:l<17?5:6, recharge: 'long' })
      if (l >= 7) features.push({ name: 'Instinto Salvaje', uses: 1, recharge: 'long' })
      break
    case 'Fighter':
      features.push({ name: 'Recuperación', uses: 1, recharge: 'short' })
      features.push({ name: 'Oleada de Acción', uses: l>=17?2:1, recharge: 'short' })
      break
    case 'Monk':
      features.push({ name: 'Puntos de Ki', uses: l, recharge: 'short' })
      if (l >= 14) features.push({ name: 'Alma de Diamante', uses: 1, recharge: 'long' })
      break
    case 'Rogue':
      if (l >= 2) features.push({ name: 'Acción Astuta', uses: 1, recharge: 'short' })
      break
    case 'Paladin':
      features.push({ name: 'Imposición de Manos', uses: l*5, recharge: 'long' })
      features.push({ name: 'Castigo Divino', uses: l>=11?2:1, recharge: 'long' })
      break
    case 'Bard':
      features.push({ name: 'Inspiración Bárdica', uses: Math.max(1, l>=5?l:1), recharge: l>=5?'short':'long' })
      if (l >= 6) features.push({ name: 'Contramagia', uses: 1, recharge: 'short' })
      break
    case 'Cleric':
      if (l >= 2) features.push({ name: 'Intervención Divina', uses: 1, recharge: 'long' })
      break
    case 'Druid':
      features.push({ name: 'Forma Salvaje', uses: 2, recharge: 'short' })
      break
    case 'Sorcerer':
      features.push({ name: 'Puntos de Hechicería', uses: l, recharge: 'long' })
      break
    case 'Warlock':
      if (l >= 11) features.push({ name: 'Arcanum Místico', uses: 1, recharge: 'long' })
      break
    case 'Wizard':
      features.push({ name: 'Recuperación Arcana', uses: 1, recharge: 'short' })
      break
    case 'Ranger':
      break
  }
  return features
}

export const SUBCLASSES: Record<DndClass, string[]> = {
  Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior'],
  Bard:      ['College of Lore', 'College of Valor'],
  Cleric:    ['Knowledge Domain', 'Life Domain', 'Light Domain', 'Nature Domain', 'Tempest Domain', 'Trickery Domain', 'War Domain'],
  Druid:     ['Circle of the Land', 'Circle of the Moon'],
  Fighter:   ['Champion', 'Battle Master', 'Eldritch Knight'],
  Monk:      ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements'],
  Paladin:   ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance'],
  Ranger:    ['Hunter', 'Beast Master'],
  Rogue:     ['Thief', 'Assassin', 'Arcane Trickster'],
  Sorcerer:  ['Draconic Bloodline', 'Wild Magic'],
  Warlock:   ['The Archfey', 'The Fiend', 'The Great Old One'],
  Wizard:    ['School of Abjuration', 'School of Conjuration', 'School of Divination', 'School of Enchantment', 'School of Evocation', 'School of Illusion', 'School of Necromancy', 'School of Transmutation'],
}

export const ALL_CLASSES: DndClass[] = [
  'Barbarian','Bard','Cleric','Druid','Fighter',
  'Monk','Paladin','Ranger','Rogue','Sorcerer','Warlock','Wizard',
]

export const ALIGNMENTS = [
  'Lawful Good','Neutral Good','Chaotic Good',
  'Lawful Neutral','True Neutral','Chaotic Neutral',
  'Lawful Evil','Neutral Evil','Chaotic Evil','Unaligned',
] as const
