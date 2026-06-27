import { Group, Stack, Text, Badge, Box } from '@mantine/core'
import type { SpellSlots, DndClass } from '@/types'

const SPELL_LEVEL_ORDINAL = ['1°', '2°', '3°', '4°', '5°', '6°', '7°', '8°', '9°']
const SLOT_COLOR = ['blue','violet','grape','pink','red','orange','yellow','green','teal'] as const

interface SpellSlotsDisplayProps {
  slots: SpellSlots
  className: DndClass
}

export default function SpellSlotsDisplay({ slots, className }: SpellSlotsDisplayProps) {
  const isWarlock = className === 'Warlock'
  const activeSlots = Object.entries(slots)
    .map(([lvl, count]) => ({ level: Number(lvl), count }))
    .filter(({ count }) => count > 0)

  if (activeSlots.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        {className === 'Paladin' || className === 'Ranger'
          ? 'Sin casillas de hechizo a este nivel'
          : 'Sin casillas de hechizo'}
      </Text>
    )
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" align="center">
        <Text size="sm" fw={600}>
          {isWarlock ? 'Magia de Pacto' : 'Casillas de Hechizo'}
        </Text>
        {isWarlock && (
          <Badge size="xs" color="grape" variant="light">
            Se recargan con descanso corto
          </Badge>
        )}
      </Group>
      <Group gap="sm" wrap="wrap">
        {activeSlots.map(({ level, count }) => (
          <Box
            key={level}
            style={{
              background: 'var(--mantine-color-dark-6)',
              border: '1px solid var(--mantine-color-dark-4)',
              borderRadius: 'var(--mantine-radius-md)',
              padding: '8px 14px',
              textAlign: 'center',
              minWidth: 64,
            }}
          >
            <Text size="xs" c="dimmed" fw={500}>{SPELL_LEVEL_ORDINAL[level - 1]} nivel</Text>
            <Text size="xl" fw={700} style={{ lineHeight: 1.2 }}>
              {count}
            </Text>
            <Group gap={4} justify="center" mt={4}>
              {Array.from({ length: count }).map((_, i) => (
                <Box
                  key={i}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: `var(--mantine-color-${SLOT_COLOR[level - 1]}-5)`,
                  }}
                />
              ))}
            </Group>
          </Box>
        ))}
      </Group>
    </Stack>
  )
}
