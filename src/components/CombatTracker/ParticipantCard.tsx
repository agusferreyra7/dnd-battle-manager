import { Card, Group, Text, Badge, ActionIcon, Stack, Tooltip, Box } from '@mantine/core'
import {
  IconSword, IconChevronDown, IconFlask, IconSkull, IconCheck, IconX
} from '@tabler/icons-react'
import { useCombatUIStore } from '@/store/combatStore'
import { toggleCondition, registerDeathSave, resetDeathSaves } from '@/db/queries'
import type { ParticipantWithStatus, Condition } from '@/types'
import HpBar from '@/components/shared/HpBar'
import { notifications } from '@mantine/notifications'

// ─── Condition definitions ────────────────────────────────────────────────────

const ALL_CONDITIONS: { value: Condition; label: string; description: string }[] = [
  { value: 'blinded',       label: 'Cegado',        description: 'No puede ver. Ataques recibidos tienen ventaja, los suyos desventaja.' },
  { value: 'charmed',       label: 'Hechizado',      description: 'No puede atacar a quien lo hechizó. Éste tiene ventaja en interacciones sociales.' },
  { value: 'deafened',      label: 'Ensordecido',    description: 'No puede oír. Falla chequeos que requieran oído automáticamente.' },
  { value: 'exhaustion',    label: 'Agotamiento',    description: 'Penalizaciones acumulativas según nivel de agotamiento (1–6).' },
  { value: 'frightened',    label: 'Asustado',       description: 'Desventaja en tiradas mientras vea la fuente de miedo.' },
  { value: 'grappled',      label: 'Agarrado',       description: 'Velocidad 0. Termina si quien agarra queda incapacitado.' },
  { value: 'incapacitated', label: 'Incapacitado',   description: 'No puede realizar acciones ni reacciones.' },
  { value: 'invisible',     label: 'Invisible',      description: 'No puede ser visto sin magia. Sus ataques tienen ventaja.' },
  { value: 'paralyzed',     label: 'Paralizado',     description: 'Incapacitado. Falla salvaciones FUE/DES. Críticos en cuerpo a cuerpo.' },
  { value: 'petrified',     label: 'Petrificado',    description: 'Convertido en piedra. Resistencia a todo daño.' },
  { value: 'poisoned',      label: 'Envenenado',     description: 'Desventaja en tiradas de ataque y chequeos de característica.' },
  { value: 'prone',         label: 'Tumbado',        description: 'Desventaja en ataques. Ataques CaC contra él tienen ventaja.' },
  { value: 'restrained',    label: 'Restringido',    description: 'Velocidad 0. Desventaja en ataques. Ataques contra él tienen ventaja.' },
  { value: 'stunned',       label: 'Aturdido',       description: 'Incapacitado. Falla FUE/DES. Ataques contra él tienen ventaja.' },
  { value: 'unconscious',   label: 'Inconsciente',   description: 'Incapacitado, cae al suelo. Críticos en CaC.' },
]

// ─── HP color ─────────────────────────────────────────────────────────────────

function hpColor(pct: number): string {
  if (pct > 60) return 'green'
  if (pct > 30) return 'yellow'
  return 'red'
}

// ─── Death saves sub-component ────────────────────────────────────────────────

function DeathSavesPanel({ participant }: { participant: ParticipantWithStatus }) {
  const { successes, failures } = participant.deathSaves

  async function handleSuccess() {
    const result = await registerDeathSave(participant, 'success')
    if (result === 'stable') {
      notifications.show({ message: `${participant.name} se estabilizó (3 éxitos)`, color: 'green' })
    }
  }

  async function handleFailure() {
    const result = await registerDeathSave(participant, 'failure')
    if (result === 'dead') {
      notifications.show({ message: `${participant.name} murió (3 fallos)`, color: 'red' })
    }
  }

  async function handleReset() {
    await resetDeathSaves(participant.id)
  }

  return (
    <Box
      style={{
        background: 'var(--mantine-color-dark-6)',
        borderRadius: 'var(--mantine-radius-sm)',
        padding: '8px 10px',
        border: '1px solid var(--mantine-color-dark-4)',
      }}
    >
      <Group justify="space-between" mb={6}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
          Salvaciones contra la muerte
        </Text>
        <Tooltip label="Resetear tiradas">
          <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleReset}>
            <IconX size={10} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <Group gap="xl">
        {/* Successes */}
        <Stack gap={4} align="center">
          <Text size="xs" c="green" fw={500}>Éxitos</Text>
          <Group gap={4}>
            {[0, 1, 2].map((i) => (
              <Tooltip key={i} label={i < successes ? 'Click para resetear' : 'Registrar éxito'}>
                <ActionIcon
                  size="sm"
                  radius="xl"
                  variant={i < successes ? 'filled' : 'outline'}
                  color="green"
                  onClick={i < successes ? handleReset : handleSuccess}
                >
                  <IconCheck size={12} />
                </ActionIcon>
              </Tooltip>
            ))}
          </Group>
        </Stack>

        {/* Failures */}
        <Stack gap={4} align="center">
          <Text size="xs" c="red" fw={500}>Fallos</Text>
          <Group gap={4}>
            {[0, 1, 2].map((i) => (
              <Tooltip key={i} label={i < failures ? 'Click para resetear' : 'Registrar fallo'}>
                <ActionIcon
                  size="sm"
                  radius="xl"
                  variant={i < failures ? 'filled' : 'outline'}
                  color="red"
                  onClick={i < failures ? handleReset : handleFailure}
                >
                  <IconX size={12} />
                </ActionIcon>
              </Tooltip>
            ))}
          </Group>
        </Stack>
      </Group>
    </Box>
  )
}

// ─── Conditions panel sub-component ──────────────────────────────────────────

function ConditionsPanel({ participant }: { participant: ParticipantWithStatus }) {
  async function handleToggle(condition: Condition) {
    await toggleCondition(participant, condition)
  }

  return (
    <Stack gap="xs">
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.04em' }}>
        Estados
      </Text>
      <Group gap="xs">
        {ALL_CONDITIONS.map(({ value, label, description }) => {
          const active = participant.conditions.includes(value)
          return (
            <Tooltip key={value} label={description} multiline w={230} position="top">
              <Badge
                color={active ? 'orange' : 'gray'}
                variant={active ? 'filled' : 'outline'}
                size="sm"
                style={{
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  opacity: active ? 1 : 0.55,
                  transition: 'all 0.15s ease',
                }}
                onClick={() => handleToggle(value)}
              >
                {label}
              </Badge>
            </Tooltip>
          )
        })}
      </Group>
    </Stack>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type ExpandedPanel = 'details' | 'conditions' | null

interface ParticipantCardProps {
  participant: ParticipantWithStatus
  isDead?: boolean
}

export default function ParticipantCard({ participant, isDead = false }: ParticipantCardProps) {
  const { openDamageModal, expandedParticipantId, setExpandedParticipant } = useCombatUIStore()

  const isAdventurer  = participant.type === 'adventurer'
  const isDown        = participant.isDown    // adventurer at 0 HP rolling death saves
  const expandedId    = expandedParticipantId

  // We encode the panel type into the stored ID using a suffix
  const currentPanel: ExpandedPanel = (() => {
    if (expandedId === `${participant.id}:details`)    return 'details'
    if (expandedId === `${participant.id}:conditions`) return 'conditions'
    return null
  })()

  function togglePanel(panel: ExpandedPanel) {
    const key = panel ? `${participant.id}:${panel}` : null
    setExpandedParticipant(currentPanel === panel ? null : key)
  }

  // Active turn border: blue for adventurers, red for monsters
  const activeBorderColor = isAdventurer
    ? 'var(--mantine-color-blue-5)'
    : 'var(--mantine-color-red-5)'

  const cardStyle: React.CSSProperties = {
    opacity: isDead ? 0.4 : isDown ? 0.75 : 1,
    transition: 'all 0.2s ease',
    borderColor: participant.isActive ? activeBorderColor : undefined,
    boxShadow: participant.isActive ? `0 0 0 2px ${activeBorderColor}` : undefined,
  }

  return (
    <Card withBorder padding="sm" radius="md" style={cardStyle}>
      <Stack gap="xs">
        {/* ── Main row ── */}
        <Group justify="space-between" wrap="nowrap">
          <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              {participant.isActive && (
                <Badge
                  color={isAdventurer ? 'blue' : 'red'}
                  variant="filled"
                  size="xs"
                  style={{ flexShrink: 0 }}
                >
                  ▶ Turno
                </Badge>
              )}
              <Text
                fw={participant.isActive ? 700 : 500}
                size="sm"
                truncate
                title={participant.name}
              >
                {isDead ? '☠️ ' : isDown ? '💀 ' : ''}{participant.name}
              </Text>
              <Badge
                color={isAdventurer ? 'blue' : 'red'}
                variant="dot"
                size="xs"
                style={{ flexShrink: 0 }}
              >
                {isAdventurer ? 'Av' : 'Mo'}
              </Badge>
              {/* Active condition pills (compact) */}
              {participant.conditions.slice(0, 3).map((c) => {
                const cDef = ALL_CONDITIONS.find((x) => x.value === c)
                return (
                  <Badge key={c} color="orange" variant="light" size="xs" style={{ flexShrink: 0 }}>
                    {cDef?.label ?? c}
                  </Badge>
                )
              })}
              {participant.conditions.length > 3 && (
                <Badge color="orange" variant="light" size="xs" style={{ flexShrink: 0 }}>
                  +{participant.conditions.length - 3}
                </Badge>
              )}
            </Group>

            <Group gap="md">
              <Text size="xs" c="dimmed">Init: <strong>{participant.initiative}</strong></Text>
              <Text size="xs" c="dimmed">CA: <strong>{participant.armorClass}</strong></Text>
              {!isDead && !isDown && (
                <Text size="xs" c={hpColor(participant.hpPercentage)} fw={500}>
                  HP: {participant.currentHp}/{participant.maxHp}
                  {participant.temporaryHp > 0 && (
                    <Text span c="cyan"> +{participant.temporaryHp}</Text>
                  )}
                </Text>
              )}
              {isDown && (
                <Text size="xs" c="red" fw={600}>⚠ Abatido — 0 HP</Text>
              )}
            </Group>
          </Stack>

          {/* Action buttons */}
          <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
            {!isDead && (
              <Tooltip label="Aplicar daño / curar" position="left">
                <ActionIcon
                  variant={participant.isActive ? 'filled' : 'light'}
                  color="red"
                  onClick={() => openDamageModal(participant)}
                  aria-label={`Daño/curar a ${participant.name}`}
                >
                  <IconSword size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Conditions panel toggle */}
            {!isDead && (
              <Tooltip label="Estados / condiciones" position="left">
                <ActionIcon
                  variant={currentPanel === 'conditions' ? 'filled' : 'light'}
                  color="orange"
                  onClick={() => togglePanel('conditions')}
                  aria-label="Ver estados"
                >
                  <IconFlask size={16} />
                </ActionIcon>
              </Tooltip>
            )}

            {/* Details / death saves toggle */}
            <Tooltip label={isDown ? 'Salvaciones contra la muerte' : 'Ver detalles'} position="left">
              <ActionIcon
                variant={currentPanel === 'details' ? 'filled' : 'subtle'}
                color={isDown ? 'red' : 'gray'}
                onClick={() => togglePanel('details')}
                aria-label="Ver detalles"
                style={{
                  // Pulse animation when down
                  animation: isDown && currentPanel !== 'details' ? 'pulse 1.5s infinite' : 'none',
                }}
              >
                {isDown ? <IconSkull size={16} /> : <IconChevronDown size={16} style={{
                  transform: currentPanel === 'details' ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }} />}
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>

        {/* ── HP bar ── */}
        {!isDead && !isDown && (
          <HpBar current={participant.currentHp} max={participant.maxHp} tempHp={participant.temporaryHp} />
        )}
        {isDown && (
          <HpBar current={0} max={participant.maxHp} tempHp={0} />
        )}

        {/* ── Expanded: details / death saves ── */}
        {currentPanel === 'details' && (
          <Stack
            gap="sm"
            pt="xs"
            style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
          >
            {isDown && isAdventurer && <DeathSavesPanel participant={participant} />}
            {participant.notes ? (
              <Text size="xs" c="dimmed">{participant.notes}</Text>
            ) : (
              <Text size="xs" c="dimmed">Sin notas</Text>
            )}
          </Stack>
        )}

        {/* ── Expanded: conditions panel ── */}
        {currentPanel === 'conditions' && (
          <Box pt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <ConditionsPanel participant={participant} />
          </Box>
        )}
      </Stack>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </Card>
  )
}
