import { useState, useEffect, useRef } from 'react'
import {
  Modal, NumberInput, Button, Group, Text, Stack, SegmentedControl,
  Badge, Divider
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconSword, IconHeart } from '@tabler/icons-react'
import { useCombatUIStore } from '@/store/combatStore'
import { applyDamage, applyHeal } from '@/db/queries'
import type { Combat } from '@/types'
import HpBar from '@/components/shared/HpBar'

interface DamageModalProps {
  combat: Combat
}

// ─── Quick-amount buttons ─────────────────────────────────────────────────────

const QUICK_AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25]

export default function DamageModal({ combat }: DamageModalProps) {
  const { damageModal, closeDamageModal } = useCombatUIStore()
  const { isOpen, targetParticipant } = damageModal

  const [amount, setAmount] = useState<number | ''>(0)
  const [mode, setMode] = useState<'damage' | 'heal'>('damage')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount(0)
      setMode('damage')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Preview HP after applying
  const previewHp = (() => {
    if (!targetParticipant || amount === '' || amount === 0) return null
    if (mode === 'damage') {
      const tempAbsorbed = Math.min(targetParticipant.temporaryHp, amount)
      const remaining = amount - tempAbsorbed
      return Math.max(0, targetParticipant.currentHp - remaining)
    } else {
      return Math.min(targetParticipant.maxHp, targetParticipant.currentHp + amount)
    }
  })()

  async function handleApply() {
    if (!targetParticipant || !amount || amount <= 0) return

    setIsSubmitting(true)
    try {
      if (mode === 'damage') {
        await applyDamage(targetParticipant, amount, combat.round, combat.currentTurnIndex)

        const willDie = previewHp === 0
        notifications.show({
          message: willDie
            ? `${targetParticipant.name} cayó a 0 HP`
            : `${targetParticipant.name} recibió ${amount} de daño`,
          color: willDie ? 'red' : 'orange',
          icon: <IconSword size={16} />,
        })
      } else {
        await applyHeal(targetParticipant, amount, combat.round, combat.currentTurnIndex)
        notifications.show({
          message: `${targetParticipant.name} recuperó ${amount} HP`,
          color: 'green',
          icon: <IconHeart size={16} />,
        })
      }

      closeDamageModal()
    } catch (err) {
      notifications.show({ message: 'Error al aplicar', color: 'red' })
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keyboard handler: Enter to apply
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleApply()
    if (e.key === 'Escape') closeDamageModal()
  }

  if (!targetParticipant) return null

  const isAdventurer = targetParticipant.type === 'adventurer'

  return (
    <Modal
      opened={isOpen}
      onClose={closeDamageModal}
      title={
        <Group gap="xs">
          <Stack gap={0}>
            <Text fw={700} size="sm">{targetParticipant.name}</Text>
            <Badge
              color={isAdventurer ? 'blue' : 'red'}
              variant="light"
              size="xs"
            >
              {isAdventurer ? 'Aventurero' : 'Monstruo'}
            </Badge>
          </Stack>
        </Group>
      }
      centered
      size="sm"
      onKeyDown={handleKeyDown}
    >
      <Stack gap="md">
        {/* Current HP display */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">HP actual</Text>
            <Text size="sm" fw={600}>
              {targetParticipant.currentHp} / {targetParticipant.maxHp}
              {targetParticipant.temporaryHp > 0 && (
                <Text span c="cyan"> (+{targetParticipant.temporaryHp} temp)</Text>
              )}
            </Text>
          </Group>
          <HpBar
            current={targetParticipant.currentHp}
            max={targetParticipant.maxHp}
            tempHp={targetParticipant.temporaryHp}
            size="md"
          />
        </Stack>

        <Divider />

        {/* Mode toggle */}
        <SegmentedControl
          value={mode}
          onChange={(v) => setMode(v as 'damage' | 'heal')}
          fullWidth
          data={[
            { label: '⚔️  Daño',     value: 'damage' },
            { label: '💚  Curación', value: 'heal' },
          ]}
          color={mode === 'damage' ? 'red' : 'green'}
        />

        {/* Amount input */}
        <NumberInput
          ref={inputRef}
          label="Cantidad"
          description="Presioná Enter para aplicar"
          min={0}
          max={999}
          value={amount}
          onChange={(v) => setAmount(v === '' ? '' : Number(v))}
          size="xl"
          styles={{
            input: {
              fontSize: '2rem',
              fontWeight: 700,
              textAlign: 'center',
              height: '5rem',
            },
          }}
        />

        {/* Quick-select buttons */}
        <Group gap="xs" justify="center">
          {QUICK_AMOUNTS.map((n) => (
            <Button
              key={n}
              variant={amount === n ? 'filled' : 'light'}
              color={mode === 'damage' ? 'red' : 'green'}
              size="compact-xs"
              onClick={() => setAmount(n)}
              style={{ minWidth: 36 }}
            >
              {n}
            </Button>
          ))}
        </Group>

        {/* HP preview */}
        {previewHp !== null && amount !== 0 && (
          <Text size="sm" ta="center" fw={500} c={mode === 'damage' ? 'red' : 'green'}>
            {mode === 'damage' ? '⬇' : '⬆'} HP:{' '}
            {targetParticipant.currentHp} → {previewHp}
            {previewHp === 0 && ' (¡caído!)'}
          </Text>
        )}

        {/* Action buttons */}
        <Group justify="flex-end" mt="xs">
          <Button variant="subtle" onClick={closeDamageModal}>
            Cancelar
          </Button>
          <Button
            color={mode === 'damage' ? 'red' : 'green'}
            leftSection={mode === 'damage' ? <IconSword size={16} /> : <IconHeart size={16} />}
            onClick={handleApply}
            loading={isSubmitting}
            disabled={!amount || Number(amount) <= 0}
          >
            {mode === 'damage' ? 'Aplicar daño' : 'Curar'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
