import { useState } from 'react'
import { Modal, Tabs, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { IconUser, IconSkull } from '@tabler/icons-react'
import { addParticipant, rollInitiative } from '@/db/queries'
import ParticipantForm from '@/components/CombatSetup/ParticipantForm'
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
  const [tab, setTab] = useState<string | null>('adventurer')

  async function handleAdd(batch: ParticipantFormValues[]) {
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

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>Agregar participante</Text>}
      centered
      size="md"
    >
      <Tabs value={tab} onChange={setTab}>
        <Tabs.List>
          <Tabs.Tab value="adventurer" leftSection={<IconUser size={14} />}>
            Aventurero
          </Tabs.Tab>
          <Tabs.Tab value="monster" leftSection={<IconSkull size={14} />}>
            Monstruo
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="adventurer" pt="md">
          <ParticipantForm type="adventurer" onSubmit={handleAdd} />
        </Tabs.Panel>
        <Tabs.Panel value="monster" pt="md">
          <ParticipantForm type="monster" onSubmit={handleAdd} />
        </Tabs.Panel>
      </Tabs>
    </Modal>
  )
}
