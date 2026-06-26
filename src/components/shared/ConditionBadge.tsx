import { Badge, Tooltip } from '@mantine/core'
import type { Condition } from '@/types'

const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  blinded:        'No puede ver. Los ataques que recibe tienen ventaja y los que hace desventaja.',
  charmed:        'No puede atacar al que lo encantó. El encantador tiene ventaja en interacciones sociales.',
  deafened:       'No puede oír. Falla automáticamente chequeos que requieren oído.',
  exhaustion:     'Acumula penalizaciones según el nivel de agotamiento.',
  frightened:     'Desventaja en chequeos/tiradas mientras pueda ver la fuente del miedo.',
  grappled:       'Velocidad 0. Termina si quien agarra está incapacitado.',
  incapacitated:  'No puede realizar acciones ni reacciones.',
  invisible:      'No puede ser visto sin magia. Ataques que hace tienen ventaja.',
  paralyzed:      'Incapacitado. Falla salvaciones de FUE y DES. Ataques cuerpo a cuerpo son críticos.',
  petrified:      'Transformado en piedra sólida. Resistencia a todo daño.',
  poisoned:       'Desventaja en tiradas de ataque y chequeos de característica.',
  prone:          'Desventaja en ataques. Ataques cuerpo a cuerpo tienen ventaja contra él.',
  restrained:     'Velocidad 0. Desventaja en ataques. Ataques contra él tienen ventaja.',
  stunned:        'Incapacitado. Falla salvaciones de FUE y DES. Ataques tienen ventaja contra él.',
  unconscious:    'Incapacitado, no puede moverse ni hablar. Cae al suelo. Ataques CaC son críticos.',
}

interface ConditionBadgeProps {
  condition: Condition
  onRemove?: () => void
}

export default function ConditionBadge({ condition, onRemove }: ConditionBadgeProps) {
  return (
    <Tooltip
      label={CONDITION_DESCRIPTIONS[condition]}
      multiline
      w={260}
      position="top"
    >
      <Badge
        color="orange"
        variant="light"
        size="sm"
        style={{ cursor: onRemove ? 'pointer' : 'default', textTransform: 'capitalize' }}
        onClick={onRemove}
      >
        {condition}{onRemove ? ' ✕' : ''}
      </Badge>
    </Tooltip>
  )
}
