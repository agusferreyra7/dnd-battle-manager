import { Router } from "express";
import {
  startBattle,
  nextTurn,
  getBattleState,
  createCharacter,
  getAllCharacters,
  damageCharacter,
  healCharacter
} from "../controllers/battle.controller";

const router = Router();

// 🧍 CHARACTERS
router.post("/characters", createCharacter);
router.get("/characters", getAllCharacters);
router.post("/characters/:id/damage", damageCharacter);
router.post("/characters/:id/heal", healCharacter);

// ⚔️ BATTLE
router.post("/start", startBattle);
router.post("/next", nextTurn);
router.get("/state", getBattleState);

export default router;