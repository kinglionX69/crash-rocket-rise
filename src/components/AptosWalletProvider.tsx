
import React from "react";
import {
  AptosWalletAdapterProvider,
  NetworkName,
  useWallet
} from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";

const wallets = [new PetraWallet()];

// Define the wallet context type
interface WalletContextType {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string | undefined>;
  isConnecting: boolean;
  isConnected: boolean;
  address: string | null;
}

// Create the wallet context
export const WalletContext = createContext<WalletContextType>({
  connectWallet: async () => {},
  disconnectWallet: () => {},
  signMessage: async () => undefined,
  isConnecting: false,
  isConnected: false,
  address: null,
});

// Create the Aptos wallet provider component
export const AptosWalletProvider = ({ children }: { children: ReactNode }) => {
  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      network={NetworkName.Testnet}
    >
      <WalletContextProvider>{children}</WalletContextProvider>
    </AptosWalletAdapterProvider>
  );
};

// Create the wallet context provider component
const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  const wallet = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await wallet.connect('petra');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to Petra wallet. Please make sure it's installed and try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    wallet.disconnect();
  };

  // Sign message function
  const signMessage = async (message: string): Promise<string | undefined> => {
    if (!wallet.connected || !wallet.account) return undefined;
    
    try {
      const response = await wallet.signMessage({
        message,
        nonce: new Date().getTime().toString()
      });
      // Convert the response to string to match our interface
      return typeof response === 'string' ? response : JSON.stringify(response);
    } catch (error) {
      console.error('Error signing message:', error);
      toast({
        title: "Signing Failed",
        description: "Could not sign message with wallet.",
        variant: "destructive"
      });
      return undefined;
    }
  };

  // Expose wallet context values
  const contextValue: WalletContextType = {
    connectWallet,
    disconnectWallet,
    signMessage,
    isConnecting: isConnecting,
    isConnected: wallet.connected,
    address: wallet.account?.address ? wallet.account.address.toString() : null,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Create a custom hook to use the wallet context
export const useAptosWallet = () => useContext(WalletContext);
