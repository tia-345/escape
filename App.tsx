
import React, { useState } from 'react';
import Game from './components/Game';
import Overlay from './components/Overlay';
import { GameStatus } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>('START');

  const handleStart = () => {
    setStatus('PLAYING');
  };

  return (
    <div className="w-full h-screen relative bg-slate-900 overflow-hidden">
      <Overlay status={status} onStart={handleStart} />
      <Game status={status} setStatus={setStatus} />
      
      {/* Decorative classroom elements outside the canvas container for better atmosphere */}
      <div className="absolute bottom-4 right-4 text-white/10 select-none pointer-events-none text-6xl font-black uppercase">
        Escape
      </div>
    </div>
  );
};

export default App;
