import { Card, Group, Stack, Text, Badge, ActionIcon, Collapse, Box } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconPencil, IconTrash, IconChevronDown } from '@tabler/icons-react'
import { deleteCharacterSheet } from '@/db/queries'
import { notifications } from '@mantine/notifications'
import { abilityModifier } from '@/services/open5e'
import type { CharacterSheet, AbilityScores } from '@/types'
import SpellSlotsDisplay from './SpellSlotsDisplay'
import LimitedFeaturesDisplay from './LimitedFeaturesDisplay'

const TYPE_COLOR: Record<CharacterSheet['type'], string> = {
  adventurer: 'blue', npc: 'teal', monster: 'red',
}
const TYPE_LABEL: Record<CharacterSheet['type'], string> = {
  adventurer: 'Aventurero', npc: 'NPC', monster: 'Monstruo',
}
const ABILITY_SHORT: [string, keyof AbilityScores][] = [
  ['FUE','strength'],['DES','dexterity'],['CON','constitution'],
  ['INT','intelligence'],['SAB','wisdom'],['CAR','charisma'],
]

interface CharacterSheetCardProps {
  sheet: CharacterSheet
  onEdit: (sheet: CharacterSheet) => void
}

export default function CharacterSheetCard({ sheet, onEdit }: CharacterSheetCardProps) {
  const [expanded, { toggle }] = useDisclosure(false)
  const color = TYPE_COLOR[sheet.type]

  async function handleDelete() {
    await deleteCharacterSheet(sheet.id)
    notifications.show({ message: `${sheet.name} eliminado`, color: 'red' })
  }

  const hasExtra = sheet.abilityScores || sheet.alignment || sheet.notes || sheet.race
    || sheet.spellSlots || sheet.limitedFeatures?.length > 0 || sheet.racialTraits?.length > 0

  return (
    <Card withBorder padding="sm" radius="md">
      <Stack gap="xs">
        {/* Header row */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" wrap="nowrap">
            <Stack gap={2} style={{ minWidth: 0 }}>
              <Group gap="xs">
                <Text fw={600} truncate>{sheet.name}</Text>
                <Badge color={color} variant="light" size="xs">{TYPE_LABEL[sheet.type]}</Badge>
                {sheet.type === 'adventurer' && sheet.className && (
                  <Badge color="gray" variant="dot" size="xs">
                    {sheet.className}{sheet.level ? ` ${sheet.level}` : ''}
                  </Badge>
                )}
                {sheet.type === 'npc' && sheet.npcClassName && (
                  <Badge color="gray" variant="dot" size="xs">
                    {sheet.npcClassName}{sheet.level ? ` ${sheet.level}` : ''}
                  </Badge>
                )}
                {sheet.race && (
                  <Badge color="violet" variant="light" size="xs">{sheet.race}</Badge>
                )}
                {sheet.alignment && (
                  <Badge color="gray" variant="outline" size="xs">{sheet.alignment}</Badge>
                )}
              </Group>
              <Group gap="md">
                <Text size="xs" c="dimmed">HP: <strong>{sheet.maxHp}</strong></Text>
                <Text size="xs" c="dimmed">CA: <strong>{sheet.armorClass}</strong></Text>
                {sheet.abilityScores && (
                  <Text size="xs" c="dimmed">
                    Init: <strong>
                      {abilityModifier(sheet.abilityScores.dexterity) >= 0 ? '+' : ''}
                      {abilityModifier(sheet.abilityScores.dexterity)}
                    </strong>
                  </Text>
                )}
              </Group>
            </Stack>
          </Group>
          <Group gap={4} wrap="nowrap">
            <ActionIcon variant="light" color="blue" onClick={() => onEdit(sheet)} aria-label="Editar">
              <IconPencil size={15} />
            </ActionIcon>
            <ActionIcon variant="light" color="red" onClick={handleDelete} aria-label="Eliminar">
              <IconTrash size={15} />
            </ActionIcon>
            {hasExtra && (
              <ActionIcon
                variant="subtle" color="gray"
                onClick={toggle}
                style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <IconChevronDown size={15} />
              </ActionIcon>
            )}
          </Group>
        </Group>

        {/* Expanded details */}
        <Collapse in={expanded}>
          <Stack gap="sm" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>

            {/* Ability scores */}
            {sheet.abilityScores && (
              <Group gap="sm" wrap="wrap">
                {ABILITY_SHORT.map(([short, key]) => {
                  const scores = sheet.abilityScores as AbilityScores
                  const score  = scores[key]
                  const mod    = abilityModifier(score)
                  return (
                    <Box key={short} style={{ textAlign: 'center', minWidth: 52 }}>
                      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{short}</Text>
                      <Text size="md" fw={700}>{score}</Text>
                      <Text size="xs" c={mod >= 0 ? 'blue' : 'red'} fw={500}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </Text>
                    </Box>
                  )
                })}
              </Group>
            )}

            {/* Sub-class */}
            {sheet.subClass && (
              <Text size="xs" c="dimmed">Sub-clase: <strong>{sheet.subClass}</strong></Text>
            )}

            {/* Racial traits */}
            {sheet.racialTraits?.length > 0 && (
              <LimitedFeaturesDisplay features={sheet.racialTraits} />
            )}

            {/* Spell slots */}
            {sheet.spellSlots && sheet.className && (
              <SpellSlotsDisplay slots={sheet.spellSlots} className={sheet.className} />
            )}

            {/* Limited features */}
            {sheet.limitedFeatures?.length > 0 && (
              <LimitedFeaturesDisplay features={sheet.limitedFeatures} />
            )}

            {/* Notes */}
            {sheet.notes && (
              <Text size="xs" c="dimmed" style={{ whiteSpace: 'pre-line' }}>
                {sheet.notes}
              </Text>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  )
}
