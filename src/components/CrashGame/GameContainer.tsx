
import React, { useState, useEffect, useCallback, useRef } from "react";
import CrashGraph from "./CrashGraph";
import BettingPanel from "./BettingPanel";
import GameHistory from "./GameHistory";
import BetsTable from "./BetsTable";
import ChatPanel from "./ChatPanel";
import {
  GameStatus,
  Game,
  Bet,
  User,
  ChatMessage,
  GameHistory as GameHistoryType
} from "@/types/game";
import {
  TICK_RATE,
  START_TIME,
  generateCrashPoint,
  calculateMultiplier,
  generateMockBets,
  generateMockChat,
  generateMockGameHistory,
  generateUsername,
  generateAvatar
} from "@/utils/crash";
import { toast } from "@/hooks/use-toast";

const GameContainer: React.FC = () => {
  // Game state
  const [game, setGame] = useState<Game>({
    id: "game-" + Date.now(),
    multiplier: 1.0,
    crashPoint: 0,
    status: GameStatus.WAITING,
    startTime: Date.now() + START_TIME * 1000,
    endTime: null,
    bets: []
  });
  
  // User state
  const [user, setUser] = useState<User>({
    id: "user-" + Math.random().toString(36).substring(2, 9),
    username: generateUsername(),
    balance: 10000,
    avatar: ""
  });
  
  // Set avatar once username is generated
  useEffect(() => {
    if (user.username && !user.avatar) {
      setUser(prev => ({
        ...prev,
        avatar: generateAvatar(prev.username)
      }));
    }
  }, [user.username]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(generateMockChat());
  
  // Game history
  const [gameHistory, setGameHistory] = useState<GameHistoryType[]>(generateMockGameHistory());
  
  // User bet state
  const [userBet, setUserBet] = useState<Bet | null>(null);
  const [autoCashout, setAutoCashout] = useState<number | null>(null);
  
  // Game timer refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize game with some mock bets
  useEffect(() => {
    console.log("Initializing game with mock bets");
    const mockBets = generateMockBets();
    setGame(prev => ({
      ...prev,
      bets: mockBets
    }));
  }, []);
  
  // Handle auto cashout
  useEffect(() => {
    if (
      game.status === GameStatus.IN_PROGRESS &&
      userBet &&
      autoCashout &&
      game.multiplier >= autoCashout &&
      userBet.cashoutMultiplier === null
    ) {
      handleCashout();
    }
  }, [game.multiplier, autoCashout]);

  // Game loop for updating multiplier
  const startGameLoop = useCallback(() => {
    console.log("Starting game loop");
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    const startTime = Date.now();
    gameLoopRef.current = setInterval(() => {
      const elapsedMs = Date.now() - startTime;
      const newMultiplier = calculateMultiplier(elapsedMs);
      
      setGame(prev => {
        // Check if we've reached the crash point
        if (newMultiplier >= prev.crashPoint) {
          if (gameLoopRef.current) clearInterval(gameLoopRef.current);
          
          return {
            ...prev,
            multiplier: prev.crashPoint,
            status: GameStatus.CRASHED,
            endTime: Date.now()
          };
        }
        
        return {
          ...prev,
          multiplier: newMultiplier
        };
      });
    }, TICK_RATE);
    
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, []);
  
  // Game state machine
  useEffect(() => {
    console.log("Game status changed:", game.status);
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (game.status === GameStatus.WAITING) {
      // Start the game after countdown
      const timeUntilStart = Math.max(0, game.startTime - Date.now());
      console.log(`Game will start in ${timeUntilStart}ms`);
      
      timerRef.current = setTimeout(() => {
        setGame(prev => {
          const crashPoint = generateCrashPoint();
          console.log(`Game starting with crash point: ${crashPoint.toFixed(2)}x`);
          
          return {
            ...prev,
            status: GameStatus.IN_PROGRESS,
            crashPoint,
          };
        });
        
        startGameLoop();
      }, timeUntilStart);
    } else if (game.status === GameStatus.CRASHED) {
      // Wait a few seconds before starting next round
      timerRef.current = setTimeout(() => {
        // Add current game to history
        setGameHistory(prev => [{
          id: game.id,
          crashPoint: game.crashPoint,
          timestamp: Date.now()
        }, ...prev].slice(0, 15));
        
        // Set up next game
        setGame({
          id: "game-" + Date.now(),
          multiplier: 1.0,
          crashPoint: 0,
          status: GameStatus.WAITING,
          startTime: Date.now() + 3000, // 3 seconds before next game
          endTime: null,
          bets: generateMockBets()
        });
        
        // Reset user bet for next round
        setUserBet(null);
        setAutoCashout(null);
      }, 3000);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [game.status]);
  
  // Handle placing a bet
  const handlePlaceBet = (amount: number, autoMultiplier: number | null) => {
    if (game.status !== GameStatus.WAITING) return;
    
    if (amount > user.balance) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough funds to place this bet",
        variant: "destructive"
      });
      return;
    }
    
    // Create user bet
    const bet: Bet = {
      userId: user.id,
      username: user.username,
      amount,
      cashoutMultiplier: null,
      profit: null
    };
    
    // Update user balance
    setUser(prev => ({
      ...prev,
      balance: prev.balance - amount
    }));
    
    // Save bet to game state
    setGame(prev => ({
      ...prev,
      bets: [...prev.bets, bet]
    }));
    
    // Save user bet
    setUserBet(bet);
    
    // Set auto cashout if provided
    if (autoMultiplier) {
      setAutoCashout(autoMultiplier);
    }
    
    toast({
      title: "Bet placed",
      description: `$${amount} placed at 1.00x`,
    });
  };
  
  // Handle manual cashout
  const handleCashout = () => {
    if (game.status !== GameStatus.IN_PROGRESS || !userBet) return;
    
    // Calculate profit
    const profit = Math.floor(userBet.amount * game.multiplier) - userBet.amount;
    
    // Update user bet with cashout multiplier and profit
    const updatedUserBet = {
      ...userBet,
      cashoutMultiplier: game.multiplier,
      profit
    };
    
    // Update user balance with winnings
    setUser(prev => ({
      ...prev,
      balance: prev.balance + Math.floor(userBet.amount * game.multiplier)
    }));
    
    // Update game bets
    setGame(prev => ({
      ...prev,
      bets: prev.bets.map(bet => 
        bet.userId === user.id ? updatedUserBet : bet
      )
    }));
    
    // Update user bet
    setUserBet(updatedUserBet);
    
    toast({
      title: "Cashed Out",
      description: `Successfully cashed out at ${game.multiplier.toFixed(2)}x`,
    });
  };
  
  // Handle sending chat message
  const handleSendMessage = (message: string) => {
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      message,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [newMessage, ...prev].slice(0, 100));
  };

  console.log("Rendering GameContainer");

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Game Area */}
        <div className="lg:col-span-3">
          <div className="mb-4" style={{minHeight: '400px'}}>
            <CrashGraph 
              multiplier={game.multiplier} 
              status={game.status} 
              gameHistory={gameHistory}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <BettingPanel 
                gameStatus={game.status}
                userBalance={user.balance}
                onPlaceBet={handlePlaceBet}
                onCashout={handleCashout}
                hasBet={!!userBet}
                currentMultiplier={game.multiplier}
              />
            </div>
            <div className="md:col-span-2">
              <GameHistory history={gameHistory} />
            </div>
          </div>
          
          <div className="mt-4">
            <BetsTable bets={game.bets} />
          </div>
        </div>
        
        {/* Chat Panel */}
        <div className="lg:col-span-1">
          <ChatPanel 
            messages={chatMessages}
            currentUser={user}
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default GameContainer;
