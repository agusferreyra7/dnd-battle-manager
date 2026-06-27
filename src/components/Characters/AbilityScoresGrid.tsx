import { Group, NumberInput, Stack, Text, Badge } from '@mantine/core'
import { abilityModifier } from '@/services/open5e'
import type { AbilityScores } from '@/types'

const ABILITIES: { key: keyof AbilityScores; label: string; short: string }[] = [
  { key: 'strength',     label: 'Fuerza',        short: 'FUE' },
  { key: 'dexterity',    label: 'Destreza',       short: 'DES' },
  { key: 'constitution', label: 'Constitución',   short: 'CON' },
  { key: 'intelligence', label: 'Inteligencia',   short: 'INT' },
  { key: 'wisdom',       label: 'Sabiduría',      short: 'SAB' },
  { key: 'charisma',     label: 'Carisma',        short: 'CAR' },
]

interface AbilityScoresGridProps {
  scores: AbilityScores
  onChange: (scores: AbilityScores) => void
}

export default function AbilityScoresGrid({ scores, onChange }: AbilityScoresGridProps) {
  function setScore(key: keyof AbilityScores, val: number) {
    onChange({ ...scores, [key]: Math.max(1, Math.min(30, val)) })
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>Estadísticas</Text>
      <Group gap="xs" wrap="wrap">
        {ABILITIES.map(({ key, label, short }) => {
          const mod = abilityModifier(scores[key])
          const modLabel = mod >= 0 ? `+${mod}` : `${mod}`
          return (
            <Stack key={key} gap={4} align="center" style={{ minWidth: 80 }}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{short}</Text>
              <NumberInput
                min={1}
                max={30}
                value={scores[key]}
                onChange={(v) => setScore(key, Number(v) || 10)}
                size="sm"
                style={{ width: 72 }}
                styles={{ input: { textAlign: 'center', fontWeight: 700, fontSize: 18 } }}
              />
              <Badge
                color={mod >= 0 ? 'blue' : 'red'}
                variant="light"
                size="sm"
                style={{ minWidth: 40, justifyContent: 'center' }}
              >
                {modLabel}
              </Badge>
              <Text size="xs" c="dimmed">{label}</Text>
            </Stack>
          )
        })}
      </Group>
    </Stack>
  )
}
