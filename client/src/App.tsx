import { useState } from 'react'
import './App.css'

function App() {
  const [hp, setHp] = useState(20);

  return (
    <div>
      <h1>D&D Battle Manager ⚔️</h1>

      <p>HP: {hp}</p>

      <button onClick={() => setHp(hp - 1)}>Recibir daño</button>
      <button onClick={() => setHp(hp + 1)}>Curar</button>
    </div>
  );
}

export default App;