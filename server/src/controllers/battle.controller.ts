import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import * as service from "../services/battle.service";

// ---------------- CHARACTERS ----------------

export const createCharacter = (req: Request, res: Response) => {
  const { name, hp, ac, initiative } = req.body;

  const newCharacter = {
    id: uuidv4(),
    name,
    hp,
    maxHp: hp,
    ac,
    initiative,
    isUnconscious: false
  };

  const created = service.addCharacter(newCharacter);
  res.json(created);
};

export const getAllCharacters = (req: Request, res: Response) => {
  res.json(service.getCharacters());
};

export const damageCharacter = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;
  const { damage } = req.body;

  const updated = service.dealDamage(id, damage);

  if (!updated) return res.status(404).json({ error: "Character not found" });

  res.json(updated);
};

export const healCharacter = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
  ? req.params.id[0]
  : req.params.id;
  const { amount } = req.body;

  const updated = service.healCharacter(id, amount);

  if (!updated) return res.status(404).json({ error: "Character not found" });

  res.json(updated);
};

// ---------------- BATTLE ----------------

export const startBattle = (req: Request, res: Response) => {
  console.log("BODY START:", req.body);

  const { characters } = req.body;

  if (!characters || characters.length === 0) {
    return res.status(400).json({ error: "No characters provided" });
  }

  const result = service.startBattle(characters);

  res.json(result);
};

export const nextTurn = (req: Request, res: Response) => {
  try {
    const state = service.nextTurn();
    res.json(state);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getBattleState = (req: Request, res: Response) => {
  res.json(service.getState());
};