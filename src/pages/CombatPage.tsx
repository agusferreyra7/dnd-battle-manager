import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Group, Button, Text, Badge, Stack, Loader, Center,
  ActionIcon, Title, Divider
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconChevronRight, IconList, IconPlus, IconFlag, IconArrowLeft
} from '@tabler/icons-react'
import { useCombat, useParticipantsWithStatus, useCombatLog, useAliveCount } from '@/hooks/useCombat'
import { advanceTurn, setCombatStatus } from '@/db/queries'
import { useCombatUIStore } from '@/store/combatStore'
import InitiativeList from '@/components/CombatTracker/InitiativeList'
import DamageModal from '@/components/CombatTracker/DamageModal'
import CombatLogDrawer from '@/components/CombatTracker/CombatLogDrawer'
import AddParticipantModal from '@/components/CombatTracker/AddParticipantModal'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CombatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const combat = useCombat(id!)
  const participants = useParticipantsWithStatus(id!, combat?.currentTurnIndex ?? 0)
  const aliveCount = useAliveCount(id!)
  const log = useCombatLog(id!)

  const {
    openLogDrawer, logDrawerOpen, closeLogDrawer,
    addParticipantModalOpen, openAddParticipantModal, closeAddParticipantModal,
  } = useCombatUIStore()

  if (!combat || participants === undefined) {
    return (
      <Center h={300}>
        <Loader />
      </Center>
    )
  }

  async function handleNextTurn() {
    if (!combat || aliveCount === undefined) return
    await advanceTurn(combat, aliveCount)

    const nextIndex = (combat.currentTurnIndex + 1) % (aliveCount || 1)
    const isNewRound = nextIndex === 0

    if (isNewRound) {
      notifications.show({
        message: `¡Ronda ${combat.round + 1} comenzó!`,
        color: 'orange',
        icon: <IconFlag size={16} />,
      })
    }
  }

  async function handleEndCombat() {
    await setCombatStatus(combat!.id, 'ended')
    notifications.show({ message: 'Combate finalizado', color: 'gray' })
    navigate('/')
  }

  const aliveParticipants = participants.filter((p) => p.isAlive)
  const activeParticipant = aliveParticipants[combat.currentTurnIndex]

  return (
    <Container size="sm" py="md">
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs">
            <ActionIcon variant="subtle" onClick={() => navigate('/')} aria-label="Volver">
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Stack gap={0}>
              <Title order={3} style={{ lineHeight: 1.2 }}>{combat.name}</Title>
              <Group gap="xs">
                <Badge color="orange" variant="light" size="sm">
                  Ronda {combat.round}
                </Badge>
                {activeParticipant && (
                  <Text size="xs" c="dimmed">
                    Turno de: <strong>{activeParticipant.name}</strong>
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>

          <Group gap="xs" wrap="nowrap">
            <ActionIcon
              variant="light"
              onClick={openAddParticipantModal}
              aria-label="Agregar participante"
              title="Agregar participante al combate"
            >
              <IconPlus size={16} />
            </ActionIcon>
            <ActionIcon
              variant="light"
              onClick={openLogDrawer}
              aria-label="Ver historial"
              title="Ver historial del combate"
            >
              <IconList size={16} />
            </ActionIcon>
          </Group>
        </Group>

        <Divider />

        {/* Initiative list */}
        <InitiativeList
          participants={participants}
        />

        {/* Turn controls */}
        <Group justify="space-between" mt="sm">
          <Button
            variant="subtle"
            color="gray"
            size="xs"
            onClick={handleEndCombat}
          >
            Finalizar combate
          </Button>
          <Button
            color="blue"
            rightSection={<IconChevronRight size={16} />}
            onClick={handleNextTurn}
            disabled={aliveCount === 0}
          >
            Siguiente turno
          </Button>
        </Group>
      </Stack>

      {/* Overlays */}
      <DamageModal combat={combat} />
      <CombatLogDrawer
        opened={logDrawerOpen}
        onClose={closeLogDrawer}
        log={log ?? []}
      />
      <AddParticipantModal
        combatId={id!}
        opened={addParticipantModalOpen}
        onClose={closeAddParticipantModal}
      />
    </Container>
  )
}
