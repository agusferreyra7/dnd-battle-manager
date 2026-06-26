# D&D Combat Tracker

PWA para gestionar combates de Dungeons & Dragons 5e.

## Tech stack

- React 18 + TypeScript 5
- Mantine UI v7
- Dexie.js (IndexedDB)
- Zustand (UI state)
- React Router v6
- Vite + vite-plugin-pwa

## Estructura

```
src/
├── components/
│   ├── CombatSetup/     # Formularios de configuración
│   ├── CombatTracker/   # Vista de combate activo
│   └── shared/          # HpBar, ConditionBadge
├── db/
│   ├── schema.ts        # Dexie DB schema
│   └── queries.ts       # Helpers de lectura/escritura
├── store/
│   └── combatStore.ts   # Zustand (estado de UI)
├── hooks/
│   ├── useCombat.ts     # Queries reactivas vía useLiveQuery
│   └── useInitiativeOrder.ts
├── pages/
│   ├── HomePage.tsx
│   ├── NewCombatPage.tsx
│   └── CombatPage.tsx
└── types/
    └── index.ts
```

## Desarrollo

```bash
npm install
npm run dev
```

## Build PWA

```bash
npm run build
npm run preview
```
