import { Router } from "express";
import {
  createCharacter,
  getAllCharacters,
  damageCharacter,
  healCharacter
} from "../controllers/battle.controller";

const router = Router();

// mock inicial (después cambiar por DB)
const characters = [
  {
    id: "1",
    name: "Warrior",
    hp: 30,
    maxHp: 30,
    ac: 16,
    initiative: 15,
    isUnconscious: false
  },
  {
    id: "2",
    name: "Mage",
    hp: 18,
    maxHp: 18,
    ac: 12,
    initiative: 12,
    isUnconscious: false
  },
  {
    id: "3",
    name: "Rogue",
    hp: 22,
    maxHp: 22,
    ac: 14,
    initiative: 18,
    isUnconscious: false
  }
];

router.post("/", createCharacter);
router.get("/", getAllCharacters);

router.post("/:id/damage", damageCharacter);
router.post("/:id/heal", healCharacter);

export default router;