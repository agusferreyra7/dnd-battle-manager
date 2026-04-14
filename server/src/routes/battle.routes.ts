import { Router } from "express";
import * as controller from "../controllers/battle.controller";

const router = Router();

router.post("/characters", controller.createCharacter);
router.get("/characters", controller.getAllCharacters);
router.post("/characters/:id/damage", controller.damageCharacter);
router.post("/characters/:id/heal", controller.healCharacter);

export default router;