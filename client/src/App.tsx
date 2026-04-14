import { useEffect, useState } from "react";

function App() {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);
  const [amount, setAmount] = useState<number | "">("");

  const refreshCharacters = () => {
    fetch("http://localhost:3000/api/characters")
      .then(res => res.json())
      .then(data => setCharacters(data));
  };

  const dealDamage = async () => {
    if (amount === "") return;
    await fetch(`http://localhost:3000/api/characters/${selectedCharacter.id}/damage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ damage: amount })
    });

    refreshCharacters();
    setSelectedCharacter(null);
    setAmount("");
  };

  const healCharacter = async () => {
    if (amount === "") return;
    await fetch(`http://localhost:3000/api/characters/${selectedCharacter.id}/heal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    refreshCharacters();
    setSelectedCharacter(null);
    setAmount("");
  };

  useEffect(() => {
    refreshCharacters();
  }, []);

  // 👇 TODO LO VISUAL VA ACÁ
  return (
    <div>
      <h1>D&D Battle Manager ⚔️</h1>

      {/* LISTA CLICKABLE */}
      {characters.map((c: any) => (
        <div
          key={c.id}
          onClick={() => {
            setSelectedCharacter(c);
            setAmount("");
          }}
          style={{
            border: "1px solid white",
            margin: "10px",
            padding: "10px",
            cursor: "pointer"
          }}
        >
          <div>
            <strong>{c.name}</strong>
            <div>HP: {c.hp}</div>
            <div>AC: {c.ac}</div>
          </div>
        </div>
      ))}

      {/* MODAL */}
      {selectedCharacter && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{
            background: "black",
            padding: "20px",
            borderRadius: "10px"
          }}>
            <h2>{selectedCharacter.name}</h2>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && amount !== "") {
                  dealDamage();
                }
              }}
            />

            <div style={{ marginTop: "10px" }}>
              <button onClick={dealDamage}>➖</button>
              <button onClick={healCharacter}>➕</button>
            </div>

            <button onClick={() => setSelectedCharacter(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;