import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell, Group, Text, useMantineColorScheme, ActionIcon } from '@mantine/core'
import { IconSword, IconMoon, IconSun } from '@tabler/icons-react'

import HomePage from '@/pages/HomePage'
import NewCombatPage from '@/pages/NewCombatPage'
import CombatPage from '@/pages/CombatPage'

// ─── App shell with top nav ───────────────────────────────────────────────────

function AppLayout() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()

  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconSword size={24} color="var(--mantine-color-blue-5)" />
            <Text fw={700} size="lg" style={{ letterSpacing: '-0.01em' }}>
              Combat Tracker
            </Text>
          </Group>
          <ActionIcon
            variant="subtle"
            onClick={() => toggleColorScheme()}
            aria-label="Cambiar tema"
          >
            {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/combat/new" element={<NewCombatPage />} />
          <Route path="/combat/:id" element={<CombatPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
