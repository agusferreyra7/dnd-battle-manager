import type { Open5eMonster, Open5eSearchResult } from '@/types'

const BASE_URL = 'https://api.open5e.com/v1'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** D&D ability modifier from score: floor((score - 10) / 2) */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

/** Average HP from a hit dice string like "2d6+4" */
export function averageHp(hitDice: string): number {
  // pattern: NdX+C or NdX-C or NdX
  const match = hitDice.match(/(\d+)d(\d+)([+-]\d+)?/)
  if (!match) return 0
  const count    = parseInt(match[1])
  const sides    = parseInt(match[2])
  const modifier = match[3] ? parseInt(match[3]) : 0
  return Math.floor(count * ((sides + 1) / 2) + modifier)
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** Search monsters by name. Returns up to `limit` results. */
export async function searchMonsters(
  query: string,
  limit = 8
): Promise<Open5eMonster[]> {
  if (!query.trim()) return []

  const params = new URLSearchParams({
    search: query.trim(),
    limit: String(limit),
    fields: [
      'slug', 'name', 'size', 'type', 'alignment',
      'armor_class', 'armor_desc',
      'hit_points', 'hit_dice',
      'dexterity',
      'challenge_rating', 'cr',
      'senses', 'languages',
      'document__title',
    ].join(','),
  })

  const res = await fetch(`${BASE_URL}/monsters/?${params}`, {
    signal: AbortSignal.timeout(6000),
  })

  if (!res.ok) throw new Error(`Open5e error: ${res.status}`)

  const data: Open5eSearchResult = await res.json()
  return data.results
}

/** Fetch a single monster by slug for full detail. */
export async function getMonster(slug: string): Promise<Open5eMonster> {
  const res = await fetch(`${BASE_URL}/monsters/${slug}/`, {
    signal: AbortSignal.timeout(6000),
  })
  if (!res.ok) throw new Error(`Open5e error: ${res.status}`)
  return res.json()
}

/** Map an Open5e monster to ParticipantFormValues-compatible stats. */
export function monsterToFormValues(m: Open5eMonster) {
  const dexMod = abilityModifier(m.dexterity)
  return {
    name:             m.name,
    maxHp:            m.hit_points,
    armorClass:       m.armor_class,
    initiativeBonus:  dexMod,
    // Extra display info (not in form values, used for notes)
    cr:               m.challenge_rating,
    size:             m.size,
    type:             m.type,
    hitDice:          m.hit_dice,
    senses:           m.senses,
    source:           m.document__title,
  }
}
