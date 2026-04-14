import { createContext, useContext, useState } from "react";
import type { Character } from "../types/Character";

type BattleState = {
  orden: Character[];
  turnoActual: number;
  personajeActual: Character;
};

type BattleContextType = {
  characters: Character[];
  setCharacters: (c: Character[]) => void;

  battle: BattleState | null;
  setBattle: (b: BattleState) => void;
};

const BattleContext = createContext<BattleContextType | null>(null);

export const BattleProvider = ({ children }: any) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [battle, setBattle] = useState<BattleState | null>(null);

  return (
    <BattleContext.Provider
      value={{ characters, setCharacters, battle, setBattle }}
    >
      {children}
    </BattleContext.Provider>
  );
};

export const useBattle = () => {
  const ctx = useContext(BattleContext);
  if (!ctx) throw new Error("useBattle must be used inside provider");
  return ctx;
};