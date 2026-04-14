import Home from "./pages/Home";
import Battle from "./pages/Battle";
import { useBattle } from "./context/BattleContext";

export default function App() {
  const { battle } = useBattle();

  return (
    <div>
      <Home />
      {battle && <Battle />}
    </div>
  );
}