
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameStatus } from "@/types/game";
import { Slider } from "@/components/ui/slider";
import { formatMultiplier } from "@/utils/crash";

interface BettingPanelProps {
  gameStatus: GameStatus;
  userBalance: number;
  onPlaceBet: (amount: number, autoMultiplier: number | null) => void;
  onCashout: () => void;
  hasBet: boolean;
  currentMultiplier: number;
}

const BettingPanel: React.FC<BettingPanelProps> = ({
  gameStatus,
  userBalance,
  onPlaceBet,
  onCashout,
  hasBet,
  currentMultiplier
}) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const [autoMultiplier, setAutoMultiplier] = useState<number | null>(null);
  const [useAutoMultiplier, setUseAutoMultiplier] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Predefined bet amounts
  const presetAmounts = [50, 100, 250, 500, 1000];

  // Handle bet amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.floor(parseFloat(e.target.value) || 0);
    
    if (isNaN(value)) {
      setBetAmount(0);
    } else if (value > userBalance) {
      setBetAmount(userBalance);
    } else {
      setBetAmount(value);
    }
  };

  // Handle auto multiplier change
  const handleAutoMultiplierChange = (value: number[]) => {
    setAutoMultiplier(parseFloat(value[0].toFixed(2)));
  };

  // Place bet handler
  const handlePlaceBet = () => {
    setError("");
    
    if (betAmount <= 0) {
      setError("Bet amount must be greater than zero");
      return;
    }
    
    if (betAmount > userBalance) {
      setError("Insufficient balance");
      return;
    }
    
    onPlaceBet(betAmount, useAutoMultiplier ? autoMultiplier : null);
  };

  // Handle cashout
  const handleCashout = () => {
    onCashout();
  };

  return (
    <div className="game-card p-4 flex flex-col h-full">
      {/* Bet Controls */}
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold mb-2">Place Bet</h3>
        
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-muted-foreground">Balance: ${userBalance.toLocaleString()}</span>
          </div>
          
          <div className="flex gap-2 mb-3">
            <Input
              type="number"
              value={betAmount}
              onChange={handleAmountChange}
              className="bg-muted"
              placeholder="Bet amount"
              disabled={gameStatus !== GameStatus.WAITING || hasBet}
            />
          </div>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {presetAmounts.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="py-1 h-8"
                onClick={() => setBetAmount(amount)}
                disabled={gameStatus !== GameStatus.WAITING || hasBet}
              >
                {amount}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Auto Cashout Controls */}
        <div className="mb-4">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="auto-cashout"
              checked={useAutoMultiplier}
              onChange={(e) => setUseAutoMultiplier(e.target.checked)}
              className="mr-2 h-4 w-4"
              disabled={gameStatus !== GameStatus.WAITING || hasBet}
            />
            <label htmlFor="auto-cashout" className="text-sm">Auto Cash Out at {formatMultiplier(autoMultiplier || 2)}</label>
          </div>
          
          {useAutoMultiplier && (
            <div className="mb-3">
              <Slider
                defaultValue={[2]}
                min={1.1}
                max={10}
                step={0.1}
                value={[autoMultiplier || 2]}
                onValueChange={handleAutoMultiplierChange}
                disabled={gameStatus !== GameStatus.WAITING || hasBet}
              />
              <div className="flex justify-between text-xs mt-1 text-muted-foreground">
                <span>1.1x</span>
                <span>10x</span>
              </div>
            </div>
          )}
        </div>
        
        {error && <p className="text-xs text-destructive mb-2">{error}</p>}
        
        {/* Bet/Cashout Button */}
        {!hasBet ? (
          <Button 
            variant="default" 
            className="bg-green-500 hover:bg-green-600 text-white font-bold mb-2"
            onClick={handlePlaceBet}
            disabled={gameStatus !== GameStatus.WAITING}
          >
            Place Bet
          </Button>
        ) : (
          <Button 
            variant="default" 
            className={`${
              gameStatus === GameStatus.IN_PROGRESS 
                ? 'bg-crash-gold hover:bg-amber-400 animate-pulse-grow' 
                : 'bg-crash-accent hover:bg-crash-accent/80'
            } text-white font-bold mb-2`}
            onClick={handleCashout}
            disabled={gameStatus !== GameStatus.IN_PROGRESS}
          >
            {gameStatus === GameStatus.IN_PROGRESS 
              ? `Cash Out (${formatMultiplier(currentMultiplier)})` 
              : 'Waiting...'}
          </Button>
        )}
      </div>
    </div>
  );
};

export default BettingPanel;
