import { useEffect } from "react";
import { nextTurn, getBattleState } from "../../services/api";
import { useBattle } from "../../context/BattleContext";
import type { Character } from "../../types/Character";

type BattleState = {
  orden: Character[];
  turnoActual: number;
  personajeActual: Character;
};

export default function Battle() {
  const { battle, setBattle } = useBattle();

  const loadState = async () => {
    const data = await getBattleState();
    setBattle(data);
  };
  console.log("BATTLE:", battle);

  useEffect(() => {
    loadState();
  }, []);

  const handleNextTurn = async () => {
    const data = await nextTurn();
    setBattle(data);
  };

  if (!battle) return <div>Iniciando combate...</div>;

  return (
    <div>
      <h2>Turno de: {battle.personajeActual.name}</h2>

      <button onClick={handleNextTurn}>
        Siguiente turno
      </button>

      <div>
        {battle.orden.map((p, index) => {
          const isTurn = index === battle.turnoActual;

          return (
            <div
              key={p.id}
              style={{
                border: isTurn ? "3px solid red" : "1px solid gray",
                padding: "10px",
                margin: "5px"
              }}
            >
              {p.name} (Init: {p.initiative})
            </div>
          );
        })}
      </div>
    </div>
  );
}