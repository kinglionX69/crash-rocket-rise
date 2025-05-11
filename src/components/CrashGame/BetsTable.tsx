
import React from "react";
import { Bet } from "@/types/game";
import { formatMultiplier } from "@/utils/crash";

interface BetsTableProps {
  bets: Bet[];
}

const BetsTable: React.FC<BetsTableProps> = ({ bets }) => {
  return (
    <div className="game-card p-4 h-full overflow-hidden flex flex-col">
      <h3 className="text-lg font-semibold mb-3">Player Bets</h3>
      
      <div className="flex text-xs text-muted-foreground border-b border-muted pb-2 mb-2">
        <div className="w-1/3 font-medium">Player</div>
        <div className="w-1/4 text-center font-medium">Bet</div>
        <div className="w-1/4 text-center font-medium">Multiplier</div>
        <div className="w-1/4 text-right font-medium">Profit</div>
      </div>
      
      <div className="overflow-y-auto flex-grow">
        {bets.length > 0 ? (
          bets.map((bet, index) => (
            <div key={index} className="flex py-2 text-sm border-b border-muted/30">
              <div className="w-1/3 truncate">{bet.username}</div>
              <div className="w-1/4 text-center">${bet.amount}</div>
              <div className={`w-1/4 text-center ${bet.cashoutMultiplier ? 'text-crash-green' : 'text-muted-foreground'}`}>
                {bet.cashoutMultiplier ? formatMultiplier(bet.cashoutMultiplier) : '-'}
              </div>
              <div className={`w-1/4 text-right ${bet.profit ? 'text-crash-green' : bet.profit === 0 ? 'text-white' : 'text-crash-red'}`}>
                {bet.profit !== null ? (bet.profit >= 0 ? '+' : '') + '$' + bet.profit : '-'}
              </div>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-muted-foreground">No bets placed yet</div>
        )}
      </div>
    </div>
  );
};

export default BetsTable;
