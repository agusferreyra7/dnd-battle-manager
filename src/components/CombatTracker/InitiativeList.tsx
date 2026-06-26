import { Stack } from '@mantine/core'
import type { ParticipantWithStatus } from '@/types'
import ParticipantCard from './ParticipantCard'

interface InitiativeListProps {
  participants: ParticipantWithStatus[]
}

export default function InitiativeList({ participants }: InitiativeListProps) {
  const alive = participants.filter((p) => p.isAlive)
  const dead  = participants.filter((p) => !p.isAlive)

  return (
    <Stack gap="sm">
      {alive.map((p) => (
        <ParticipantCard key={p.id} participant={p} />
      ))}
      {dead.length > 0 && dead.map((p) => (
        <ParticipantCard key={p.id} participant={p} isDead />
      ))}
    </Stack>
  )
}
