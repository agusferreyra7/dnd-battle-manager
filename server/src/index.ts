import express from "express";
import cors from "cors";

import battleRoutes from "./routes/battle.routes";
import characterRoutes from "./routes/character.routes";

import { addCharacter } from "./services/battle.service";

addCharacter({
  id: "1",
  name: "Warrior",
  hp: 30,
  maxHp: 30,
  ac: 16,
  initiative: 12,
  isUnconscious: false
});

addCharacter({
  id: "2",
  name: "Mage",
  hp: 18,
  maxHp: 18,
  ac: 12,
  initiative: 18,
  isUnconscious: false
});

addCharacter({
  id: "3",
  name: "Rogue",
  hp: 22,
  maxHp: 22,
  ac: 14,
  initiative: 15,
  isUnconscious: false
});

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/characters", characterRoutes);
app.use("/api/battle", battleRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});