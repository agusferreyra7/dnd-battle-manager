import { Drawer, Stack, Text, Group, Badge, ScrollArea } from '@mantine/core'
import type { CombatLogEntry } from '@/types'

interface CombatLogDrawerProps {
  opened: boolean
  onClose: () => void
  log: CombatLogEntry[]
}

// ─── Event color / label ──────────────────────────────────────────────────────

const EVENT_STYLE: Record<
  CombatLogEntry['event'],
  { color: string; label: string }
> = {
  damage:           { color: 'red',    label: 'Daño' },
  heal:             { color: 'green',  label: 'Curación' },
  death:            { color: 'dark',   label: '☠ Caído' },
  revive:           { color: 'teal',   label: '✨ Revivido' },
  condition_add:    { color: 'orange', label: 'Condición' },
  condition_remove: { color: 'gray',   label: 'Condición quitada' },
  turn_start:       { color: 'blue',   label: 'Turno' },
  round_start:      { color: 'violet', label: 'Ronda' },
}

export default function CombatLogDrawer({
  opened,
  onClose,
  log,
}: CombatLogDrawerProps) {
  // Group log entries by round
  const byRound = log.reduce<Record<number, CombatLogEntry[]>>((acc, entry) => {
    if (!acc[entry.round]) acc[entry.round] = []
    acc[entry.round].push(entry)
    return acc
  }, {})

  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => b - a) // most recent round first

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Historial de combate</Text>}
      position="right"
      size="sm"
    >
      <ScrollArea h="calc(100vh - 80px)">
        <Stack gap="md" pb="xl">
          {rounds.length === 0 && (
            <Text c="dimmed" size="sm" ta="center" mt="xl">
              No hay eventos registrados todavía
            </Text>
          )}

          {rounds.map((round) => (
            <Stack key={round} gap="xs">
              <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                — Ronda {round} —
              </Text>

              {byRound[round]
                .filter((e) => e.event !== 'round_start' && e.event !== 'turn_start')
                .map((entry) => {
                  const style = EVENT_STYLE[entry.event]
                  return (
                    <Group key={entry.id} gap="xs" wrap="nowrap" align="flex-start">
                      <Badge
                        color={style.color}
                        variant="light"
                        size="xs"
                        style={{ flexShrink: 0, marginTop: 2 }}
                      >
                        {style.label}
                      </Badge>
                      <Text size="xs" c="dimmed" style={{ flex: 1 }}>
                        {entry.description}
                      </Text>
                    </Group>
                  )
                })}
            </Stack>
          ))}
        </Stack>
      </ScrollArea>
    </Drawer>
  )
}
