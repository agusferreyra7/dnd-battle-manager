import { useState } from "react";
import { useBattle } from "../context/BattleContext";
import { nextTurn, damageCharacter, healCharacter } from "../services/api";

export default function Battle() {
  const { battle, setBattle } = useBattle();

  const [selected, setSelected] = useState<any>(null);
  const [amount, setAmount] = useState<number>(0);

  if (!battle || !battle.orden) {
    return <div style={{ padding: 20 }}>Cargando batalla...</div>;
  }

  const handleNextTurn = async () => {
    const data = await nextTurn();
    setBattle(data);
  };

  const handleDamage = async () => {
    if (!selected) return;
    try{
        const updated = await damageCharacter(selected.id, amount);

        setBattle({
        ...battle,
        orden: battle.orden.map((c: any) =>
            c.id === updated.id ? updated : c
        )
        });
    }catch (err) {
        alert((err as Error).message);
    }
};

  const handleHeal = async () => {
    if (!selected) return;
    try{
        const updated = await healCharacter(selected.id, amount);

        setBattle({
        ...battle,
        orden: battle.orden.map((c: any) =>
            c.id === updated.id ? updated : c
        )
        });
    }catch (err) {
    alert((err as Error).message);
    }
  };

  return (
    <div style={{
      padding: 20,
      fontFamily: "sans-serif",
      backgroundColor: "#111",
      minHeight: "100vh",
      color: "white"
    }}>
      {/* HEADER */}
      <h1>⚔️ Battle</h1>

      <h2 style={{ color: "#00ff99" }}>
        Turno de: {battle.personajeActual?.name}
      </h2>

      <button
        onClick={handleNextTurn}
        style={{
          padding: "10px 15px",
          marginBottom: 20,
          backgroundColor: "#444",
          color: "white",
          border: "1px solid #666",
          cursor: "pointer"
        }}
      >
        Next Turn
      </button>

      {/* PANEL DE ACCIONES */}
      {selected && (
        <div style={{
          marginBottom: 20,
          padding: 10,
          border: "1px solid #555",
          borderRadius: 8
        }}>
          <h3>🎯 Selected: {selected.name}</h3>

          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="amount"
            style={{ marginRight: 10 }}
          />

          <button onClick={handleDamage} style={{ marginRight: 10 }}>
            ➖ Damage
          </button>

          <button onClick={handleHeal}>
            ➕ Heal
          </button>
        </div>
      )}

      {/* CHARACTERS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 10
      }}>
        {battle.orden.map((p: any, index: number) => {
          const isTurn = index === battle.turnoActual;

          return (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              style={{
                padding: 15,
                borderRadius: 10,
                cursor: "pointer",
                border: isTurn ? "2px solid #00ff99" : "1px solid #333",
                backgroundColor: isTurn ? "#1a1a1a" : "#0d0d0d",
                boxShadow: isTurn ? "0 0 10px #00ff99" : "none"
              }}
            >
              <h3>{p.name}</h3>

              <p>❤️ HP: {p.hp}/{p.maxHp}</p>
              <p>🛡️ AC: {p.ac}</p>
              <p>⚡ INIT: {p.initiative}</p>

              {p.isUnconscious && (
                <p style={{ color: "red" }}>💀 Unconscious</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}