import { useState } from 'react'
import {
  Container, Title, Text, Stack, Group, Button, Tabs,
  Modal, Loader, Center
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  IconUser, IconSkull, IconUsers, IconPlus
} from '@tabler/icons-react'
import { useAllCharacterSheets } from '@/hooks/useCombat'
import type { CharacterSheet, CharacterSheetType } from '@/types'
import CharacterSheetCard from '@/components/Characters/CharacterSheetCard'
import CharacterSheetForm from '@/components/Characters/CharacterSheetForm'

const TABS: { value: CharacterSheetType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'adventurer', label: 'Aventureros', icon: <IconUser size={16} />,   color: 'blue' },
  { value: 'npc',        label: 'NPCs',        icon: <IconUsers size={16} />,  color: 'teal' },
  { value: 'monster',    label: 'Monstruos',   icon: <IconSkull size={16} />,  color: 'red'  },
]

export default function CharactersPage() {
  const sheets = useAllCharacterSheets()
  const [activeTab, setActiveTab] = useState<CharacterSheetType>('adventurer')
  const [editTarget, setEditTarget] = useState<CharacterSheet | null>(null)
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false)

  if (sheets === undefined) {
    return <Center h={200}><Loader /></Center>
  }

  function handleCreate() {
    setEditTarget(null)
    openModal()
  }

  function handleEdit(sheet: CharacterSheet) {
    setEditTarget(sheet)
    openModal()
  }

  function handleSaved() {
    closeModal()
    setEditTarget(null)
  }

  function handleCancel() {
    closeModal()
    setEditTarget(null)
  }

  const filtered = sheets.filter(s => s.type === activeTab)
  const tab = TABS.find(t => t.value === activeTab)!

  return (
    <Container size="sm" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={2}>
          <Title order={2}>Personajes</Title>
          <Text c="dimmed" size="sm">
            Biblioteca de personajes reutilizables en cualquier combate
          </Text>
        </Stack>
        <Button
          leftSection={<IconPlus size={18} />}
          color={tab.color}
          onClick={handleCreate}
        >
          Nuevo {activeTab === 'adventurer' ? 'aventurero' : activeTab === 'npc' ? 'NPC' : 'monstruo'}
        </Button>
      </Group>

      <Tabs
        value={activeTab}
        onChange={v => setActiveTab(v as CharacterSheetType)}
      >
        <Tabs.List mb="md">
          {TABS.map(t => (
            <Tabs.Tab key={t.value} value={t.value} leftSection={t.icon} color={t.color}>
              {t.label}
              {sheets.filter(s => s.type === t.value).length > 0 && (
                <Text span size="xs" c="dimmed" ml={4}>
                  ({sheets.filter(s => s.type === t.value).length})
                </Text>
              )}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {TABS.map(t => (
          <Tabs.Panel key={t.value} value={t.value}>
            {filtered.length === 0 ? (
              <Center h={160}>
                <Stack align="center" gap="md">
                  {t.icon}
                  <Text c="dimmed" size="sm" ta="center">
                    No hay {t.label.toLowerCase()} todavía.<br />
                    Creá uno con el botón de arriba.
                  </Text>
                </Stack>
              </Center>
            ) : (
              <Stack gap="sm">
                {filtered.map(sheet => (
                  <CharacterSheetCard key={sheet.id} sheet={sheet} onEdit={handleEdit} />
                ))}
              </Stack>
            )}
          </Tabs.Panel>
        ))}
      </Tabs>

      {/* Create / Edit modal */}
      <Modal
        opened={modalOpen}
        onClose={handleCancel}
        title={
          <Text fw={700}>
            {editTarget
              ? `Editar — ${editTarget.name}`
              : `Nuevo ${activeTab === 'adventurer' ? 'aventurero' : activeTab === 'npc' ? 'NPC' : 'monstruo'}`}
          </Text>
        }
        size="lg"
        centered
      >
        <CharacterSheetForm
          type={editTarget?.type ?? activeTab}
          existing={editTarget ?? undefined}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </Modal>
    </Container>
  )
}
