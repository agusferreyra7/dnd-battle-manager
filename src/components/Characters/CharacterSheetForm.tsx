import { useState, useEffect } from 'react'
import {
  Stack, TextInput, NumberInput, Select, Textarea, Button,
  Group, Divider, Text, Switch, Collapse
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy, IconX } from '@tabler/icons-react'
import { createCharacterSheet, updateCharacterSheet } from '@/db/queries'
import { getSpellSlots, getLimitedFeatures, ALL_CLASSES, SUBCLASSES, ALIGNMENTS } from '@/data/classData'
import { abilityModifier } from '@/services/open5e'
import type { CharacterSheet, CharacterSheetType, DndClass, AbilityScores, Alignment } from '@/types'
import AbilityScoresGrid from './AbilityScoresGrid'
import SpellSlotsDisplay from './SpellSlotsDisplay'
import LimitedFeaturesDisplay from './LimitedFeaturesDisplay'

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_SCORES: AbilityScores = {
  strength: 10, dexterity: 10, constitution: 10,
  intelligence: 10, wisdom: 10, charisma: 10,
}

function emptySheet(type: CharacterSheetType): Omit<CharacterSheet, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    type,
    name: '',
    maxHp: type === 'adventurer' ? 10 : 15,
    armorClass: type === 'adventurer' ? 12 : 10,
    abilityScores: null,
    alignment: null,
    notes: '',
    className: null,
    subClass: null,
    level: type === 'adventurer' ? 1 : null,
    spellSlots: null,
    limitedFeatures: [],
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CharacterSheetFormProps {
  type: CharacterSheetType
  existing?: CharacterSheet     // if editing
  onSaved: () => void
  onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CharacterSheetForm({
  type, existing, onSaved, onCancel
}: CharacterSheetFormProps) {
  const [sheet, setSheet] = useState<Omit<CharacterSheet, 'id' | 'createdAt' | 'updatedAt'>>(
    existing
      ? { type: existing.type, name: existing.name, maxHp: existing.maxHp,
          armorClass: existing.armorClass, abilityScores: existing.abilityScores,
          alignment: existing.alignment, notes: existing.notes, className: existing.className,
          subClass: existing.subClass, level: existing.level, spellSlots: existing.spellSlots,
          limitedFeatures: existing.limitedFeatures }
      : emptySheet(type)
  )
  const [showOptional, setShowOptional]   = useState(!!existing?.abilityScores)
  const [nameError, setNameError]         = useState('')
  const [saving, setSaving]               = useState(false)

  // Recompute spell slots and features when class or level changes
  useEffect(() => {
    if (sheet.className && sheet.level) {
      const slots    = getSpellSlots(sheet.className, sheet.level)
      const features = getLimitedFeatures(sheet.className, sheet.level)
      setSheet(prev => ({ ...prev, spellSlots: slots, limitedFeatures: features }))
    } else {
      setSheet(prev => ({ ...prev, spellSlots: null, limitedFeatures: [] }))
    }
  }, [sheet.className, sheet.level])

  function set<K extends keyof typeof sheet>(key: K, value: (typeof sheet)[K]) {
    setSheet(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!sheet.name.trim()) { setNameError('El nombre es requerido'); return }
    setNameError('')
    setSaving(true)
    try {
      if (existing) {
        await updateCharacterSheet(existing.id, sheet)
        notifications.show({ message: `${sheet.name} actualizado`, color: 'blue' })
      } else {
        await createCharacterSheet(sheet)
        notifications.show({ message: `${sheet.name} creado`, color: 'green' })
      }
      onSaved()
    } catch (e) {
      notifications.show({ message: 'Error al guardar', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const isAdventurer = type === 'adventurer'
  const hasClass     = isAdventurer && !!sheet.className
  const hasSpells    = hasClass && !!sheet.spellSlots
  const hasFeatures  = hasClass && sheet.limitedFeatures.length > 0

  // Determine initiative bonus from DEX if ability scores set
  const dexMod = sheet.abilityScores
    ? abilityModifier(sheet.abilityScores.dexterity)
    : null

  const typeLabel = type === 'adventurer' ? 'Aventurero' : type === 'npc' ? 'NPC' : 'Monstruo'
  const typeColor = type === 'adventurer' ? 'blue' : type === 'npc' ? 'teal' : 'red'

  return (
    <Stack gap="md">
      {/* ── Required fields ── */}
      <TextInput
        label="Nombre"
        placeholder={`Nombre del ${typeLabel.toLowerCase()}`}
        value={sheet.name}
        onChange={e => { set('name', e.currentTarget.value); setNameError('') }}
        error={nameError}
        required
      />
      <Group grow>
        <NumberInput
          label="HP máximo"
          min={1} max={9999}
          value={sheet.maxHp}
          onChange={v => set('maxHp', Number(v))}
          required
        />
        <NumberInput
          label="Clase de armadura (CA)"
          min={1} max={30}
          value={sheet.armorClass}
          onChange={v => set('armorClass', Number(v))}
          required
        />
      </Group>

      {/* ── Adventurer: class & level ── */}
      {isAdventurer && (
        <>
          <Divider label={<Text size="xs" c="dimmed">Clase y nivel</Text>} labelPosition="left" />
          <Group grow>
            <Select
              label="Clase"
              placeholder="Elegir clase..."
              clearable
              data={ALL_CLASSES.map(c => ({ value: c, label: c }))}
              value={sheet.className}
              onChange={v => {
                set('className', (v as DndClass) ?? null)
                set('subClass', null)
              }}
            />
            <NumberInput
              label="Nivel"
              min={1} max={20}
              value={sheet.level ?? 1}
              onChange={v => set('level', Number(v))}
              disabled={!sheet.className}
            />
          </Group>
          {hasClass && (
            <Select
              label="Sub-clase"
              placeholder="Elegir sub-clase (opcional)..."
              clearable
              data={SUBCLASSES[sheet.className!].map(s => ({ value: s, label: s }))}
              value={sheet.subClass}
              onChange={v => set('subClass', v ?? null)}
            />
          )}

          {/* Spell slots */}
          {hasSpells && sheet.spellSlots && (
            <SpellSlotsDisplay slots={sheet.spellSlots} className={sheet.className!} />
          )}

          {/* Limited features */}
          {hasFeatures && (
            <LimitedFeaturesDisplay features={sheet.limitedFeatures} />
          )}
        </>
      )}

      {/* ── Optional section toggle ── */}
      <Divider
        label={
          <Switch
            label="Estadísticas opcionales"
            size="xs"
            checked={showOptional}
            onChange={e => setShowOptional(e.currentTarget.checked)}
            color={typeColor}
          />
        }
        labelPosition="left"
      />

      <Collapse in={showOptional}>
        <Stack gap="md">
          {/* Alignment (NPC & monster) */}
          {!isAdventurer && (
            <Select
              label="Alineamiento"
              placeholder="Seleccionar..."
              clearable
              data={ALIGNMENTS.map(a => ({ value: a, label: a }))}
              value={sheet.alignment}
              onChange={v => set('alignment', (v as Alignment) ?? null)}
            />
          )}

          {/* Ability scores */}
          <AbilityScoresGrid
            scores={sheet.abilityScores ?? DEFAULT_SCORES}
            onChange={scores => set('abilityScores', scores)}
          />

          {/* Show computed DEX modifier if scores set */}
          {dexMod !== null && (
            <Text size="xs" c="dimmed">
              Bono de iniciativa (mod. DES): <strong>{dexMod >= 0 ? `+${dexMod}` : dexMod}</strong>
            </Text>
          )}

          {/* Notes */}
          <Textarea
            label="Notas"
            placeholder="Descripción, trasfondo, equipo especial..."
            minRows={2}
            maxRows={5}
            value={sheet.notes}
            onChange={e => set('notes', e.currentTarget.value)}
            autosize
          />
        </Stack>
      </Collapse>

      {/* ── Actions ── */}
      <Group justify="flex-end" mt="xs">
        <Button variant="subtle" color="gray" leftSection={<IconX size={16} />} onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          color={typeColor}
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={handleSave}
          loading={saving}
        >
          {existing ? 'Guardar cambios' : `Crear ${typeLabel}`}
        </Button>
      </Group>
    </Stack>
  )
}
