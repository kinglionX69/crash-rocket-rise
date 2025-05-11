
import React, { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import GameContainer from "@/components/CrashGame/GameContainer";
import WalletConnect from "@/components/WalletConnect";
import { User } from "@/types/game";
import { WalletUser } from "@/types/wallet";

const Index = () => {
  const [user, setUser] = useState<User & Partial<WalletUser>>({
    id: "user-" + Math.random().toString(36).substring(2, 9),
    username: "",
    balance: 10000,
    avatar: "",
    isAuthenticated: false
  });

  // Handle wallet connection
  const handleWalletConnect = (walletDetails: WalletUser) => {
    setUser(prev => ({
      ...prev,
      ...walletDetails
    }));
  };

  return (
    <div className="min-h-screen bg-crash-background text-white">
      <header className="bg-crash-card border-b border-muted/30 py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-crash-green to-crash-accent">
              Crash Game
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <nav>
              <ul className="hidden md:flex space-x-6">
                <li>
                  <a href="#" className="hover:text-crash-green transition-colors">
                    Games
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-crash-green transition-colors">
                    Leaderboard
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-crash-green transition-colors">
                    Profile
                  </a>
                </li>
              </ul>
            </nav>
            <WalletConnect user={user} onWalletConnect={handleWalletConnect} />
          </div>
        </div>
      </header>

      <main className="py-6">
        <GameContainer />
      </main>

      <footer className="mt-8 py-4 border-t border-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>This is a demo project for entertainment purposes only. No real money is involved.</p>
        </div>
      </footer>
      
      <Toaster position="top-right" />
    </div>
  );
};

export default Index;
