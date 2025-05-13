
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogIn } from "lucide-react";
import { useAptosWallet } from "./AptosWalletProvider";
import { toast } from "@/hooks/use-toast";
import { User } from "@/types/game";
import { WalletUser } from "@/types/wallet";

interface WalletConnectProps {
  user: User & Partial<WalletUser>;
  onWalletConnect: (walletDetails: WalletUser) => void;
}

const WalletConnect: React.FC<WalletConnectProps> = ({ user, onWalletConnect }) => {
  const { connectWallet, disconnectWallet, isConnecting, isConnected, address, signMessage } = useAptosWallet();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Handle connecting wallet
  const handleConnectWallet = async () => {
    if (isConnected && address) {
      handleSignMessage();
      return;
    }

    try {
      await connectWallet();
      toast({
        title: "Wallet Connected",
        description: "Your Aptos wallet has been connected successfully.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Could not connect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle signing message
  const handleSignMessage = async () => {
    if (!address) return;
    
    setIsSigningIn(true);
    try {
      const message = "Login to Crash Game";
      const signature = await signMessage(message);
      
      if (signature) {
        // Update parent component with wallet information
        onWalletConnect({
          walletAddress: address,
          signature,
          isAuthenticated: true
        });
        
        toast({
          title: "Successfully Authenticated",
          description: `Connected as ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
        });
      }
    } catch (error) {
      toast({
        title: "Authentication Failed",
        description: "Could not sign message with wallet.",
        variant: "destructive"
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  // Handle disconnecting wallet
  const handleDisconnectWallet = () => {
    disconnectWallet();
    onWalletConnect({
      walletAddress: undefined,
      signature: undefined,
      isAuthenticated: false
    });
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected."
    });
  };

  // If connected but not authenticated, prompt to sign message
  useEffect(() => {
    const isUserAuthenticated = user.isAuthenticated ?? false;
    if (isConnected && address && !isUserAuthenticated && !isSigningIn) {
      handleSignMessage();
    }
  }, [isConnected, address, user.isAuthenticated, isSigningIn]);

  return (
    <div className="flex items-center">
      {!isConnected ? (
        <Button 
          variant="default"
          className="bg-crash-accent hover:bg-crash-accent/80"
          onClick={handleConnectWallet}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              Connecting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Connect Wallet
            </span>
          )}
        </Button>
      ) : !(user.isAuthenticated ?? false) ? (
        <Button 
          variant="default" 
          className="bg-crash-green hover:bg-crash-green/80"
          onClick={handleSignMessage}
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              Signing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign Message
            </span>
          )}
        </Button>
      ) : (
        <div className="flex items-center gap-3">
          <div className="text-xs bg-crash-card px-3 py-1 rounded-full">
            {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDisconnectWallet}
          >
            Disconnect
          </Button>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
