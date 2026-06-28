import type { LimitedFeature } from '@/types'

// ─── SRD races (adventurers) ──────────────────────────────────────────────────

export const SRD_RACES = [
  'Dwarf (Hill)',
  'Dwarf (Mountain)',
  'Elf (High)',
  'Elf (Wood)',
  'Elf (Dark / Drow)',
  'Halfling (Lightfoot)',
  'Halfling (Stout)',
  'Human',
  'Dragonborn',
  'Gnome (Forest)',
  'Gnome (Rock)',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
] as const

export type SrdRace = typeof SRD_RACES[number]

// ─── NPC races — broader list including common monster folk ───────────────────

export const NPC_RACES = [
  ...SRD_RACES,
  'Goblin',
  'Hobgoblin',
  'Bugbear',
  'Orc',
  'Kobold',
  'Lizardfolk',
  'Kenku',
  'Tabaxi',
  'Triton',
  'Aasimar',
  'Firbolg',
  'Goliath',
  'Yuan-ti Pureblood',
  'Other',
] as const

export type NpcRace = typeof NPC_RACES[number]

// ─── Combat-relevant racial traits ───────────────────────────────────────────
// Each entry maps a race to the traits that matter in combat.
// Passive / always-on traits are encoded as uses:0 (displayed as "Pasiva").
// Limited-use traits follow the same LimitedFeature shape as class features.

export const RACIAL_COMBAT_TRAITS: Partial<Record<string, LimitedFeature[]>> = {
  // ── Dwarves ──────────────────────────────────────────────────────────────
  'Dwarf (Hill)': [
    { name: 'Resistencia Enana (veneno)', uses: 0, recharge: 'long' },
    { name: 'Dureza (HP extra por nivel)', uses: 0, recharge: 'long' },
  ],
  'Dwarf (Mountain)': [
    { name: 'Resistencia Enana (veneno)', uses: 0, recharge: 'long' },
    { name: 'Entrenamiento en Armas', uses: 0, recharge: 'long' },
    { name: 'Armadura Enana (+CA con armadura)', uses: 0, recharge: 'long' },
  ],

  // ── Elves ────────────────────────────────────────────────────────────────
  'Elf (High)': [
    { name: 'Trance (descanso largo 4h)', uses: 0, recharge: 'long' },
    { name: 'Sentidos Agudos (Percepción)', uses: 0, recharge: 'long' },
    { name: 'Linaje Feérico (Hechizo de Truco)', uses: 0, recharge: 'long' },
  ],
  'Elf (Wood)': [
    { name: 'Trance (descanso largo 4h)', uses: 0, recharge: 'long' },
    { name: 'Velocidad +5 ft.', uses: 0, recharge: 'long' },
    { name: 'Paso del Bosque (no dificulta terreno natural)', uses: 0, recharge: 'long' },
    { name: 'Máscara del Bosque (ocultarse)', uses: 0, recharge: 'long' },
  ],
  'Elf (Dark / Drow)': [
    { name: 'Visión Superior (120 ft.)', uses: 0, recharge: 'long' },
    { name: 'Sensibilidad a la Luz Solar', uses: 0, recharge: 'long' },
    { name: 'Magia Drow — Luces Danzantes', uses: 1, recharge: 'long' },
    { name: 'Magia Drow — Oscuridad', uses: 1, recharge: 'long' },
    { name: 'Magia Drow — Hechicería de Faerie', uses: 1, recharge: 'long' },
  ],

  // ── Halflings ─────────────────────────────────────────────────────────────
  'Halfling (Lightfoot)': [
    { name: 'Suerte (repetir 1 en d20)', uses: 0, recharge: 'long' },
    { name: 'Valiente (ventaja contra miedo)', uses: 0, recharge: 'long' },
    { name: 'Agilidad Mediana (ocultarse)', uses: 0, recharge: 'long' },
    { name: 'Sigilo Natural (Ocultarse tras criaturas)', uses: 0, recharge: 'long' },
  ],
  'Halfling (Stout)': [
    { name: 'Suerte (repetir 1 en d20)', uses: 0, recharge: 'long' },
    { name: 'Valiente (ventaja contra miedo)', uses: 0, recharge: 'long' },
    { name: 'Resistencia Robusta (veneno)', uses: 0, recharge: 'long' },
  ],

  // ── Human ─────────────────────────────────────────────────────────────────
  'Human': [
    { name: '+1 a todos los atributos', uses: 0, recharge: 'long' },
  ],

  // ── Dragonborn ────────────────────────────────────────────────────────────
  'Dragonborn': [
    { name: 'Arma de Aliento (2d6, tirada salvación)', uses: 1, recharge: 'short' },
    { name: 'Resistencia Dracónica (tipo según linaje)', uses: 0, recharge: 'long' },
  ],

  // ── Gnomes ───────────────────────────────────────────────────────────────
  'Gnome (Forest)': [
    { name: 'Ilusión Natural (Prestidigitación menor)', uses: 0, recharge: 'long' },
    { name: 'Comunicar con Bestias Pequeñas', uses: 0, recharge: 'long' },
    { name: 'Astucia Gnómica (ventaja INT/SAB/CAR vs magia)', uses: 0, recharge: 'long' },
  ],
  'Gnome (Rock)': [
    { name: 'Conocimiento Artificioso (+doble Prof. con herramientas)', uses: 0, recharge: 'long' },
    { name: 'Tinker (crear gadgets pequeños)', uses: 0, recharge: 'long' },
    { name: 'Astucia Gnómica (ventaja INT/SAB/CAR vs magia)', uses: 0, recharge: 'long' },
  ],

  // ── Half-Elf ─────────────────────────────────────────────────────────────
  'Half-Elf': [
    { name: 'Visión en Penumbra 60 ft.', uses: 0, recharge: 'long' },
    { name: 'Resistencia Feérica (ventaja contra hechizo)', uses: 0, recharge: 'long' },
    { name: 'Versátil (2 habilidades a elección)', uses: 0, recharge: 'long' },
  ],

  // ── Half-Orc ─────────────────────────────────────────────────────────────
  'Half-Orc': [
    { name: 'Resistencia Implacable (caer a 1 HP en lugar de 0)', uses: 1, recharge: 'long' },
    { name: 'Ataques Salvajes (daño extra en golpe crítico)', uses: 0, recharge: 'long' },
    { name: 'Amenazador (Intimidación)', uses: 0, recharge: 'long' },
  ],

  // ── Tiefling ─────────────────────────────────────────────────────────────
  'Tiefling': [
    { name: 'Resistencia Infernal (fuego)', uses: 0, recharge: 'long' },
    { name: 'Legado Infernal — Taumaturgia', uses: 0, recharge: 'long' },
    { name: 'Legado Infernal — Represalia Infernal', uses: 1, recharge: 'long' },
    { name: 'Legado Infernal — Oscuridad', uses: 1, recharge: 'long' },
  ],

  // ── NPC/Monster races ────────────────────────────────────────────────────
  'Goblin': [
    { name: 'Escabullirse (Desengancharse como acción bonus)', uses: 0, recharge: 'long' },
    { name: 'Furia Cobarde (ataque con ventaja contra objetivo rodeado)', uses: 0, recharge: 'long' },
  ],
  'Hobgoblin': [
    { name: 'Formación Marcial (ventaja en ataque si aliado adyacente)', uses: 0, recharge: 'long' },
    { name: 'Salva Marcial (reacción ante fallar tiro salvación)', uses: 1, recharge: 'long' },
  ],
  'Bugbear': [
    { name: 'Sorpresa (daño extra en primer turno de combate)', uses: 0, recharge: 'long' },
    { name: 'Alcance Bruto (+5 ft. de alcance en melé)', uses: 0, recharge: 'long' },
  ],
  'Orc': [
    { name: 'Agresivo (moverse hasta un enemigo como acción bonus)', uses: 0, recharge: 'long' },
    { name: 'Poderosa Construcción (cuenta como Grande para cargar)', uses: 0, recharge: 'long' },
  ],
  'Kobold': [
    { name: 'Ventaja en Manada (ataque con ventaja si aliado adyacente)', uses: 0, recharge: 'long' },
    { name: 'Sensibilidad a la Luz Solar', uses: 0, recharge: 'long' },
  ],
  'Aasimar': [
    { name: 'Resistencia Celestial (necrótico y radiante)', uses: 0, recharge: 'long' },
    { name: 'Curación Radiante', uses: 0, recharge: 'long' },
    { name: 'Revelación Celestial (alas/daño extra)', uses: 1, recharge: 'long' },
  ],
  'Goliath': [
    { name: 'Resistencia Pétrea (reducir daño 1/combate)', uses: 1, recharge: 'short' },
    { name: 'Atlético de las Montañas (+ventaja en atletismo)', uses: 0, recharge: 'long' },
    { name: 'Poderosa Constitución (cuenta como Grande)', uses: 0, recharge: 'long' },
  ],
  'Yuan-ti Pureblood': [
    { name: 'Inmunidad a Veneno', uses: 0, recharge: 'long' },
    { name: 'Magia Serpiente — Sugestión', uses: 1, recharge: 'long' },
    { name: 'Magia Serpiente — Amigos', uses: 0, recharge: 'long' },
  ],
}

/** Returns only the traits that are combat-relevant (have uses > 0 OR are passive resistances/immunities) */
export function getRacialCombatTraits(race: string): LimitedFeature[] {
  return RACIAL_COMBAT_TRAITS[race] ?? []
}
