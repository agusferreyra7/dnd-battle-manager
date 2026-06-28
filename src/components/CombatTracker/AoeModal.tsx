import { useState, useEffect, useRef } from 'react'
import {
  Modal, NumberInput, Button, Group, Text, Stack, SegmentedControl,
  Checkbox, Badge, Divider, ScrollArea, Card, ActionIcon, Tooltip
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import {
  IconSword, IconHeart, IconShieldFilled,
  IconSelectAll, IconX
} from '@tabler/icons-react'
import { applyDamage, applyHeal, applyTempHp } from '@/db/queries'
import type { Combat, ParticipantWithStatus } from '@/types'
import HpBar from '@/components/shared/HpBar'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionMode = 'damage' | 'heal' | 'temp'

const QUICK_AMOUNTS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30]

interface AoeModalProps {
  combat: Combat
  participants: ParticipantWithStatus[]
  opened: boolean
  onClose: () => void
}

// ─── HP preview for one participant ──────────────────────────────────────────

function previewFor(p: ParticipantWithStatus, mode: ActionMode, amount: number) {
  if (mode === 'damage') {
    const absorbed  = Math.min(p.temporaryHp, amount)
    const remaining = amount - absorbed
    return {
      hp:   Math.max(0, p.currentHp - remaining),
      temp: Math.max(0, p.temporaryHp - absorbed),
    }
  }
  if (mode === 'heal') {
    return { hp: Math.min(p.maxHp, p.currentHp + amount), temp: p.temporaryHp }
  }
  return { hp: p.currentHp, temp: Math.max(p.temporaryHp, amount) }
}

// ─── Single participant row in the checklist ───────────────────────────────

function ParticipantRow({
  participant,
  checked,
  onToggle,
  mode,
  amount,
}: {
  participant: ParticipantWithStatus
  checked: boolean
  onToggle: () => void
  mode: ActionMode
  amount: number
}) {
  const isAdventurer = participant.type === 'adventurer'
  const prev = amount > 0 ? previewFor(participant, mode, amount) : null

 

  return (
    <Card
      withBorder
      padding="xs"
      radius="sm"
      style={{
        cursor: 'pointer',
        opacity: checked ? 1 : 0.55,
        borderColor: checked
          ? mode === 'damage'
            ? 'var(--mantine-color-red-5)'
            : mode === 'heal'
            ? 'var(--mantine-color-green-5)'
            : 'var(--mantine-color-cyan-5)'
          : undefined,
        transition: 'all 0.15s',
      }}
      onClick={onToggle}
    >
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Group gap="sm" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Checkbox
            checked={checked}
            onChange={onToggle}
            onClick={e => e.stopPropagation()}
            color={mode === 'damage' ? 'red' : mode === 'heal' ? 'green' : 'cyan'}
            style={{ flexShrink: 0 }}
          />
          <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" wrap="nowrap">
              <Text size="sm" fw={600} truncate>{participant.name}</Text>
              <Badge color={isAdventurer ? 'blue' : 'red'} variant="dot" size="xs" style={{ flexShrink: 0 }}>
                {isAdventurer ? 'Av' : 'Mo'}
              </Badge>
              {participant.temporaryHp > 0 && (
                <Badge color="cyan" variant="light" size="xs" style={{ flexShrink: 0 }}>
                  +{participant.temporaryHp} temp
                </Badge>
              )}
            </Group>
            <Group gap={4} wrap="nowrap">
              <Text size="xs" c="dimmed" style={{ minWidth: 80 }}>
                HP: {participant.currentHp}/{participant.maxHp}
              </Text>
              {/* Show delta preview */}
              {checked && prev && (
                <Text
                  size="xs"
                  fw={600}
                  c={mode === 'damage' ? 'red' : mode === 'heal' ? 'green' : 'cyan'}
                >
                  {mode === 'damage' && `→ ${prev.hp}${prev.hp === 0 ? ' ☠' : ''}`}
                  {mode === 'heal'   && `→ ${prev.hp}`}
                  {mode === 'temp'   && `→ 🛡 ${prev.temp}`}
                  {mode === 'damage' && prev.temp < participant.temporaryHp && (
                    <Text span c="cyan"> · temp → {prev.temp}</Text>
                  )}
                </Text>
              )}
            </Group>
            <HpBar current={participant.currentHp} max={participant.maxHp} tempHp={participant.temporaryHp} />
          </Stack>
        </Group>
      </Group>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AoeModal({ combat, participants, opened, onClose }: AoeModalProps) {
  const [mode, setMode]         = useState<ActionMode>('damage')
  const [amount, setAmount]     = useState<number | ''>(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const alive = participants.filter(p => p.isAlive && !p.isDown)
  const down  = participants.filter(p => p.isDown)

  useEffect(() => {
    if (opened) {
      setMode('damage')
      setAmount(0)
      setSelected(new Set())
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [opened])

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(alive.map(p => p.id)))
  }

  function selectAllMonsters() {
    setSelected(new Set(alive.filter(p => p.type === 'monster').map(p => p.id)))
  }

  function selectAllAdventurers() {
    setSelected(new Set(alive.filter(p => p.type === 'adventurer').map(p => p.id)))
  }

  function clearAll() {
    setSelected(new Set())
  }

  async function handleApply() {
    if (!amount || Number(amount) <= 0 || selected.size === 0) return
    const n = Number(amount)
    const targets = alive.filter(p => selected.has(p.id))

    setApplying(true)
    try {
      for (const p of targets) {
        if (mode === 'damage') {
          await applyDamage(p, n, combat.round, combat.currentTurnIndex)
        } else if (mode === 'heal') {
          await applyHeal(p, n, combat.round, combat.currentTurnIndex)
        } else {
          await applyTempHp(p, n, combat.round, combat.currentTurnIndex)
        }
      }

      const label = mode === 'damage' ? 'daño' : mode === 'heal' ? 'curación' : 'HP temporales'
      notifications.show({
        message: `${n} de ${label} aplicado a ${targets.length} participante${targets.length !== 1 ? 's' : ''}`,
        color: mode === 'damage' ? 'orange' : mode === 'heal' ? 'green' : 'cyan',
      })
      onClose()
    } catch {
      notifications.show({ message: 'Error al aplicar el área', color: 'red' })
    } finally {
      setApplying(false)
    }
  }

  const modeColor = mode === 'damage' ? 'red' : mode === 'heal' ? 'green' : 'cyan'
  const modeIcon  = mode === 'damage'
    ? <IconSword size={16} />
    : mode === 'heal'
    ? <IconHeart size={16} />
    : <IconShieldFilled size={16} />
  const modeLabel = mode === 'damage'
    ? `Aplicar daño (${selected.size})`
    : mode === 'heal'
    ? `Curar (${selected.size})`
    : `HP Temp. (${selected.size})`

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSword size={18} color="var(--mantine-color-orange-5)" />
          <Text fw={700}>Efecto en área</Text>
        </Group>
      }
      centered size="md"
    >
      <Stack gap="md">
        {/* Mode */}
        <SegmentedControl
          value={mode}
          onChange={v => setMode(v as ActionMode)}
          fullWidth
          color={modeColor}
          data={[
            { label: '⚔️ Daño',      value: 'damage' },
            { label: '💚 Curación',  value: 'heal'   },
            { label: '🛡 HP Temp.',  value: 'temp'   },
          ]}
        />

        {mode === 'temp' && (
          <Text size="xs" c="dimmed" ta="center">
            Los HP temporales no se acumulan. Cada objetivo conserva el valor más alto.
          </Text>
        )}

        {/* Amount */}
        <NumberInput
          ref={inputRef}
          label="Cantidad"
          min={0} max={9999}
          value={amount}
          onChange={v => setAmount(v === '' ? '' : Number(v))}
          size="lg"
          styles={{ input: { fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', height: '4rem' } }}
        />

        <Group gap="xs" justify="center">
          {QUICK_AMOUNTS.map(n => (
            <Button
              key={n}
              variant={amount === n ? 'filled' : 'light'}
              color={modeColor}
              size="compact-xs"
              onClick={() => setAmount(n)}
              style={{ minWidth: 36 }}
            >
              {n}
            </Button>
          ))}
        </Group>

        <Divider label="Seleccionar objetivos" labelPosition="center" />

        {/* Selection shortcuts */}
        <Group gap="xs" wrap="wrap">
          <Tooltip label="Todos los vivos">
            <ActionIcon size="sm" variant="light" color="gray" onClick={selectAll}>
              <IconSelectAll size={14} />
            </ActionIcon>
          </Tooltip>
          <Button size="compact-xs" variant="light" color="blue" onClick={selectAllAdventurers}>
            Todos aventureros
          </Button>
          <Button size="compact-xs" variant="light" color="red" onClick={selectAllMonsters}>
            Todos monstruos
          </Button>
          <Button size="compact-xs" variant="subtle" color="gray" onClick={clearAll}
            leftSection={<IconX size={12} />}
          >
            Limpiar
          </Button>
          {selected.size > 0 && (
            <Badge color={modeColor} variant="filled" size="sm" ml="auto">
              {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
            </Badge>
          )}
        </Group>

        {/* Participant list */}
        <ScrollArea.Autosize mah={320} offsetScrollbars>
          <Stack gap="xs">
            {alive.map(p => (
              <ParticipantRow
                key={p.id}
                participant={p}
                checked={selected.has(p.id)}
                onToggle={() => toggleOne(p.id)}
                mode={mode}
                amount={amount === '' ? 0 : Number(amount)}
              />
            ))}
            {down.length > 0 && (
              <>
                <Text size="xs" c="dimmed" ta="center" mt="xs">
                  Aventureros abatidos (no seleccionables)
                </Text>
                {down.map(p => (
                  <ParticipantRow
                    key={p.id}
                    participant={{ ...p, isAlive: false }}
                    checked={false}
                    onToggle={() => {}}
                    mode={mode}
                    amount={0}
                  />
                ))}
              </>
            )}
          </Stack>
        </ScrollArea.Autosize>

        {/* Actions */}
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={onClose}>Cancelar</Button>
          <Button
            color={modeColor}
            leftSection={modeIcon}
            onClick={handleApply}
            loading={applying}
            disabled={selected.size === 0 || !amount || Number(amount) <= 0}
          >
            {modeLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
