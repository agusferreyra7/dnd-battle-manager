import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container, Group, Button, Text, Badge, Stack, Loader, Center,
  ActionIcon, Title, Divider, Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconChevronRight, IconList, IconPlus, IconFlag,
  IconArrowLeft, IconSwords, IconFlame
} from '@tabler/icons-react'
import { useCombat, useParticipantsWithStatus, useCombatLog, useAliveCount } from '@/hooks/useCombat'
import { advanceTurn, setCombatStatus, getTieGroups } from '@/db/queries'
import { useCombatUIStore } from '@/store/combatStore'
import InitiativeList from '@/components/CombatTracker/InitiativeList'
import DamageModal from '@/components/CombatTracker/DamageModal'
import CombatLogDrawer from '@/components/CombatTracker/CombatLogDrawer'
import AddParticipantModal from '@/components/CombatTracker/AddParticipantModal'
import TieBreakModal from '@/components/CombatTracker/TieBreakModal'
import AoeModal from '@/components/CombatTracker/AoeModal'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CombatPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const combat      = useCombat(id!)
  const participants = useParticipantsWithStatus(id!, combat?.currentTurnIndex ?? 0)
  const aliveCount  = useAliveCount(id!)
  const log         = useCombatLog(id!)

  const {
    openLogDrawer, logDrawerOpen, closeLogDrawer,
    addParticipantModalOpen, openAddParticipantModal, closeAddParticipantModal,
    tieBreakOpen, openTieBreak, closeTieBreak,
    aoeModalOpen, openAoeModal, closeAoeModal,
  } = useCombatUIStore()

  // ── Auto-detect ties when participants load / change ──────────────────────
  // Show the tie-break modal automatically if unresolved ties exist
  // (i.e. two+ alive participants with same initiative AND same sortOrder bucket)
  useEffect(() => {
    if (!id || !participants || tieBreakOpen) return

    getTieGroups(id).then(groups => {
      // A group is "unresolved" if participants within it have equal sortOrder
      const hasUnresolved = groups.some(group => {
        const orders = group.map(p => p.sortOrder)
        return new Set(orders).size < orders.length
      })
      if (hasUnresolved) openTieBreak()
    })
  // Only re-run when participant count changes (not on every render)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants?.length, id])

  if (!combat || participants === undefined) {
    return <Center h={300}><Loader /></Center>
  }

  async function handleNextTurn() {
    if (!combat || aliveCount === undefined) return
    await advanceTurn(combat, aliveCount)

    const nextIndex = (combat.currentTurnIndex + 1) % (aliveCount || 1)
    if (nextIndex === 0) {
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

  const aliveParticipants = participants.filter(p => p.isAlive)
  const activeParticipant = aliveParticipants[combat.currentTurnIndex]

  // Detect if there are any current tie groups (for button indicator)
  const hasTies = (() => {
    const alive = participants.filter(p => p.isAlive)
    const byInit: Record<number, number> = {}
    for (const p of alive) byInit[p.initiative] = (byInit[p.initiative] ?? 0) + 1
    return Object.values(byInit).some(count => count >= 2)
  })()

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
            {/* Tie-break button */}
            {hasTies && (
              <Tooltip label="Resolver empates de iniciativa" position="left">
                <ActionIcon
                  variant="filled"
                  color="orange"
                  onClick={openTieBreak}
                  aria-label="Resolver empates"
                  style={{ animation: 'pulse 1.5s infinite' }}
                >
                  <IconSwords size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {/* AOE button */}
            <Tooltip label="Efecto en área (múltiples objetivos)" position="left">
              <ActionIcon
                variant="light"
                color="orange"
                onClick={openAoeModal}
                aria-label="Efecto en área"
              >
                <IconFlame size={16} />
              </ActionIcon>
            </Tooltip>
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
        <InitiativeList participants={participants} />

        {/* Turn controls */}
        <Group justify="space-between" mt="sm">
          <Button variant="subtle" color="gray" size="xs" onClick={handleEndCombat}>
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
      <TieBreakModal
        combatId={id!}
        opened={tieBreakOpen}
        onClose={closeTieBreak}
      />
      <AoeModal
        combat={combat}
        participants={participants}
        opened={aoeModalOpen}
        onClose={closeAoeModal}
      />

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </Container>
  )
}
