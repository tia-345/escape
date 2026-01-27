import React, { useState } from "react";
import Game from "./components/Game";
import Overlay from "./components/Overlay";
import { GameStatus } from "./types";

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>("START");

  const handleStart = () => {
    setStatus("PLAYING");
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#020617", // slate-950 fallback
        position: "relative",
        overflow: "hidden",
        color: "white",
      }}
    >
      {/* Fallback title (always visible) */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          fontSize: "20px",
          fontWeight: "bold",
          opacity: 0.8,
          zIndex: 50,
        }}
      >
        ESCAPE GAME
      </div>

      {/* Game UI */}
      <Overlay status={status} onStart={handleStart} />
      <Game status={status} setStatus={setStatus} />

      {/* Decorative text */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          fontSize: "64px",
          fontWeight: 900,
          opacity: 0.08,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        ESCAPE
      </div>
    </div>
  );
};

export default App;
