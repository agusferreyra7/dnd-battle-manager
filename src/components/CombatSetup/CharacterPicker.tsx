import { useState, useMemo } from 'react'
import {
  Stack, TextInput, Group, Text, Badge, Card, ActionIcon,
  NumberInput, SegmentedControl, Tooltip, ScrollArea,
  Center, Loader
} from '@mantine/core'
import { IconSearch, IconPlus, IconDice, IconUser } from '@tabler/icons-react'
import { useAllCharacterSheets } from '@/hooks/useCombat'
import { rollInitiative } from '@/db/queries'
import { abilityModifier } from '@/services/open5e'
import type { CharacterSheet, CharacterSheetType } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PickedCharacter {
  sheet: CharacterSheet
  initiative: number
}

interface CharacterPickerProps {
  /** Called once per character when the user confirms adding them */
  onAdd: (picked: PickedCharacter) => void
}

// ─── Per-row initiative state ─────────────────────────────────────────────────

function SheetRow({
  sheet,
  onAdd,
}: {
  sheet: CharacterSheet
  onAdd: (picked: PickedCharacter) => void
}) {
  const dexMod = sheet.abilityScores
    ? abilityModifier(sheet.abilityScores.dexterity)
    : 0

  const [initiative, setInitiative] = useState<number>(() =>
    rollInitiative(dexMod)
  )

  const typeColor  = sheet.type === 'adventurer' ? 'blue' : sheet.type === 'npc' ? 'teal' : 'red'
  const typeLabel  = sheet.type === 'adventurer' ? 'Av' : sheet.type === 'npc' ? 'NPC' : 'Mo'
  const bonusLabel = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`

  return (
    <Card withBorder padding="sm" radius="md">
      <Group justify="space-between" wrap="nowrap">
        {/* Left — name + stats */}
        <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text fw={600} size="sm" truncate>{sheet.name}</Text>
            <Badge color={typeColor} variant="light" size="xs" style={{ flexShrink: 0 }}>
              {typeLabel}
            </Badge>
            {sheet.type === 'adventurer' && sheet.className && (
              <Badge color="gray" variant="dot" size="xs" style={{ flexShrink: 0 }}>
                {sheet.className} {sheet.level ?? ''}
              </Badge>
            )}
          </Group>
          <Group gap="md">
            <Text size="xs" c="dimmed">HP: <strong>{sheet.maxHp}</strong></Text>
            <Text size="xs" c="dimmed">CA: <strong>{sheet.armorClass}</strong></Text>
            <Text size="xs" c="dimmed">Init bono: <strong>{bonusLabel}</strong></Text>
          </Group>
        </Stack>

        {/* Right — initiative roller + add */}
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <NumberInput
            min={-9}
            max={40}
            value={initiative}
            onChange={v => setInitiative(Number(v) || 0)}
            style={{ width: 72 }}
            size="xs"
            styles={{ input: { textAlign: 'center', fontWeight: 700 } }}
            aria-label="Iniciativa"
          />
          <Tooltip label={`Tirar 1d20 ${bonusLabel}`}>
            <ActionIcon
              variant="light"
              color="orange"
              size="sm"
              onClick={() => setInitiative(rollInitiative(dexMod))}
            >
              <IconDice size={14} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={`Agregar ${sheet.name}`}>
            <ActionIcon
              variant="filled"
              color={typeColor}
              size="sm"
              onClick={() => onAdd({ sheet, initiative })}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type FilterType = CharacterSheetType | 'all'

export default function CharacterPicker({ onAdd }: CharacterPickerProps) {
  const sheets = useAllCharacterSheets()
  const [query,  setQuery]  = useState('')
  const [filter, setFilter] = useState<FilterType>('all')

  const filtered = useMemo(() => {
    if (!sheets) return []
    return sheets.filter(s => {
      const matchType  = filter === 'all' || s.type === filter
      const matchQuery = !query.trim() || s.name.toLowerCase().includes(query.trim().toLowerCase())
      return matchType && matchQuery
    })
  }, [sheets, query, filter])

  if (sheets === undefined) {
    return <Center h={120}><Loader size="sm" /></Center>
  }

  if (sheets.length === 0) {
    return (
      <Center h={120}>
        <Stack align="center" gap="xs">
          <IconUser size={32} color="var(--mantine-color-dimmed)" />
          <Text size="sm" c="dimmed" ta="center">
            No hay personajes guardados todavía.<br />
            Creá uno en la pestaña <strong>Personajes</strong>.
          </Text>
        </Stack>
      </Center>
    )
  }

  return (
    <Stack gap="sm">
      {/* Search + filter bar */}
      <Group gap="xs">
        <TextInput
          placeholder="Buscar por nombre..."
          leftSection={<IconSearch size={14} />}
          value={query}
          onChange={e => setQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
          size="sm"
        />
      </Group>

      <SegmentedControl
        size="xs"
        fullWidth
        value={filter}
        onChange={v => setFilter(v as FilterType)}
        data={[
          { value: 'all',       label: 'Todos' },
          { value: 'adventurer', label: '⚔ Aventureros' },
          { value: 'npc',       label: '🧑 NPCs' },
          { value: 'monster',   label: '💀 Monstruos' },
        ]}
      />

      {/* Result list */}
      {filtered.length === 0 ? (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Sin resultados para "{query}"
        </Text>
      ) : (
        <ScrollArea.Autosize mah={360} offsetScrollbars>
          <Stack gap="xs">
            {filtered.map(sheet => (
              <SheetRow key={sheet.id} sheet={sheet} onAdd={onAdd} />
            ))}
          </Stack>
        </ScrollArea.Autosize>
      )}

      <Text size="xs" c="dimmed" ta="right">
        {filtered.length} de {sheets.length} personaje{sheets.length !== 1 ? 's' : ''}
      </Text>
    </Stack>
  )
}
