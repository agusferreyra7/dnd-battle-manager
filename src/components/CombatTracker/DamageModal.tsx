import { useState, useEffect, useRef } from 'react'
import {
  Modal, NumberInput, Button, Group, Text, Stack,
  SegmentedControl, Badge, Divider
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconSword, IconHeart, IconShieldFilled } from '@tabler/icons-react'
import { useCombatUIStore } from '@/store/combatStore'
import { applyDamage, applyHeal, applyTempHp } from '@/db/queries'
import type { Combat } from '@/types'
import HpBar from '@/components/shared/HpBar'

interface DamageModalProps {
  combat: Combat
}

type ActionMode = 'damage' | 'heal' | 'temp'

const QUICK_AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25]

export default function DamageModal({ combat }: DamageModalProps) {
  const { damageModal, closeDamageModal } = useCombatUIStore()
  const { isOpen, targetParticipant }     = damageModal

  const [amount, setAmount]         = useState<number | ''>(0)
  const [mode, setMode]             = useState<ActionMode>('damage')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setAmount(0)
      setMode('damage')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // ── Preview ───────────────────────────────────────────────────────────────

  const preview = (() => {
    if (!targetParticipant || !amount || amount === 0) return null
    const n = Number(amount)
    if (mode === 'damage') {
      const absorbed  = Math.min(targetParticipant.temporaryHp, n)
      const remaining = n - absorbed
      return {
        hp:   Math.max(0, targetParticipant.currentHp - remaining),
        temp: Math.max(0, targetParticipant.temporaryHp - absorbed),
      }
    }
    if (mode === 'heal') {
      return {
        hp:   Math.min(targetParticipant.maxHp, targetParticipant.currentHp + n),
        temp: targetParticipant.temporaryHp,
      }
    }
    // temp: takes the higher value per 5e rules
    return {
      hp:   targetParticipant.currentHp,
      temp: Math.max(targetParticipant.temporaryHp, n),
    }
  })()

  // ── Apply ─────────────────────────────────────────────────────────────────

  async function handleApply() {
    if (!targetParticipant || !amount || Number(amount) <= 0) return
    const n = Number(amount)
    setIsSubmitting(true)
    try {
      if (mode === 'damage') {
        await applyDamage(targetParticipant, n, combat.round, combat.currentTurnIndex)
        const dropsTo0 = preview?.hp === 0
        notifications.show({
          message: dropsTo0
            ? `${targetParticipant.name} cayó a 0 HP`
            : `${targetParticipant.name} recibió ${n} de daño`,
          color: dropsTo0 ? 'red' : 'orange',
          icon: <IconSword size={16} />,
        })
      } else if (mode === 'heal') {
        await applyHeal(targetParticipant, n, combat.round, combat.currentTurnIndex)
        notifications.show({
          message: `${targetParticipant.name} recuperó ${n} HP`,
          color: 'green',
          icon: <IconHeart size={16} />,
        })
      } else {
        await applyTempHp(targetParticipant, n, combat.round, combat.currentTurnIndex)
        const net = Math.max(targetParticipant.temporaryHp, n) - targetParticipant.temporaryHp
        notifications.show({
          message: net > 0
            ? `${targetParticipant.name} recibió ${n} HP temporales`
            : `${targetParticipant.name} ya tenía más HP temporales (${targetParticipant.temporaryHp})`,
          color: 'cyan',
          icon: <IconShieldFilled size={16} />,
        })
      }
      closeDamageModal()
    } catch {
      notifications.show({ message: 'Error al aplicar', color: 'red' })
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleApply()
    if (e.key === 'Escape') closeDamageModal()
  }

  if (!targetParticipant) return null
  const isAdventurer = targetParticipant.type === 'adventurer'

  const modeColor = mode === 'damage' ? 'red' : mode === 'heal' ? 'green' : 'cyan'
  const modeIcon  = mode === 'damage'
    ? <IconSword size={16} />
    : mode === 'heal'
    ? <IconHeart size={16} />
    : <IconShieldFilled size={16} />

  const modeLabel = mode === 'damage' ? 'Aplicar daño' : mode === 'heal' ? 'Curar' : 'Aplicar HP temp.'

  return (
    <Modal
      opened={isOpen}
      onClose={closeDamageModal}
      title={
        <Group gap="xs">
          <Stack gap={0}>
            <Text fw={700} size="sm">{targetParticipant.name}</Text>
            <Badge color={isAdventurer ? 'blue' : 'red'} variant="light" size="xs">
              {isAdventurer ? 'Aventurero' : 'Monstruo'}
            </Badge>
          </Stack>
        </Group>
      }
      centered size="sm" onKeyDown={handleKeyDown}
    >
      <Stack gap="md">
        {/* HP display */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">HP actual</Text>
            <Group gap="xs">
              <Text size="sm" fw={600}>
                {targetParticipant.currentHp}/{targetParticipant.maxHp}
              </Text>
              {targetParticipant.temporaryHp > 0 && (
                <Badge color="cyan" variant="light" size="sm">
                  +{targetParticipant.temporaryHp} temp
                </Badge>
              )}
            </Group>
          </Group>
          <HpBar
            current={targetParticipant.currentHp}
            max={targetParticipant.maxHp}
            tempHp={targetParticipant.temporaryHp}
            size="md"
          />
        </Stack>

        <Divider />

        {/* Mode selector */}
        <SegmentedControl
          value={mode}
          onChange={v => setMode(v as ActionMode)}
          fullWidth
          color={modeColor}
          data={[
            { label: '⚔️ Daño',       value: 'damage' },
            { label: '💚 Curación',   value: 'heal'   },
            { label: '🛡 HP Temp.',   value: 'temp'   },
          ]}
        />

        {/* Temp HP info */}
        {mode === 'temp' && (
          <Text size="xs" c="dimmed" ta="center">
            Los HP temporales no se acumulan. Se conserva el valor más alto entre el actual
            ({targetParticipant.temporaryHp}) y el nuevo.
          </Text>
        )}

        {/* Amount input */}
        <NumberInput
          ref={inputRef}
          label="Cantidad"
          description="Presioná Enter para aplicar"
          min={0} max={9999}
          value={amount}
          onChange={v => setAmount(v === '' ? '' : Number(v))}
          size="xl"
          styles={{ input: { fontSize: '2rem', fontWeight: 700, textAlign: 'center', height: '5rem' } }}
        />

        {/* Quick amounts */}
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

        {/* Preview */}
        {preview && amount !== 0 && (
          <Stack gap={4}>
            {mode === 'damage' && (
              <Text size="sm" ta="center" fw={500} c="red">
                ⬇ HP: {targetParticipant.currentHp} → {preview.hp}
                {preview.temp < targetParticipant.temporaryHp && (
                  <Text span c="cyan"> · Temp: {targetParticipant.temporaryHp} → {preview.temp}</Text>
                )}
                {preview.hp === 0 && <Text span c="red"> (¡caído!)</Text>}
              </Text>
            )}
            {mode === 'heal' && (
              <Text size="sm" ta="center" fw={500} c="green">
                ⬆ HP: {targetParticipant.currentHp} → {preview.hp}
              </Text>
            )}
            {mode === 'temp' && (
              <Text size="sm" ta="center" fw={500} c="cyan">
                🛡 HP Temp: {targetParticipant.temporaryHp} → {preview.temp}
                {preview.temp === targetParticipant.temporaryHp && amount !== '' && Number(amount) > 0 && (
                  <Text span c="dimmed"> (sin cambio)</Text>
                )}
              </Text>
            )}
          </Stack>
        )}

        {/* Actions */}
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={closeDamageModal}>Cancelar</Button>
          <Button
            color={modeColor}
            leftSection={modeIcon}
            onClick={handleApply}
            loading={isSubmitting}
            disabled={!amount || Number(amount) <= 0}
          >
            {modeLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
