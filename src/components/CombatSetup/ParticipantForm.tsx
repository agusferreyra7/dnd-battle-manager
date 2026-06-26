import { useState } from 'react'
import {
  TextInput, NumberInput, Group, Button, Stack, Text,
  Divider, Switch, Alert, Badge, ActionIcon, Tooltip
} from '@mantine/core'
import { IconPlus, IconDice, IconDatabase, IconX } from '@tabler/icons-react'
import { rollInitiative } from '@/db/queries'
import type { ParticipantFormValues, ParticipantType } from '@/types'
import MonsterSearch from './MonsterSearch'

// ─── Default values ───────────────────────────────────────────────────────────

function defaultValues(type: ParticipantType): ParticipantFormValues {
  return {
    name: '',
    type,
    maxHp: type === 'adventurer' ? 20 : 15,
    armorClass: type === 'adventurer' ? 14 : 12,
    initiativeBonus: 0,
    initiative: null,
    notes: '',
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ParticipantFormProps {
  type: ParticipantType
  onSubmit: (values: ParticipantFormValues[]) => void
}

export default function ParticipantForm({ type, onSubmit }: ParticipantFormProps) {
  const [values, setValues]                 = useState<ParticipantFormValues>(() => defaultValues(type))
  const [nameError, setNameError]           = useState('')
  const [quantity, setQuantity]             = useState(1)
  const [individualInit, setIndividualInit] = useState(true)
  // Whether the current form values were filled from the API
  const [fromApi, setFromApi]               = useState(false)

  const isMonster = type === 'monster'
  const multiMode = isMonster && quantity > 1

  function set<K extends keyof ParticipantFormValues>(key: K, value: ParticipantFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  // Called when user picks a monster from the search dropdown
  function handleApiAutoFill(partial: Partial<ParticipantFormValues> & { notes: string }) {
    setValues((prev) => ({ ...prev, ...partial }))
    setFromApi(true)
    setNameError('')
  }

  function handleClearApiData() {
    setValues(defaultValues(type))
    setFromApi(false)
    setNameError('')
  }

  function handleRollInitiative() {
    const rolled = rollInitiative(values.initiativeBonus)
    set('initiative', rolled)
  }

  function handleSubmit() {
    if (!values.name.trim()) {
      setNameError('El nombre es requerido')
      return
    }
    setNameError('')

    const count = isMonster ? Math.max(1, quantity) : 1

    if (count === 1) {
      onSubmit([{ ...values }])
    } else if (individualInit) {
      const batch: ParticipantFormValues[] = Array.from({ length: count }, (_, i) => ({
        ...values,
        name: `${values.name.trim()} #${i + 1}`,
        initiative: rollInitiative(values.initiativeBonus),
      }))
      onSubmit(batch)
    } else {
      const sharedInit = values.initiative ?? rollInitiative(values.initiativeBonus)
      const batch: ParticipantFormValues[] = Array.from({ length: count }, (_, i) => ({
        ...values,
        name: `${values.name.trim()} #${i + 1}`,
        initiative: sharedInit,
      }))
      onSubmit(batch)
    }

    setValues(defaultValues(type))
    setQuantity(1)
    setIndividualInit(true)
    setFromApi(false)
  }

  const addLabel = isMonster
    ? quantity > 1 ? `Agregar ${quantity} monstruos` : 'Agregar monstruo'
    : 'Agregar aventurero'

  // Initiative display: show result + roll breakdown if rolled
  const initDisplay = values.initiative !== null
    ? `${values.initiative} (1d20 ${values.initiativeBonus >= 0 ? '+' : ''}${values.initiativeBonus})`
    : ''

  return (
    <Stack gap="sm">

      {/* ── Open5e search (monsters only) ── */}
      {isMonster && (
        <>
          <MonsterSearch onFill={handleApiAutoFill} />

          {fromApi && (
            <Alert
              color="blue"
              variant="light"
              p="xs"
              icon={<IconDatabase size={14} />}
            >
              <Group justify="space-between" wrap="nowrap">
                <Text size="xs">
                  Datos cargados desde Open5e SRD. Podés modificar cualquier campo.
                </Text>
                <Tooltip label="Limpiar y empezar de cero">
                  <ActionIcon
                    size="xs"
                    variant="subtle"
                    color="gray"
                    onClick={handleClearApiData}
                  >
                    <IconX size={12} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            </Alert>
          )}

          <Divider label={<Text size="xs" c="dimmed">Estadísticas</Text>} labelPosition="left" />
        </>
      )}

      {/* ── Nombre ── */}
      <TextInput
        label="Nombre"
        placeholder={isMonster ? 'Ej: Goblin explorador' : 'Ej: Thorin Escudoderoble'}
        value={values.name}
        onChange={(e) => { set('name', e.currentTarget.value); setNameError('') }}
        error={nameError}
        required
        rightSection={
          fromApi ? (
            <Badge color="blue" variant="dot" size="xs" style={{ pointerEvents: 'none' }}>
              SRD
            </Badge>
          ) : null
        }
      />

      {/* ── HP y CA ── */}
      <Group grow>
        <NumberInput
          label="HP máximo"
          min={1}
          max={9999}
          value={values.maxHp}
          onChange={(v) => set('maxHp', Number(v))}
          required
        />
        <NumberInput
          label="Clase de armadura"
          min={1}
          max={30}
          value={values.armorClass}
          onChange={(v) => set('armorClass', Number(v))}
          required
        />
      </Group>

      {/* ── Iniciativa ── */}
      <Stack gap={4}>
        <Text size="sm" fw={500}>Iniciativa</Text>
        <Group grow align="flex-end">
          <NumberInput
            label="Bono (mod. DES)"
            description={
              fromApi
                ? `Mod. DES del SRD: ${values.initiativeBonus >= 0 ? '+' : ''}${values.initiativeBonus}`
                : 'Modificador de Destreza'
            }
            min={-10}
            max={10}
            value={values.initiativeBonus}
            onChange={(v) => {
              set('initiativeBonus', Number(v))
              // Reset the rolled value when bonus changes so it's re-rolled
              set('initiative', null)
            }}
          />

          <Stack gap={4}>
            <Text size="xs" fw={500} c="dimmed">
              Resultado (1d20 + bono)
            </Text>
            <Group gap="xs">
              <NumberInput
                min={-9}
                max={40}
                value={values.initiative ?? ''}
                placeholder="Sin tirar"
                description={
                  values.initiative !== null && !multiMode
                    ? initDisplay
                    : undefined
                }
                onChange={(v) => set('initiative', v === '' ? null : Number(v))}
                style={{ flex: 1 }}
                disabled={multiMode && individualInit}
              />
              <Button
                variant="light"
                color="orange"
                leftSection={<IconDice size={14} />}
                onClick={handleRollInitiative}
                title={`Tirar 1d20 ${values.initiativeBonus >= 0 ? '+' : ''}${values.initiativeBonus}`}
                disabled={multiMode && individualInit}
              >
                Tirar
              </Button>
            </Group>
          </Stack>
        </Group>
      </Stack>

      {/* ── Notas (precargadas del SRD si vienen de la API) ── */}
      {isMonster && fromApi && values.notes && (
        <Stack gap={2}>
          <Text size="xs" fw={500} c="dimmed">Info del SRD</Text>
          <Text
            size="xs"
            c="dimmed"
            style={{
              whiteSpace: 'pre-line',
              background: 'var(--mantine-color-dark-6)',
              padding: '6px 10px',
              borderRadius: 'var(--mantine-radius-sm)',
              border: '1px solid var(--mantine-color-dark-4)',
            }}
          >
            {values.notes}
          </Text>
        </Stack>
      )}

      {/* ── Cantidad (monsters only) ── */}
      {isMonster && (
        <>
          <Divider
            label={<Text size="xs" c="dimmed">Cantidad a agregar</Text>}
            labelPosition="left"
            mt="xs"
          />
          <Group align="flex-end" gap="md">
            <NumberInput
              label="Cantidad de monstruos"
              min={1}
              max={20}
              value={quantity}
              onChange={(v) => setQuantity(Math.max(1, Number(v)))}
              style={{ maxWidth: 180 }}
            />
            {quantity > 1 && (
              <Stack gap={4} pb={2}>
                <Text size="xs" fw={500}>Tipo de iniciativa</Text>
                <Switch
                  label={individualInit ? 'Individual (cada uno tira)' : 'Grupal (una tirada)'}
                  checked={individualInit}
                  onChange={(e) => setIndividualInit(e.currentTarget.checked)}
                  color="blue"
                />
              </Stack>
            )}
          </Group>
          {quantity > 1 && (
            <Text size="xs" c="dimmed">
              {individualInit
                ? `Cada uno de los ${quantity} monstruos tirará su propia iniciativa al agregar.`
                : `Los ${quantity} monstruos compartirán la misma iniciativa${values.initiative !== null ? ` (${values.initiative})` : ' (se tirará al agregar)'}.`}
            </Text>
          )}
        </>
      )}

      {/* ── Submit ── */}
      <Button
        leftSection={<IconPlus size={16} />}
        onClick={handleSubmit}
        variant="light"
        color={isMonster ? 'red' : 'blue'}
        fullWidth
        mt="xs"
      >
        {addLabel}
      </Button>
    </Stack>
  )
}
