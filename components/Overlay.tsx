
import React from 'react';
import { GameStatus } from '../types';

interface OverlayProps {
  status: GameStatus;
  onStart: () => void;
}

const Overlay: React.FC<OverlayProps> = ({ status, onStart }) => {
  if (status === 'PLAYING') return null;

  let title = "Escape the Classroom";
  let subtitle = "A 2-player battle of wits! Can the student escape before the teacher catches them?";
  let buttonText = "Start Game";
  let bgColor = "bg-black/60";

  if (status === 'CAUGHT') {
    title = "TEACHER WINS!";
    subtitle = "The student was caught passing notes! Detention for you!";
    buttonText = "Rematch";
    bgColor = "bg-red-900/80";
  } else if (status === 'ESCAPED') {
    title = "STUDENT ESCAPED!";
    subtitle = "School's out! The student made it to freedom.";
    buttonText = "Rematch";
    bgColor = "bg-green-900/80";
  }

  return (
    <div className={`fixed inset-0 flex items-center justify-center ${bgColor} backdrop-blur-sm z-50 p-4 transition-all duration-500`}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center transform transition-transform animate-in fade-in zoom-in duration-300">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-600 mb-6">{subtitle}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-left">
            <p className="font-bold text-blue-700 mb-2">👤 Player 1: Student</p>
            <ul className="text-blue-600 text-xs space-y-1">
              <li>• <span className="font-mono bg-blue-100 px-1 rounded">Arrow Keys</span> to Move</li>
              <li>• <span className="font-mono bg-blue-100 px-1 rounded">Shift</span> to Sprint</li>
              <li>• Objective: Find the Exit</li>
            </ul>
          </div>
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-left">
            <p className="font-bold text-red-700 mb-2">🧑‍🏫 Player 2: Teacher</p>
            <ul className="text-red-600 text-xs space-y-1">
              <li>• <span className="font-mono bg-red-100 px-1 rounded">WASD</span> to Move</li>
              <li>• Objective: Catch the Student</li>
            </ul>
          </div>
        </div>

        <button
          onClick={onStart}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default Overlay;
