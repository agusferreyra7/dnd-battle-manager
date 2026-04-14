import { Character } from "../models/character";

let characters: Character[] = [];

let orden: Character[] = [];
let turnoActual = 0;

const buildState = () => ({
  orden,
  turnoActual,
  personajeActual: orden[turnoActual]
});

// --------------------
// CHARACTERS
// --------------------

export const addCharacter = (char: Character) => {
  characters.push(char);
  return char;
};

export const getCharacters = () => {
  return characters.sort((a, b) => b.initiative - a.initiative);
};

export const dealDamage = (id: string, damage: number) => {
  const character = characters.find(c => c.id === id);
  if (!character) return null;

  character.hp -= damage;

  if (character.hp <= 0) {
    character.hp = 0;
    character.isUnconscious = true;
  }

  return character;
};

export const healCharacter = (id: string, amount: number) => {
  const character = characters.find(c => c.id === id);
  if (!character) return null;

  character.hp += amount;

  if (character.hp > character.maxHp) {
    character.hp = character.maxHp;
  }

  if (character.hp > 0) {
    character.isUnconscious = false;
  }

  return character;
};

// --------------------
// BATTLE SYSTEM
// --------------------

// 🔥 START BATTLE
export const startBattle = (characters: Character[]) => {
  orden = [...characters].sort(
    (a, b) => b.initiative - a.initiative
  );

  turnoActual = 0;

  return buildState();
};

// 🔥 NEXT TURN (TU FUNCIÓN SÍ, PERO CORREGIDA)
export const nextTurn = () => {
  if (!orden || orden.length === 0) {
    throw new Error("Battle not started");
  }

  turnoActual = (turnoActual + 1) % orden.length;

  return buildState();
};

// 🔥 STATE ACTUAL
export const getState = () => {
  return buildState();
};

// --------------------
// INTERNAL HELPERS
// --------------------

