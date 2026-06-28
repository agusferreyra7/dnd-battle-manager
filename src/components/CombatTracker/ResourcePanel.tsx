import { useEffect } from 'react'
import { Stack, Group, Text, Box, ActionIcon, Tooltip, Badge, Divider } from '@mantine/core'
import { IconRefresh, IconMoon, IconSun } from '@tabler/icons-react'
import {
  getOrCreateResourceTracker,
  spendSpellSlot,
  recoverSpellSlot,
  spendFeatureUse,
  recoverFeatureUse,
  resetResourceTracker,
} from '@/db/queries'
import { useResourceTracker } from '@/hooks/useCombat'
import type { CharacterSheet, ResourceTracker } from '@/types'

// ─── Spell level ordinals ─────────────────────────────────────────────────────

const SPELL_LEVEL_LABEL = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°']
const SLOT_COLOR = [
  'blue', 'violet', 'grape', 'pink', 'red',
  'orange', 'yellow', 'green', 'teal',
] as const

// ─── Single slot pip ──────────────────────────────────────────────────────────

function SlotPip({
  used,
  color,
  onClick,
  label,
}: {
  used: boolean
  color: string
  onClick: () => void
  label: string
}) {
  return (
    <Tooltip label={label} position="top">
      <Box
        onClick={onClick}
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid var(--mantine-color-${color}-5)`,
          background: used ? `var(--mantine-color-${color}-5)` : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
          flexShrink: 0,
          // Strikethrough effect for used slots
          ...(used ? {
            boxShadow: `inset 0 0 0 3px var(--mantine-color-${color}-9)`,
          } : {}),
        }}
      >
        {used && (
          <Box
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              width: '80%',
              height: 2,
              background: 'var(--mantine-color-dark-0)',
              transform: 'translateY(-50%) rotate(-45deg)',
              borderRadius: 1,
            }}
          />
        )}
      </Box>
    </Tooltip>
  )
}

// ─── Spell slots section ──────────────────────────────────────────────────────

function SpellSlotsSection({
  sheet,
  tracker,
  participantId,
  combatId,
}: {
  sheet: CharacterSheet
  tracker: ResourceTracker
  participantId: string
  combatId: string
}) {
  if (!sheet.spellSlots) return null

  const levels = ([1,2,3,4,5,6,7,8,9] as const).filter(
    l => (sheet.spellSlots as NonNullable<typeof sheet.spellSlots>)[l] > 0
  )
  if (levels.length === 0) return null

  const isWarlock = sheet.className === 'Warlock'

  return (
    <Stack gap="xs">
      <Group gap="xs" align="center">
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
          {isWarlock ? 'Magia de Pacto' : 'Casillas de Hechizo'}
        </Text>
        {isWarlock && (
          <Badge size="xs" color="grape" variant="light">Desc. corto</Badge>
        )}
      </Group>

      <Stack gap={6}>
        {levels.map(level => {
          const total = (sheet.spellSlots as NonNullable<typeof sheet.spellSlots>)[level]
          const used  = tracker.usedSlots[level] ?? 0
          const color = SLOT_COLOR[level - 1]

          return (
            <Group key={level} gap="sm" align="center">
              <Text size="xs" c="dimmed" style={{ minWidth: 52 }}>
                {SPELL_LEVEL_LABEL[level - 1]} nivel
              </Text>
              <Group gap={4}>
                {Array.from({ length: total }).map((_, i) => (
                  <SlotPip
                    key={i}
                    used={i < used}
                    color={color}
                    label={i < used ? 'Click para recuperar casilla' : 'Click para gastar casilla'}
                    onClick={() => {
                      if (i < used) {
                        recoverSpellSlot(participantId, combatId, level)
                      } else {
                        spendSpellSlot(participantId, combatId, level, total)
                      }
                    }}
                  />
                ))}
              </Group>
              <Text size="xs" c={used >= total ? 'red' : 'dimmed'} fw={used > 0 ? 600 : 400}>
                {total - used}/{total}
              </Text>
            </Group>
          )
        })}
      </Stack>
    </Stack>
  )
}

// ─── Limited features section ─────────────────────────────────────────────────

function FeaturesSection({
  sheet,
  tracker,
  participantId,
  combatId,
}: {
  sheet: CharacterSheet
  tracker: ResourceTracker
  participantId: string
  combatId: string
}) {
  const features = sheet.limitedFeatures ?? []
  if (features.length === 0) return null

  return (
    <Stack gap="xs">
      <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
        Habilidades
      </Text>
      <Stack gap={6}>
        {features.map(feature => {
          const used  = tracker.usedFeatures[feature.name] ?? 0
          const total = feature.uses   // 0 means unlimited/passive
          if (total === 0) {
            return (
              <Group key={feature.name} justify="space-between" wrap="nowrap">
                <Text size="xs" truncate style={{ flex: 1 }}>{feature.name}</Text>
                <Badge size="xs" color="gray" variant="outline">Pasiva</Badge>
              </Group>
            )
          }

          return (
            <Group key={feature.name} gap="sm" align="center" wrap="nowrap">
              <Text size="xs" truncate style={{ flex: 1, minWidth: 0 }}>{feature.name}</Text>
              <Group gap={4} style={{ flexShrink: 0 }}>
                {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
                  <SlotPip
                    key={i}
                    used={i < used}
                    color={feature.recharge === 'short' ? 'blue' : 'indigo'}
                    label={i < used ? 'Recuperar uso' : 'Gastar uso'}
                    onClick={() => {
                      if (i < used) {
                        recoverFeatureUse(participantId, combatId, feature.name)
                      } else {
                        spendFeatureUse(participantId, combatId, feature.name, total)
                      }
                    }}
                  />
                ))}
                {total > 10 && (
                  <Text size="xs" c="dimmed">+{total - 10}</Text>
                )}
              </Group>
              <Group gap={4} style={{ flexShrink: 0 }}>
                <Badge
                  size="xs"
                  color={feature.recharge === 'short' ? 'blue' : 'indigo'}
                  variant="light"
                  leftSection={feature.recharge === 'short' ? <IconSun size={9}/> : <IconMoon size={9}/>}
                >
                  {total - used}/{total}
                </Badge>
              </Group>
            </Group>
          )
        })}
      </Stack>
    </Stack>
  )
}

// ─── Main exported component ──────────────────────────────────────────────────

interface ResourcePanelProps {
  participantId: string
  combatId: string
  sheet: CharacterSheet
}

export default function ResourcePanel({ participantId, combatId, sheet }: ResourcePanelProps) {
  const tracker = useResourceTracker(participantId)

  useEffect(() => {
    getOrCreateResourceTracker(participantId, combatId)
  }, [participantId, combatId])

  if (!tracker) return null

  const hasSlots        = sheet.spellSlots && Object.values(sheet.spellSlots).some(v => v > 0)
  const hasFeatures     = (sheet.limitedFeatures ?? []).filter(f => f.uses > 0).length > 0
  const racialTraits    = (sheet.racialTraits ?? []).filter(f => f.uses > 0)
  const hasRacialTraits = racialTraits.length > 0

  // Passive racial traits (uses === 0) — show separately without pips
  const passiveRacialTraits = (sheet.racialTraits ?? []).filter(f => f.uses === 0)

  if (!hasSlots && !hasFeatures && !hasRacialTraits && passiveRacialTraits.length === 0) {
    return (
      <Text size="xs" c="dimmed">Esta clase/raza no tiene recursos rastreables configurados.</Text>
    )
  }

  const classLabel = sheet.className ?? (sheet as CharacterSheet & { npcClassName?: string }).npcClassName ?? ''

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Stack gap={1}>
          {classLabel && (
            <Text size="xs" fw={600} c="dimmed">
              {classLabel}{sheet.level ? ` — Nivel ${sheet.level}` : ''}
              {sheet.subClass ? ` (${sheet.subClass})` : ''}
            </Text>
          )}
          {sheet.race && (
            <Text size="xs" c="violet">
              Raza: {sheet.race}
            </Text>
          )}
        </Stack>
        <Tooltip label="Resetear todos los recursos">
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={() => resetResourceTracker(participantId)}>
            <IconRefresh size={12} />
          </ActionIcon>
        </Tooltip>
      </Group>

      {hasSlots && (
        <SpellSlotsSection sheet={sheet} tracker={tracker} participantId={participantId} combatId={combatId} />
      )}

      {hasSlots && (hasFeatures || hasRacialTraits) && <Divider />}

      {hasFeatures && (
        <FeaturesSection sheet={sheet} tracker={tracker} participantId={participantId} combatId={combatId} />
      )}

      {/* Racial combat traits with limited uses */}
      {hasRacialTraits && (
        <>
          {(hasSlots || hasFeatures) && <Divider />}
          <Stack gap="xs">
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
              Rasgos Raciales — {sheet.race}
            </Text>
            <Stack gap={6}>
              {racialTraits.map(feature => {
                const used  = tracker.usedFeatures[feature.name] ?? 0
                const total = feature.uses
                return (
                  <Group key={feature.name} gap="sm" align="center" wrap="nowrap">
                    <Text size="xs" truncate style={{ flex: 1, minWidth: 0 }}>{feature.name}</Text>
                    <Group gap={4} style={{ flexShrink: 0 }}>
                      {Array.from({ length: Math.min(total, 10) }).map((_, i) => (
                        <SlotPip
                          key={i}
                          used={i < used}
                          color="violet"
                          label={i < used ? 'Recuperar uso' : 'Gastar uso'}
                          onClick={() => {
                            if (i < used) recoverFeatureUse(participantId, combatId, feature.name)
                            else spendFeatureUse(participantId, combatId, feature.name, total)
                          }}
                        />
                      ))}
                    </Group>
                    <Badge size="xs" color="violet" variant="light"
                      leftSection={feature.recharge === 'short' ? <IconSun size={9}/> : <IconMoon size={9}/>}
                    >
                      {total - used}/{total}
                    </Badge>
                  </Group>
                )
              })}
            </Stack>
          </Stack>
        </>
      )}

      {/* Passive racial traits (informational) */}
      {passiveRacialTraits.length > 0 && (
        <>
          {(hasSlots || hasFeatures || hasRacialTraits) && <Divider />}
          <Stack gap="xs">
            <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.04em' }}>
              Rasgos Pasivos — {sheet.race}
            </Text>
            <Group gap="xs" wrap="wrap">
              {passiveRacialTraits.map(f => (
                <Badge key={f.name} color="violet" variant="outline" size="sm">
                  {f.name}
                </Badge>
              ))}
            </Group>
          </Stack>
        </>
      )}
    </Stack>
  )
}

// ─── Summary badge (used in details panel) ────────────────────────────────────

export function ResourceSummaryBadge({
  sheet,
  tracker,
}: {
  sheet: CharacterSheet
  tracker: ResourceTracker | undefined
}) {
  if (!tracker) return null

  let totalSlots = 0, usedSlots = 0
  let totalUses  = 0, usedUses  = 0
  let totalRacial = 0, usedRacial = 0

  if (sheet.spellSlots) {
    for (const [lvl, count] of Object.entries(sheet.spellSlots)) {
      totalSlots += Number(count)
      usedSlots  += tracker.usedSlots[Number(lvl)] ?? 0
    }
  }
  for (const f of sheet.limitedFeatures ?? []) {
    if (f.uses > 0) { totalUses += f.uses; usedUses += tracker.usedFeatures[f.name] ?? 0 }
  }
  for (const f of sheet.racialTraits ?? []) {
    if (f.uses > 0) { totalRacial += f.uses; usedRacial += tracker.usedFeatures[f.name] ?? 0 }
  }

  if (totalSlots === 0 && totalUses === 0 && totalRacial === 0) return null

  return (
    <Group gap="xs">
      {totalSlots > 0 && (
        <Badge size="xs" color={usedSlots >= totalSlots ? 'red' : usedSlots > 0 ? 'orange' : 'blue'} variant="light">
          Hechizos: {totalSlots - usedSlots}/{totalSlots}
        </Badge>
      )}
      {totalUses > 0 && (
        <Badge size="xs" color={usedUses >= totalUses ? 'red' : usedUses > 0 ? 'orange' : 'indigo'} variant="light">
          Habilidades: {totalUses - usedUses}/{totalUses}
        </Badge>
      )}
      {totalRacial > 0 && (
        <Badge size="xs" color={usedRacial >= totalRacial ? 'red' : usedRacial > 0 ? 'orange' : 'violet'} variant="light">
          Raciales: {totalRacial - usedRacial}/{totalRacial}
        </Badge>
      )}
    </Group>
  )
}
