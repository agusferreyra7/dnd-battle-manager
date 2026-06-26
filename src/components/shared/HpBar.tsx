import { Progress, Box } from '@mantine/core'

interface HpBarProps {
  current: number
  max: number
  tempHp?: number
  size?: 'sm' | 'md' | 'lg'
}

function hpColor(pct: number): string {
  if (pct > 60) return 'green'
  if (pct > 30) return 'yellow'
  if (pct > 0) return 'red'
  return 'dark'
}

export default function HpBar({ current, max, tempHp = 0, size = 'sm' }: HpBarProps) {
  const pct    = max > 0 ? Math.round((current / max) * 100) : 0
  const tempPct = max > 0 ? Math.round((tempHp / max) * 100) : 0
  const barSize = size === 'sm' ? 8 : size === 'md' ? 12 : 16

  return (
    <Box pos="relative">
      <Progress.Root size={barSize} radius="sm">
        <Progress.Section value={pct} color={hpColor(pct)} />
        {tempHp > 0 && (
          <Progress.Section value={Math.min(tempPct, 100 - pct)} color="cyan" />
        )}
      </Progress.Root>
    </Box>
  )
}
