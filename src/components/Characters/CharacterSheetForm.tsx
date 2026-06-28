import { useState, useEffect } from 'react'
import {
  Stack, TextInput, NumberInput, Select, Textarea, Button,
  Group, Divider, Text, Switch, Collapse
} from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconDeviceFloppy, IconX } from '@tabler/icons-react'
import { createCharacterSheet, updateCharacterSheet } from '@/db/queries'
import { getSpellSlots, getLimitedFeatures, ALL_CLASSES, SUBCLASSES, ALIGNMENTS } from '@/data/classData'
import { SRD_RACES, NPC_RACES, getRacialCombatTraits } from '@/data/raceData'
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
    race: null,
    racialTraits: [],
    className: null,
    subClass: null,
    level: type === 'adventurer' ? 1 : null,
    spellSlots: null,
    limitedFeatures: [],
    npcClassName: null,
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CharacterSheetFormProps {
  type: CharacterSheetType
  existing?: CharacterSheet
  onSaved: () => void
  onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CharacterSheetForm({ type, existing, onSaved, onCancel }: CharacterSheetFormProps) {
  const [sheet, setSheet] = useState<Omit<CharacterSheet, 'id' | 'createdAt' | 'updatedAt'>>(
    existing
      ? {
          type: existing.type, name: existing.name, maxHp: existing.maxHp,
          armorClass: existing.armorClass, abilityScores: existing.abilityScores,
          alignment: existing.alignment, notes: existing.notes,
          race: existing.race ?? null, racialTraits: existing.racialTraits ?? [],
          className: existing.className, subClass: existing.subClass,
          level: existing.level, spellSlots: existing.spellSlots,
          limitedFeatures: existing.limitedFeatures ?? [],
          npcClassName: existing.npcClassName ?? null,
        }
      : emptySheet(type)
  )
  // Adventurers can type a custom race not in the list
  const [customRace, setCustomRace]       = useState(
    existing?.race && !SRD_RACES.includes(existing.race as typeof SRD_RACES[number]) ? existing.race : ''
  )
  const [showOptional, setShowOptional]   = useState(!!existing?.abilityScores || !!existing?.race)
  const [nameError, setNameError]         = useState('')
  const [saving, setSaving]               = useState(false)

  const isAdventurer = type === 'adventurer'
  const isNpc        = type === 'npc'

  // Recompute spell slots and class features when class/level changes
  useEffect(() => {
    const cls = isAdventurer ? sheet.className : (sheet.npcClassName as DndClass | null)
    const lvl = sheet.level
    if (cls && lvl && ALL_CLASSES.includes(cls as DndClass)) {
      const slots    = getSpellSlots(cls as DndClass, lvl)
      const features = getLimitedFeatures(cls as DndClass, lvl)
      setSheet(prev => ({ ...prev, spellSlots: slots, limitedFeatures: features }))
    } else {
      setSheet(prev => ({ ...prev, spellSlots: null, limitedFeatures: [] }))
    }
  }, [sheet.className, sheet.npcClassName, sheet.level, isAdventurer])

  // Recompute racial traits when race changes
  useEffect(() => {
    const race = isAdventurer && customRace.trim() ? customRace.trim() : sheet.race
    const traits = race ? getRacialCombatTraits(race) : []
    setSheet(prev => ({ ...prev, racialTraits: traits }))
  }, [sheet.race, customRace, isAdventurer])

  function set<K extends keyof typeof sheet>(key: K, value: (typeof sheet)[K]) {
    setSheet(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    if (!sheet.name.trim()) { setNameError('El nombre es requerido'); return }
    setNameError('')
    setSaving(true)

    // Resolve final race value
    const finalRace = isAdventurer && customRace.trim()
      ? customRace.trim()
      : sheet.race

    const finalSheet = { ...sheet, race: finalRace }

    try {
      if (existing) {
        await updateCharacterSheet(existing.id, finalSheet)
        notifications.show({ message: `${sheet.name} actualizado`, color: 'blue' })
      } else {
        await createCharacterSheet(finalSheet)
        notifications.show({ message: `${sheet.name} creado`, color: 'green' })
      }
      onSaved()
    } catch {
      notifications.show({ message: 'Error al guardar', color: 'red' })
    } finally {
      setSaving(false)
    }
  }

  const hasClass    = isAdventurer && !!sheet.className
  const npcHasClass = isNpc && !!sheet.npcClassName && ALL_CLASSES.includes(sheet.npcClassName as DndClass)
  const hasSpells   = (hasClass || npcHasClass) && !!sheet.spellSlots
  const hasFeatures = (hasClass || npcHasClass) && sheet.limitedFeatures.length > 0
  const hasRacialTraits = sheet.racialTraits.length > 0

  const dexMod = sheet.abilityScores ? abilityModifier(sheet.abilityScores.dexterity) : null
  const typeLabel = type === 'adventurer' ? 'Aventurero' : type === 'npc' ? 'NPC' : 'Monstruo'
  const typeColor = type === 'adventurer' ? 'blue' : type === 'npc' ? 'teal' : 'red'

  // Whether the user is using a custom (non-SRD) race for an adventurer
  const isUsingCustomRace = isAdventurer && !!customRace.trim()

  return (
    <Stack gap="md">
      {/* ── Obligatorio ── */}
      <TextInput
        label="Nombre"
        placeholder={`Nombre del ${typeLabel.toLowerCase()}`}
        value={sheet.name}
        onChange={e => { set('name', e.currentTarget.value); setNameError('') }}
        error={nameError}
        required
      />
      <Group grow>
        <NumberInput label="HP máximo" min={1} max={9999} value={sheet.maxHp} onChange={v => set('maxHp', Number(v))} required />
        <NumberInput label="Clase de armadura (CA)" min={1} max={30} value={sheet.armorClass} onChange={v => set('armorClass', Number(v))} required />
      </Group>

      {/* ── Aventurero: clase, nivel, sub-clase ── */}
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
              onChange={v => { set('className', (v as DndClass) ?? null); set('subClass', null) }}
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
          {hasSpells && sheet.spellSlots && <SpellSlotsDisplay slots={sheet.spellSlots} className={sheet.className!} />}
          {hasFeatures && <LimitedFeaturesDisplay features={sheet.limitedFeatures} />}
        </>
      )}

      {/* ── NPC: clase libre ── */}
      {isNpc && (
        <>
          <Divider label={<Text size="xs" c="dimmed">Clase (opcional)</Text>} labelPosition="left" />
          <Group grow>
            <Select
              label="Clase"
              placeholder="Elegir o dejar vacío..."
              clearable
              data={ALL_CLASSES.map(c => ({ value: c, label: c }))}
              value={ALL_CLASSES.includes(sheet.npcClassName as DndClass) ? sheet.npcClassName : null}
              onChange={v => { set('npcClassName', v ?? null); set('level', v ? 1 : null) }}
            />
            <NumberInput
              label="Nivel"
              min={1} max={20}
              value={sheet.level ?? 1}
              onChange={v => set('level', Number(v))}
              disabled={!sheet.npcClassName}
            />
          </Group>
          {hasSpells && sheet.spellSlots && sheet.npcClassName && (
            <SpellSlotsDisplay slots={sheet.spellSlots} className={sheet.npcClassName as DndClass} />
          )}
          {hasFeatures && <LimitedFeaturesDisplay features={sheet.limitedFeatures} />}
        </>
      )}

      {/* ── Opcionales ── */}
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
          {/* Alignment */}
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

          {/* Race */}
          <Divider label={<Text size="xs" c="dimmed">Raza</Text>} labelPosition="left" />
          {isAdventurer ? (
            <Stack gap="xs">
              <Select
                label="Raza del SRD"
                description="Razas del reglamento oficial. Dejá vacío para usar una personalizada."
                placeholder="Elegir raza..."
                clearable
                data={SRD_RACES.map(r => ({ value: r, label: r }))}
                value={isUsingCustomRace ? null : (sheet.race ?? null)}
                onChange={v => {
                  set('race', v ?? null)
                  setCustomRace('')    // clear custom when SRD race is picked
                }}
                disabled={isUsingCustomRace}
              />
              <TextInput
                label="Raza personalizada"
                description="Usá esto para razas homebrew o de expansiones no SRD."
                placeholder="Ej: Leonin, Harengon, Locathah..."
                value={customRace}
                onChange={e => {
                  setCustomRace(e.currentTarget.value)
                  if (e.currentTarget.value.trim()) set('race', null)  // clear SRD selection
                }}
              />
            </Stack>
          ) : (
            <Select
              label="Raza"
              placeholder="Elegir raza..."
              clearable
              data={NPC_RACES.map(r => ({ value: r, label: r }))}
              value={sheet.race}
              onChange={v => set('race', v ?? null)}
            />
          )}

          {/* Show racial traits preview */}
          {hasRacialTraits && (
            <Stack gap="xs">
              <Text size="xs" fw={500} c="dimmed">
                Rasgos raciales de combate ({sheet.racialTraits.length})
              </Text>
              <LimitedFeaturesDisplay features={sheet.racialTraits} />
            </Stack>
          )}

          {/* Ability scores */}
          <AbilityScoresGrid
            scores={sheet.abilityScores ?? DEFAULT_SCORES}
            onChange={scores => set('abilityScores', scores)}
          />

          {dexMod !== null && (
            <Text size="xs" c="dimmed">
              Bono de iniciativa (mod. DES): <strong>{dexMod >= 0 ? `+${dexMod}` : dexMod}</strong>
            </Text>
          )}

          <Textarea
            label="Notas"
            placeholder="Descripción, trasfondo, equipo especial..."
            minRows={2} maxRows={5}
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
        <Button color={typeColor} leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave} loading={saving}>
          {existing ? 'Guardar cambios' : `Crear ${typeLabel}`}
        </Button>
      </Group>
    </Stack>
  )
}
