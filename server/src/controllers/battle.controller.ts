import { Request, Response } from "express";
import * as service from "../services/battle.service";
import { v4 as uuidv4 } from "uuid";

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

export const damageCharacter = (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { damage } = req.body;

  const updated = service.dealDamage(id, damage);

  if (!updated) return res.status(404).send("Character not found");

  res.json(updated);
};

export const healCharacter = (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;

  const updated = service.healCharacter(id, amount);

  if (!updated) return res.status(404).send("Character not found");

  res.json(updated);
};