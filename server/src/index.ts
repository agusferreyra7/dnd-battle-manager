import express from "express";
import cors from "cors";
import battleRoutes from "./routes/battle.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", battleRoutes);

app.get("/", (req, res) => {
  res.send("API D&D funcionando");
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});