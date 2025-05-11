
import { GameStatus } from "../types/game";

// Constants for the crash game
export const TICK_RATE = 100; // ms
export const START_TIME = 3; // seconds before game starts
export const BASE_SPEED = 0.00006;
export const MAX_MULTIPLIER = 100;

// Generate a random crash point with house edge
export const generateCrashPoint = (houseEdge = 0.01): number => {
  // This approach gives a house edge
  const e = Math.random();
  if (e < houseEdge) return 1.0; // Instant crash (rare)
  
  // This creates an exponential distribution that's similar to real crash games
  return Math.max(1.0, (Math.random() * 0.99 + 0.01) * 15);
};

// Calculate the current multiplier based on elapsed time
export const calculateMultiplier = (elapsedTimeMs: number): number => {
  const multiplier = Math.pow(Math.E, BASE_SPEED * elapsedTimeMs);
  return Math.min(MAX_MULTIPLIER, parseFloat(multiplier.toFixed(2)));
};

// Format multiplier for display
export const formatMultiplier = (multiplier: number): string => {
  if (multiplier >= 100) {
    return multiplier.toFixed(0) + "x";
  }
  if (multiplier >= 10) {
    return multiplier.toFixed(1) + "x";
  }
  return multiplier.toFixed(2) + "x";
};

// Get color based on multiplier
export const getMultiplierColor = (multiplier: number): string => {
  if (multiplier < 1.2) return "#FFFFFF";
  if (multiplier < 2) return "#00E701";  // green
  if (multiplier < 10) return "#FFC300"; // gold
  return "#FF5353";  // red
};

// Get game status text
export const getGameStatusText = (status: GameStatus, multiplier: number): string => {
  switch (status) {
    case GameStatus.WAITING:
      return "STARTING SOON";
    case GameStatus.IN_PROGRESS:
      return formatMultiplier(multiplier);
    case GameStatus.CRASHED:
      return "CRASHED @ " + formatMultiplier(multiplier);
    default:
      return "WAITING";
  }
};

// Generate a random username for testing
export const generateUsername = (): string => {
  const adjectives = ["Happy", "Lucky", "Crazy", "Cool", "Wild", "Calm", "Brave"];
  const nouns = ["Whale", "Tiger", "Eagle", "Shark", "Trader", "Player", "Hunter"];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj}${noun}${Math.floor(Math.random() * 1000)}`;
};

// Generate a random avatar URL
export const generateAvatar = (username: string): string => {
  return `https://api.dicebear.com/6.x/personas/svg?seed=${username}`;
};

// Generate mock data for game history
export const generateMockGameHistory = (count = 15): { crashPoint: number; id: string }[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `game-${Date.now() - i * 30000}`,
    crashPoint: generateCrashPoint(),
    timestamp: Date.now() - i * 30000,
  }));
};

// Generate mock bets
export const generateMockBets = (count = 8): any[] => {
  return Array.from({ length: count }, () => {
    const username = generateUsername();
    const amount = Math.floor(Math.random() * 900) + 100;
    
    // Some users cash out, some don't
    const didCashout = Math.random() > 0.3;
    const cashoutMultiplier = didCashout ? (Math.random() * 4 + 1.1).toFixed(2) : null;
    
    return {
      userId: `user-${Math.random().toString(36).substring(2, 9)}`,
      username,
      avatar: generateAvatar(username),
      amount,
      cashoutMultiplier: cashoutMultiplier ? parseFloat(cashoutMultiplier) : null,
      profit: cashoutMultiplier ? Math.floor(amount * parseFloat(cashoutMultiplier)) - amount : null
    };
  });
};

// Generate mock chat messages
export const generateMockChat = (count = 10): any[] => {
  const messages = [
    "Good luck everyone!",
    "I'm going all in this round",
    "This is going to crash early",
    "Let's go to the moon!",
    "Should have cashed out earlier...",
    "Nice win!",
    "What's your strategy?",
    "I'm on a roll today",
    "Who's betting big?",
    "This game is addictive",
    "I feel lucky today"
  ];

  return Array.from({ length: count }, (_, i) => {
    const username = generateUsername();
    
    return {
      id: `msg-${Date.now() - i * 15000}`,
      userId: `user-${Math.random().toString(36).substring(2, 9)}`,
      username,
      avatar: generateAvatar(username),
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: Date.now() - i * (Math.random() * 60000 + 10000)
    };
  });
};
