import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import {
  AppShell, Group, Text, useMantineColorScheme, ActionIcon, Tabs
} from '@mantine/core'
import { IconSword, IconMoon, IconSun, IconUsers, IconShieldHalf } from '@tabler/icons-react'

import HomePage from '@/pages/HomePage'
import NewCombatPage from '@/pages/NewCombatPage'
import CombatPage from '@/pages/CombatPage'
import CharactersPage from '@/pages/CharactersPage'

// ─── Header with nav tabs ─────────────────────────────────────────────────────

function AppHeader() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const location = useLocation()
  const navigate = useNavigate()

  // Only show tabs on top-level pages (not inside a combat)
  const showTabs = !location.pathname.startsWith('/combat/')

  // Map pathname to tab value
  const tabValue = location.pathname === '/characters' ? 'characters' : 'combats'

  return (
    <AppShell.Header>
      <Group h="100%" px="md" justify="space-between" wrap="nowrap">
        <Group gap="xs">
          <IconSword size={22} color="var(--mantine-color-blue-5)" />
          <Text fw={700} size="md" style={{ letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
            Combat Tracker
          </Text>
        </Group>

        {showTabs && (
          <Tabs
            value={tabValue}
            onChange={v => navigate(v === 'characters' ? '/characters' : '/')}
            style={{ flex: 1, maxWidth: 360 }}
          >
            <Tabs.List justify="center">
              <Tabs.Tab value="combats" leftSection={<IconShieldHalf size={15} />}>
                Combates
              </Tabs.Tab>
              <Tabs.Tab value="characters" leftSection={<IconUsers size={15} />}>
                Personajes
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>
        )}

        <ActionIcon variant="subtle" onClick={() => toggleColorScheme()} aria-label="Cambiar tema">
          {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>
      </Group>
    </AppShell.Header>
  )
}

// ─── App shell ────────────────────────────────────────────────────────────────

function AppLayout() {
  return (
    <AppShell header={{ height: 56 }} padding="md">
      <AppHeader />
      <AppShell.Main>
        <Routes>
          <Route path="/"            element={<HomePage />} />
          <Route path="/characters"  element={<CharactersPage />} />
          <Route path="/combat/new"  element={<NewCombatPage />} />
          <Route path="/combat/:id"  element={<CombatPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
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
