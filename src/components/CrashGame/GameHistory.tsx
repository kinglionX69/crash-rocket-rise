
import React from "react";
import { GameHistory as GameHistoryType } from "@/types/game";
import { formatMultiplier } from "@/utils/crash";

interface GameHistoryProps {
  history: GameHistoryType[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ history }) => {
  // Function to determine color based on crash point
  const getColorClass = (crashPoint: number): string => {
    if (crashPoint < 2) return "text-white";
    if (crashPoint < 10) return "text-crash-gold";
    return "text-crash-red";
  };

  return (
    <div className="game-card p-4 h-full">
      <h3 className="text-lg font-semibold mb-3">Game History</h3>
      
      <div className="flex flex-wrap gap-2">
        {history.map((game) => (
          <div 
            key={game.id}
            className="flex items-center justify-center w-16 h-10 rounded bg-muted/30 border border-muted hover:bg-muted/50 transition-colors"
          >
            <span className={`font-semibold ${getColorClass(game.crashPoint)}`}>
              {formatMultiplier(game.crashPoint)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;
