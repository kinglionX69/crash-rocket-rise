
import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatMessage, User } from "@/types/game";

interface ChatPanelProps {
  messages: ChatMessage[];
  currentUser: User;
  onSendMessage: (message: string) => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, currentUser, onSendMessage }) => {
  const [newMessage, setNewMessage] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  // Format timestamp to readable time
  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="game-card h-full flex flex-col">
      <div className="p-3 border-b border-muted">
        <h3 className="text-lg font-semibold">Chat</h3>
      </div>

      {/* Messages Container */}
      <div className="flex-grow overflow-y-auto p-3">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-3">
            <div className="flex items-start">
              <img
                src={msg.avatar}
                alt="Avatar"
                className="w-6 h-6 rounded-full mr-2"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <span className="font-medium text-sm">{msg.username}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm break-words">{msg.message}</p>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-muted">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSend} className="bg-crash-accent">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
