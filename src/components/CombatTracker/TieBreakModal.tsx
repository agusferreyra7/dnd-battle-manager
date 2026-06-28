import { useState, useEffect } from 'react'
import {
  Modal, Stack, Text, Group, Badge, Card, ActionIcon,
  Button, Divider, Box, Alert
} from '@mantine/core'
import {
  IconArrowUp, IconArrowDown, IconSword, IconAlertTriangle
} from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import { getTieGroups, resolveTieGroup } from '@/db/queries'
import type { Participant } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TieGroup {
  initiative: number
  participants: Participant[]
}

interface TieBreakModalProps {
  combatId: string
  opened: boolean
  onClose: () => void
}

// ─── Single group editor ──────────────────────────────────────────────────────

function TieGroupEditor({
  group,
  onChange,
}: {
  group: TieGroup
  onChange: (ordered: Participant[]) => void
}) {
  const [order, setOrder] = useState<Participant[]>(group.participants)

  // Sync upward whenever order changes
  useEffect(() => {
    onChange(order)
  }, [order])

  function moveUp(index: number) {
    if (index === 0) return
    const next = [...order]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    setOrder(next)
  }

  function moveDown(index: number) {
    if (index === order.length - 1) return
    const next = [...order]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    setOrder(next)
  }

  return (
    <Stack gap="xs">
      <Group gap="xs" align="center">
        <Badge color="orange" variant="filled" size="sm">
          Iniciativa {group.initiative}
        </Badge>
        <Text size="xs" c="dimmed">
          {group.participants.length} participantes — arrastrá para reordenar
        </Text>
      </Group>

      <Stack gap="xs">
        {order.map((p, i) => {
          const isAdventurer = p.type === 'adventurer'
          return (
            <Card
              key={p.id}
              withBorder
              padding="xs"
              radius="sm"
              style={{
                borderColor: isAdventurer
                  ? 'var(--mantine-color-blue-4)'
                  : 'var(--mantine-color-red-4)',
              }}
            >
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  {/* Position indicator */}
                  <Box
                    style={{
                      width: 24, height: 24, borderRadius: '50%',
                      background: i === 0
                        ? 'var(--mantine-color-yellow-5)'
                        : 'var(--mantine-color-dark-5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Text size="xs" fw={700} c={i === 0 ? 'dark' : 'dimmed'}>
                      {i + 1}
                    </Text>
                  </Box>

                  <Stack gap={1}>
                    <Group gap="xs">
                      <Text size="sm" fw={600}>{p.name}</Text>
                      <Badge
                        color={isAdventurer ? 'blue' : 'red'}
                        variant="dot"
                        size="xs"
                      >
                        {isAdventurer ? 'Av' : 'Mo'}
                      </Badge>
                    </Group>
                    <Text size="xs" c="dimmed">
                      CA {p.armorClass} · HP {p.currentHp}/{p.maxHp}
                    </Text>
                  </Stack>
                </Group>

                <Group gap={4} wrap="nowrap">
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => moveUp(i)}
                    disabled={i === 0}
                    aria-label="Mover arriba"
                  >
                    <IconArrowUp size={14} />
                  </ActionIcon>
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color="gray"
                    onClick={() => moveDown(i)}
                    disabled={i === order.length - 1}
                    aria-label="Mover abajo"
                  >
                    <IconArrowDown size={14} />
                  </ActionIcon>
                </Group>
              </Group>
            </Card>
          )
        })}
      </Stack>
    </Stack>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function TieBreakModal({ combatId, opened, onClose }: TieBreakModalProps) {
  const [groups, setGroups]         = useState<TieGroup[]>([])
  const [resolved, setResolved]     = useState<Map<number, Participant[]>>(new Map())
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)

  // Load tie groups whenever modal opens
  useEffect(() => {
    if (!opened) return
    setLoading(true)
    getTieGroups(combatId).then(raw => {
      const tieGroups: TieGroup[] = raw.map(participants => ({
        initiative: participants[0].initiative,
        participants: [...participants].sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      setGroups(tieGroups)

      // Initialize resolved map with current order
      const initMap = new Map<number, Participant[]>()
      for (const g of tieGroups) initMap.set(g.initiative, g.participants)
      setResolved(initMap)
    }).finally(() => setLoading(false))
  }, [opened, combatId])

  function handleGroupChange(initiative: number, ordered: Participant[]) {
    setResolved(prev => new Map(prev).set(initiative, ordered))
  }

  async function handleConfirm() {
    setSaving(true)
    try {
      // Assign sortOrder so that within an initiative tier, the user's chosen
      // order is respected. We space them 100 apart to leave room.
      for (const [initiative, ordered] of resolved.entries()) {
        const baseOrder = initiative * 100
        await resolveTieGroup(ordered.map(p => p.id), baseOrder)
      }
      notifications.show({
        message: 'Orden de iniciativa actualizado',
        color: 'blue',
      })
      onClose()
    } catch {
      notifications.show({ message: 'Error al guardar el orden', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const hasTies = groups.length > 0

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSword size={18} color="var(--mantine-color-orange-5)" />
          <Text fw={700}>Resolver empates de iniciativa</Text>
        </Group>
      }
      centered
      size="md"
    >
      <Stack gap="md">
        {loading && (
          <Text size="sm" c="dimmed" ta="center">Cargando...</Text>
        )}

        {!loading && !hasTies && (
          <Alert color="green" variant="light">
            No hay empates de iniciativa en este combate.
          </Alert>
        )}

        {!loading && hasTies && (
          <>
            <Alert
              color="orange"
              variant="light"
              icon={<IconAlertTriangle size={16} />}
            >
              <Text size="xs">
                Los siguientes participantes tienen la misma iniciativa.
                Usá las flechas para definir quién actúa primero dentro de cada grupo.
                El número <strong>1</strong> actúa antes que el <strong>2</strong>, etc.
              </Text>
            </Alert>

            {groups.map((group, i) => (
              <Stack key={group.initiative} gap="sm">
                {i > 0 && <Divider />}
                <TieGroupEditor
                  group={group}
                  onChange={(ordered) => handleGroupChange(group.initiative, ordered)}
                />
              </Stack>
            ))}
          </>
        )}

        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancelar
          </Button>
          {hasTies && (
            <Button
              color="blue"
              onClick={handleConfirm}
              loading={saving}
            >
              Confirmar orden
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  )
}
