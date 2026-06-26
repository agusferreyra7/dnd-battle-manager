import { useState, useRef, useEffect } from 'react'
import {
  TextInput, Paper, Stack, Text, Group, Badge, Loader,
  ActionIcon, Box, Divider
} from '@mantine/core'
import { IconSearch, IconX, IconExternalLink } from '@tabler/icons-react'
import { useMonsterSearch } from '@/hooks/useMonsterSearch'
import { monsterToFormValues, abilityModifier } from '@/services/open5e'
import type { Open5eMonster, ParticipantFormValues } from '@/types'

// ─── CR color ─────────────────────────────────────────────────────────────────

function crColor(cr: number): string {
  if (cr <= 0.5) return 'green'
  if (cr <= 4)   return 'yellow'
  if (cr <= 10)  return 'orange'
  if (cr <= 16)  return 'red'
  return 'grape'
}

// ─── Single result row ────────────────────────────────────────────────────────

function MonsterResultRow({
  monster,
  onSelect,
}: {
  monster: Open5eMonster
  onSelect: (m: Open5eMonster) => void
}) {
  const dexMod = abilityModifier(monster.dexterity)
  const initBonus = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`

  return (
    <Box
      onClick={() => onSelect(monster)}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        borderRadius: 'var(--mantine-radius-sm)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background =
          'var(--mantine-color-dark-5)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <Stack gap={1} style={{ minWidth: 0 }}>
          <Group gap="xs" wrap="nowrap">
            <Text size="sm" fw={600} truncate>
              {monster.name}
            </Text>
            <Badge
              color={crColor(monster.cr)}
              variant="light"
              size="xs"
              style={{ flexShrink: 0 }}
            >
              CR {monster.challenge_rating}
            </Badge>
          </Group>
          <Text size="xs" c="dimmed">
            {monster.size} {monster.type}
            {monster.document__title ? ` · ${monster.document__title}` : ''}
          </Text>
        </Stack>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Text size="xs" c="dimmed">HP {monster.hit_points}</Text>
          <Text size="xs" c="dimmed">CA {monster.armor_class}</Text>
          <Text size="xs" c="dimmed">Init {initBonus}</Text>
        </Group>
      </Group>
    </Box>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MonsterSearchProps {
  /** Called when the user selects a monster and wants to use its stats */
  onFill: (values: Partial<ParticipantFormValues> & { notes: string }) => void
}

export default function MonsterSearch({ onFill }: MonsterSearchProps) {
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef          = useRef<HTMLDivElement>(null)
  const { results, isLoading, error, search, clear } = useMonsterSearch()

  function handleChange(val: string) {
    setQuery(val)
    setOpen(true)
    search(val)
  }

  function handleSelect(monster: Open5eMonster) {
    const mapped = monsterToFormValues(monster)
    const dexMod = abilityModifier(monster.dexterity)

    // Build a notes string with the extra flavor info
    const notesParts = [
      `CR ${mapped.cr} · ${mapped.size} ${mapped.type}`,
      mapped.hitDice ? `Dados de golpe: ${mapped.hitDice}` : null,
      mapped.senses  ? `Sentidos: ${mapped.senses}` : null,
      mapped.source  ? `Fuente: ${mapped.source}` : null,
    ].filter(Boolean)

    onFill({
      name:            mapped.name,
      maxHp:           mapped.maxHp,
      armorClass:      mapped.armorClass,
      initiativeBonus: dexMod,
      initiative:      null,   // let them roll after
      notes:           notesParts.join('\n'),
    })

    setQuery('')
    setOpen(false)
    clear()
  }

  function handleClear() {
    setQuery('')
    setOpen(false)
    clear()
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const showDropdown = open && query.length >= 2

  return (
    <Box ref={containerRef} style={{ position: 'relative' }}>
      <TextInput
        label="Buscar en Open5e SRD"
        description="Escribí el nombre del monstruo para autocompletar sus estadísticas"
        placeholder="Ej: Goblin, Dragon, Troll..."
        value={query}
        onChange={(e) => handleChange(e.currentTarget.value)}
        onFocus={() => query.length >= 2 && setOpen(true)}
        leftSection={isLoading ? <Loader size={14} /> : <IconSearch size={14} />}
        rightSection={
          query ? (
            <ActionIcon size="xs" variant="subtle" color="gray" onClick={handleClear}>
              <IconX size={12} />
            </ActionIcon>
          ) : null
        }
      />

      {showDropdown && (
        <Paper
          withBorder
          shadow="md"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 300,
            overflow: 'hidden',
            maxHeight: 320,
            overflowY: 'auto',
          }}
        >
          {error && (
            <Text size="xs" c="red" p="sm">
              {error}
            </Text>
          )}

          {!error && !isLoading && results.length === 0 && (
            <Text size="xs" c="dimmed" p="sm">
              No se encontraron monstruos para "{query}"
            </Text>
          )}

          {results.length > 0 && (
            <Stack gap={0} p="xs">
              {results.map((m) => (
                <MonsterResultRow key={m.slug} monster={m} onSelect={handleSelect} />
              ))}
              <Divider my="xs" />
              <Group justify="flex-end" px="xs" pb="xs">
                <Text
                  size="xs"
                  c="dimmed"
                  component="a"
                  href={`https://open5e.com/monsters/${results[0]?.slug ?? ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <IconExternalLink size={11} />
                  Ver en Open5e
                </Text>
              </Group>
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  )
}
