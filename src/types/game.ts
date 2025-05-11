
export interface Game {
  id: string;
  multiplier: number;
  crashPoint: number;
  status: GameStatus;
  startTime: number;
  endTime: number | null;
  bets: Bet[];
}

export enum GameStatus {
  WAITING = "waiting",
  IN_PROGRESS = "in_progress",
  CRASHED = "crashed",
}

export interface Bet {
  userId: string;
  username: string;
  amount: number;
  cashoutMultiplier: number | null;
  profit: number | null;
}

export interface User {
  id: string;
  username: string;
  balance: number;
  avatar: string;
  isAuthenticated?: boolean; // Added isAuthenticated property
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  message: string;
  timestamp: number;
}

export interface GameHistory {
  id: string;
  crashPoint: number;
  timestamp: number;
}
