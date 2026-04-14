import type { Character } from "../types/Character";

const API_URL = "http://localhost:3000/api";

export const getCharacters = () =>
  fetch(`${API_URL}/characters`).then(res => res.json());

export const startBattle = async (characters: Character[]) => {
  const res = await fetch("http://localhost:3000/api/battle/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ characters })
  });

  if (!res.ok) throw new Error("Failed start battle");

  return res.json();
};

export const nextTurn = async () => {
  const res = await fetch("http://localhost:3000/api/battle/next", {
    method: "POST"
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: "Server error"
    }));
    throw new Error(err.error);
  }

  return res.json();
};

export const getBattleState = () =>
  fetch(`${API_URL}/battle/state`).then(res => res.json());

export const damageCharacter = (id: string, damage: number) =>
  fetch(`${API_URL}/characters/${id}/damage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ damage })
  }).then(res => res.json());

export const healCharacter = async (id: string, amount: number) => {
  const res = await fetch(`http://localhost:3000/api/characters/${id}/heal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount })
  });

  // protección contra errores HTTP
  if (!res.ok) {
    const err = await res.json().catch(() => ({
      error: "Unknown error"
    }));
    throw new Error(err.error);
  }

  return res.json();
};