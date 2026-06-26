import { useNavigate } from 'react-router-dom'
import {
  Container, Title, Button, Stack, Card, Group, Text,
  Badge, ActionIcon, Loader, Center
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconPlus, IconSword, IconTrash, IconPlayerPlay } from '@tabler/icons-react'
import { useAllCombats } from '@/hooks/useCombat'
import { deleteCombat } from '@/db/queries'
import type { Combat } from '@/types'

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Combat['status'], { label: string; color: string }> = {
  setup:  { label: 'Configurando', color: 'blue' },
  active: { label: 'En progreso',  color: 'green' },
  ended:  { label: 'Finalizado',   color: 'gray' },
}

// ─── Combat row ───────────────────────────────────────────────────────────────

function CombatRow({ combat }: { combat: Combat }) {
  const navigate = useNavigate()
  const { label, color } = STATUS_LABELS[combat.status]

  async function handleDelete() {
    await deleteCombat(combat.id)
    notifications.show({
      message: `"${combat.name}" eliminado`,
      color: 'red',
    })
  }

  return (
    <Card withBorder padding="md" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={2}>
          <Group gap="xs">
            <Text fw={600}>{combat.name}</Text>
            <Badge color={color} variant="light" size="sm">{label}</Badge>
          </Group>
          <Text size="xs" c="dimmed">
            Ronda {combat.round} · Creado{' '}
            {new Date(combat.createdAt).toLocaleDateString('es-AR', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </Text>
        </Stack>

        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="light"
            color="red"
            onClick={handleDelete}
            aria-label="Eliminar combate"
          >
            <IconTrash size={16} />
          </ActionIcon>
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            size="xs"
            onClick={() => navigate(`/combat/${combat.id}`)}
          >
            {combat.status === 'setup' ? 'Abrir' : 'Continuar'}
          </Button>
        </Group>
      </Group>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const combats = useAllCombats()

  if (combats === undefined) {
    return (
      <Center h={200}>
        <Loader />
      </Center>
    )
  }

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={2}>
          <Title order={2}>Combates</Title>
          <Text c="dimmed" size="sm">
            {combats.length === 0 ? 'No hay combates guardados' : `${combats.length} combate${combats.length !== 1 ? 's' : ''}`}
          </Text>
        </Stack>
        <Button
          leftSection={<IconPlus size={18} />}
          onClick={() => navigate('/combat/new')}
        >
          Nuevo combate
        </Button>
      </Group>

      {combats.length === 0 ? (
        <Center h={200}>
          <Stack align="center" gap="md">
            <IconSword size={48} color="var(--mantine-color-dimmed)" />
            <Text c="dimmed" ta="center">
              No hay combates todavía.<br />¡Creá uno para empezar!
            </Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="sm">
          {combats.map((combat) => (
            <CombatRow key={combat.id} combat={combat} />
          ))}
        </Stack>
      )}
    </Container>
  )
}
