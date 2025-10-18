import { useState } from "react";
import "./App.css";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "./TokenSelector";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-wrap items-center gap-2 md:flex-row">
      <Button onClick={() => setCount((count) => count + 1)}>
        {" "}
        count is {count}
      </Button>
      <TokenSelector />
    </div>
  );
}

export default App;
