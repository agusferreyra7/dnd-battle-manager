import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container, Title, Button, Stack, Group, TextInput,
  Card, Text, Badge, ActionIcon, Divider, Tabs
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconTrash, IconDice, IconSword, IconShield,
  IconArrowRight, IconUser, IconSkull
} from '@tabler/icons-react'
import { createCombat, addParticipant, rollInitiative, setCombatStatus } from '@/db/queries'
import type { ParticipantFormValues } from '@/types'
import ParticipantForm from '@/components/CombatSetup/ParticipantForm'

// ─── Pending participant (not yet saved to DB) ────────────────────────────────

interface PendingParticipant extends ParticipantFormValues {
  tempId: string
}

// ─── Draft row card ───────────────────────────────────────────────────────────

function DraftParticipantCard({
  participant,
  onRemove,
  onRollInitiative,
}: {
  participant: PendingParticipant
  onRemove: (id: string) => void
  onRollInitiative: (id: string) => void
}) {
  const isAdventurer = participant.type === 'adventurer'

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="sm" wrap="nowrap">
          <Stack gap={2}>
            <Group gap="xs">
              <Text fw={600} size="sm">{participant.name}</Text>
              <Badge
                color={isAdventurer ? 'blue' : 'red'}
                variant="light"
                size="xs"
                leftSection={isAdventurer ? <IconUser size={10} /> : <IconSkull size={10} />}
              >
                {isAdventurer ? 'Aventurero' : 'Monstruo'}
              </Badge>
            </Group>
            <Group gap="md">
              <Text size="xs" c="dimmed">HP: {participant.maxHp}</Text>
              <Text size="xs" c="dimmed">CA: {participant.armorClass}</Text>
              <Text size="xs" c="dimmed">
                Iniciativa: {participant.initiative !== null
                  ? participant.initiative
                  : `+${participant.initiativeBonus} (sin tirar)`}
              </Text>
            </Group>
          </Stack>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="light"
            color="orange"
            onClick={() => onRollInitiative(participant.tempId)}
            aria-label="Tirar iniciativa"
            title="Tirar iniciativa (1d20 + bono)"
          >
            <IconDice size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => onRemove(participant.tempId)}
            aria-label="Quitar participante"
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Group>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewCombatPage() {
  const navigate = useNavigate()
  const [combatName, setCombatName] = useState('')
  const [pending, setPending] = useState<PendingParticipant[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<string | null>('adventurer')

  const handleAddParticipant = useCallback((batch: ParticipantFormValues[]) => {
    const newEntries = batch.map((values) => ({
      ...values,
      tempId: crypto.randomUUID(),
    }))
    setPending((prev) => [...prev, ...newEntries])
  }, [])

  const handleRemove = useCallback((tempId: string) => {
    setPending((prev) => prev.filter((p) => p.tempId !== tempId))
  }, [])

  const handleRollOne = useCallback((tempId: string) => {
    setPending((prev) =>
      prev.map((p) =>
        p.tempId === tempId
          ? { ...p, initiative: rollInitiative(p.initiativeBonus) }
          : p
      )
    )
  }, [])

  const handleRollAll = useCallback(() => {
    setPending((prev) =>
      prev.map((p) => ({ ...p, initiative: rollInitiative(p.initiativeBonus) }))
    )
    notifications.show({ message: 'Iniciativas tiradas para todos', color: 'orange' })
  }, [])

  async function handleStartCombat() {
    if (!combatName.trim()) {
      notifications.show({ message: 'Ingresá un nombre para el combate', color: 'red' })
      return
    }
    if (pending.length === 0) {
      notifications.show({ message: 'Agregá al menos un participante', color: 'red' })
      return
    }

    setIsSubmitting(true)
    try {
      const combat = await createCombat(combatName.trim())

      // Roll missing initiatives before saving
      const withInitiative = pending.map((p) => ({
        ...p,
        initiative: p.initiative ?? rollInitiative(p.initiativeBonus),
      }))

      for (const p of withInitiative) {
        await addParticipant(combat.id, p)
      }

      await setCombatStatus(combat.id, 'active')
      navigate(`/combat/${combat.id}`)
    } catch (err) {
      notifications.show({ message: 'Error al crear el combate', color: 'red' })
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const adventurers = pending.filter((p) => p.type === 'adventurer')
  const monsters = pending.filter((p) => p.type === 'monster')

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <Stack gap="xs">
          <Title order={2}>Nuevo combate</Title>
          <Text c="dimmed" size="sm">Configurá los participantes antes de iniciar</Text>
        </Stack>

        <TextInput
          label="Nombre del combate"
          placeholder="Ej: La Posada del Dragón Borracho"
          value={combatName}
          onChange={(e) => setCombatName(e.currentTarget.value)}
          size="md"
        />

        <Divider label="Agregar participantes" labelPosition="left" />

        {/* Participant form with type tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="adventurer" leftSection={<IconUser size={14} />}>
              Aventurero
            </Tabs.Tab>
            <Tabs.Tab value="monster" leftSection={<IconSkull size={14} />}>
              Monstruo
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="adventurer" pt="md">
            <ParticipantForm
              type="adventurer"
              onSubmit={handleAddParticipant}
            />
          </Tabs.Panel>
          <Tabs.Panel value="monster" pt="md">
            <ParticipantForm
              type="monster"
              onSubmit={handleAddParticipant}
            />
          </Tabs.Panel>
        </Tabs>

        {/* Pending list */}
        {pending.length > 0 && (
          <Stack gap="sm">
            <Group justify="space-between">
              <Text fw={600} size="sm">
                Participantes ({pending.length})
              </Text>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconDice size={14} />}
                onClick={handleRollAll}
              >
                Tirar todas las iniciativas
              </Button>
            </Group>

            {adventurers.length > 0 && (
              <Stack gap="xs">
                <Group gap="xs">
                  <IconShield size={14} color="var(--mantine-color-blue-5)" />
                  <Text size="xs" c="blue" fw={600}>Aventureros</Text>
                </Group>
                {adventurers.map((p) => (
                  <DraftParticipantCard
                    key={p.tempId}
                    participant={p}
                    onRemove={handleRemove}
                    onRollInitiative={handleRollOne}
                  />
                ))}
              </Stack>
            )}

            {monsters.length > 0 && (
              <Stack gap="xs">
                <Group gap="xs">
                  <IconSkull size={14} color="var(--mantine-color-red-5)" />
                  <Text size="xs" c="red" fw={600}>Monstruos</Text>
                </Group>
                {monsters.map((p) => (
                  <DraftParticipantCard
                    key={p.tempId}
                    participant={p}
                    onRemove={handleRemove}
                    onRollInitiative={handleRollOne}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={() => navigate('/')}>
            Cancelar
          </Button>
          <Button
            leftSection={<IconSword size={18} />}
            rightSection={<IconArrowRight size={16} />}
            onClick={handleStartCombat}
            loading={isSubmitting}
            disabled={pending.length === 0}
          >
            Iniciar combate
          </Button>
        </Group>
      </Stack>
    </Container>
  )
}
