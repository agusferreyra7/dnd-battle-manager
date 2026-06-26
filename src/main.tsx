import React from 'react'
import ReactDOM from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { ModalsProvider } from '@mantine/modals'
import App from './App'

import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'

// ─── Theme — azul claro como color primario, rojo reservado para enemigos ─────

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  fontFamily: 'Inter, system-ui, sans-serif',
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Card:   { defaultProps: { radius: 'md', withBorder: true } },
    Badge:  { defaultProps: { radius: 'sm' } },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ModalsProvider>
        <Notifications position="top-right" limit={3} />
        <App />
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
)
