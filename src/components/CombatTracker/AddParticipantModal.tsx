import { useState } from 'react'
import { Modal, Tabs, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconUser, IconSkull, IconBooks } from '@tabler/icons-react'
import { addParticipant, addParticipantFromSheet, rollInitiative } from '@/db/queries'
import ParticipantForm from '@/components/CombatSetup/ParticipantForm'
import CharacterPicker, { type PickedCharacter } from '@/components/CombatSetup/CharacterPicker'
import type { ParticipantFormValues } from '@/types'

interface AddParticipantModalProps {
  combatId: string
  opened: boolean
  onClose: () => void
}

export default function AddParticipantModal({
  combatId,
  opened,
  onClose,
}: AddParticipantModalProps) {
  const [tab, setTab] = useState<string | null>('library')

  // ── Add from manual form ─────────────────────────────────────────────────

  async function handleAddManual(batch: ParticipantFormValues[]) {
    for (const values of batch) {
      const initiative = values.initiative ?? rollInitiative(values.initiativeBonus)
      await addParticipant(combatId, { ...values, initiative })
    }
    const isSingle = batch.length === 1
    notifications.show({
      message: isSingle
        ? `${batch[0].name} entró al combate`
        : `${batch.length} monstruos entraron al combate`,
      color: batch[0].type === 'adventurer' ? 'blue' : 'red',
    })
    onClose()
  }

  // ── Add from library picker ──────────────────────────────────────────────

  async function handleAddFromLibrary({ sheet, initiative }: PickedCharacter) {
    await addParticipantFromSheet(combatId, sheet, initiative)
    notifications.show({
      message: `${sheet.name} entró al combate`,
      color: sheet.type === 'adventurer' ? 'blue' : 'red',
    })
    onClose()
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Agregar participante</Text>}
      centered
      size="lg"
    >
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="library" leftSection={<IconBooks size={14} />}>
            Desde biblioteca
          </Tabs.Tab>
          <Tabs.Tab value="adventurer" leftSection={<IconUser size={14} />}>
            Aventurero manual
          </Tabs.Tab>
          <Tabs.Tab value="monster" leftSection={<IconSkull size={14} />}>
            Monstruo manual
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="library" pt="md">
          <CharacterPicker onAdd={handleAddFromLibrary} />
        </Tabs.Panel>
        <Tabs.Panel value="adventurer" pt="md">
          <ParticipantForm type="adventurer" onSubmit={handleAddManual} />
        </Tabs.Panel>
        <Tabs.Panel value="monster" pt="md">
          <ParticipantForm type="monster" onSubmit={handleAddManual} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
