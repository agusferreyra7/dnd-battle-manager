import { Stack, Group, Text, Badge, Box } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'
import type { LimitedFeature } from '@/types'

interface LimitedFeaturesDisplayProps {
  features: LimitedFeature[]
}

export default function LimitedFeaturesDisplay({ features }: LimitedFeaturesDisplayProps) {
  if (features.length === 0) return null

  return (
    <Stack gap="xs">
      <Text size="sm" fw={600}>Habilidades con usos limitados</Text>
      <Stack gap="xs">
        {features.map((f, i) => (
          <Box
            key={i}
            style={{
              background: 'var(--mantine-color-dark-6)',
              border: '1px solid var(--mantine-color-dark-4)',
              borderRadius: 'var(--mantine-radius-sm)',
              padding: '7px 12px',
            }}
          >
            <Group justify="space-between" wrap="nowrap">
              <Text size="sm" fw={500}>{f.name}</Text>
              <Group gap="xs">
                <Badge
                  size="sm"
                  color={f.recharge === 'short' ? 'blue' : 'indigo'}
                  variant="light"
                  leftSection={f.recharge === 'short'
                    ? <IconSun size={10} />
                    : <IconMoon size={10} />
                  }
                >
                  {f.recharge === 'short' ? 'Desc. corto' : 'Desc. largo'}
                </Badge>
                {f.uses > 0 && (
                  <Badge size="sm" color="gray" variant="outline">
                    {f.uses} uso{f.uses !== 1 ? 's' : ''}
                  </Badge>
                )}
                {f.uses === 0 && (
                  <Badge size="sm" color="gray" variant="outline">∞</Badge>
                )}
              </Group>
            </Group>
          </Box>
        ))}
      </Stack>
    </Stack>
  )
}
