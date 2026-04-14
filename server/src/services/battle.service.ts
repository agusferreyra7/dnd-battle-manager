import { Character } from "../models/character";

let characters: Character[] = [];

// Crear personaje
export const addCharacter = (char: Character) => {
  characters.push(char);
  return char;
};

// Obtener todos
export const getCharacters = () => {
  return characters.sort((a, b) => b.initiative - a.initiative);
};

// Aplicar daño
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

// Curar
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