
import { 
  AptosWalletAdapterProvider,
  NetworkName, 
  useWallet
} from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "@/hooks/use-toast";

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
  // Initialize wallet adapters
  const wallets = [
    new PetraWallet(),
    // You can add more wallet adapters here as needed
  ];

  return (
    <AptosWalletAdapterProvider wallets={wallets} autoConnect={true}>
      <WalletContextProvider>{children}</WalletContextProvider>
    </AptosWalletAdapterProvider>
  );
};

// Create the wallet context provider component
const WalletContextProvider = ({ children }: { children: ReactNode }) => {
  const { 
    connect, 
    account, 
    disconnect, 
    connected, 
    signMessage: aptosSignMessage,
    network,
  } = useWallet();
  const [isConnecting, setIsConnecting] = useState(false);

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await connect('petra');
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
    disconnect();
  };

  // Sign message function
  const signMessage = async (message: string): Promise<string | undefined> => {
    if (!connected || !account) return undefined;
    
    try {
      const response = await aptosSignMessage({
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
    isConnected: connected,
    address: account?.address ? account.address.toString() : null,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Create a custom hook to use the wallet context
export const useAptosWallet = () => useContext(WalletContext);
