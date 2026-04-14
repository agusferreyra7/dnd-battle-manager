import { useEffect } from "react";
import { getCharacters, startBattle } from "../services/api";
import { useBattle } from "../context/BattleContext";

export default function Home() {
  const { characters, setCharacters, setBattle } = useBattle();

  console.log("CHARACTERS:", characters);

  useEffect(() => {
    getCharacters().then(setCharacters);
  }, [setCharacters]);

  const begin = async () => {
    // 🔥 PROTECCIÓN ANTI-400
    if (!characters || characters.length === 0) {
      console.log("No characters loaded yet");
      return;
    }

    try {
      const data = await startBattle(characters);

      console.log("BATTLE STARTED:", data);

      setBattle(data);
    } catch (err) {
      console.error("Error starting battle:", err);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Home</h1>

      {/* DEBUG INFO */}
      <p>Characters loaded: {characters?.length ?? 0}</p>

      {/* LISTA RÁPIDA (DEBUG VISUAL) */}
      <ul>
        {characters?.map((c: any) => (
          <li key={c.id}>
            {c.name} - HP: {c.hp}
          </li>
        ))}
      </ul>

      {/* BOTÓN SEGURO */}
      <button
        onClick={begin}
        disabled={!characters || characters.length === 0}
        style={{
          padding: "10px 15px",
          marginTop: 10,
          cursor: characters?.length ? "pointer" : "not-allowed"
        }}
      >
        Start Battle
      </button>
    </div>
  );
}