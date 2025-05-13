
import React, { useRef, useEffect, useState } from "react";
import { GameStatus } from "@/types/game";
import { formatMultiplier, getMultiplierColor } from "@/utils/crash";
import { Rocket, Zap, Sparkles } from "lucide-react";

interface CrashGraphProps {
  multiplier: number;
  status: GameStatus;
  gameHistory: Array<{ crashPoint: number }>;
}

const CrashGraph: React.FC<CrashGraphProps> = ({ multiplier, status, gameHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [rocketPosition, setRocketPosition] = useState({ x: 0, y: 0 });
  const [rocketVisible, setRocketVisible] = useState(false);

  // Effect to set up canvas and handle resizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const parent = canvas.parentElement;
      if (parent) {
        const { width, height } = parent.getBoundingClientRect();
        setDimensions({ width, height });
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Calculate position on the curve for the current multiplier
  const calculateCurvePosition = (multiplier: number, width: number, height: number) => {
    // This should match the curve drawing logic
    const points = 100;
    const progress = Math.min((multiplier - 1) * 10, points) / points;
    const xScale = width / points;
    const x = progress * points * xScale;
    
    // Calculate y position using the same function as in drawCurve
    const calcY = (x: number, multiplier: number) => {
      return height - (Math.pow(x, 0.5) * height) / Math.max(5, multiplier);
    };
    
    const normalizedX = progress * points;
    const y = calcY(normalizedX, Math.max(1, multiplier));
    
    return { x, y };
  };

  // Effect to handle drawing the crash graph
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0a1929');
    gradient.addColorStop(1, '#0f2d4a');
    
    // Fill background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Draw game history
    drawGameHistory(ctx, canvas.width, canvas.height, gameHistory);

    // If game is running, draw the current curve
    if (status === GameStatus.IN_PROGRESS) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
        setRocketVisible(true);
      }
      
      // Start animation
      if (animationRef.current === null) {
        const animate = () => {
          if (canvasRef.current && status === GameStatus.IN_PROGRESS) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              // Clear and redraw each frame
              // Create gradient background
              const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
              gradient.addColorStop(0, '#0a1929');
              gradient.addColorStop(1, '#0f2d4a');
              
              // Fill background
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              drawGrid(ctx, canvas.width, canvas.height);
              drawGameHistory(ctx, canvas.width, canvas.height, gameHistory);
              drawCurve(ctx, canvas.width, canvas.height, multiplier);
              
              // Update rocket position
              const pos = calculateCurvePosition(multiplier, canvas.width, canvas.height);
              setRocketPosition(pos);
            }
            animationRef.current = requestAnimationFrame(animate);
          }
        };
        animate();
      }
    } else if (status === GameStatus.CRASHED) {
      // Draw the crashed state
      drawCurve(ctx, canvas.width, canvas.height, multiplier, true);
      startTimeRef.current = null;
      
      // Stop animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      
      // Hide rocket after crash
      setTimeout(() => {
        setRocketVisible(false);
      }, 500);
      
    } else {
      // Game is waiting
      startTimeRef.current = null;
      setRocketVisible(false);
      
      // Reset rocket position
      setRocketPosition({ x: 0, y: 0 });
      
      // Stop animation
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    // Clean up animation on unmount
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [multiplier, status, gameHistory, dimensions]);

  // Draw background grid
  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    
    // Draw horizontal lines
    const horizontalLines = 10;
    const horizontalStep = height / horizontalLines;
    
    for (let i = 0; i <= horizontalLines; i++) {
      const y = i * horizontalStep;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw vertical lines
    const verticalLines = 20;
    const verticalStep = width / verticalLines;
    
    for (let i = 0; i <= verticalLines; i++) {
      const x = i * verticalStep;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  };

  // Draw previous game results
  const drawGameHistory = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    history: Array<{ crashPoint: number }>
  ) => {
    ctx.globalAlpha = 0.2;
    history.slice(0, 3).forEach((game, index) => {
      drawCurve(
        ctx,
        width,
        height,
        game.crashPoint,
        true,
        `rgba(0, 180, 255, ${0.2 - index * 0.05})`
      );
    });
    ctx.globalAlpha = 1;
  };

  // Draw the crash curve
  const drawCurve = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    currentMultiplier: number,
    crashed: boolean = false,
    strokeColor?: string
  ) => {
    // Define the crash curve function (exponential)
    const calcY = (x: number, multiplier: number) => {
      // Invert y since canvas y increases downward
      return height - (Math.pow(x, 0.5) * height) / Math.max(5, multiplier);
    };

    const points = 100;
    const xScale = width / points;

    ctx.beginPath();
    ctx.moveTo(0, height);

    for (let i = 0; i <= points; i++) {
      const x = i * xScale;
      const normalizedX = i / points;
      const scaledMultiplier = currentMultiplier * normalizedX;
      const y = calcY(i, Math.max(1, currentMultiplier));
      ctx.lineTo(x, y);
    }

    // Use a glowing cyan-blue color for the curve
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
    } else if (crashed) {
      ctx.strokeStyle = "#ff5353"; // Red for crashed
    } else {
      ctx.strokeStyle = "#00B4FF"; // Bright cyan-blue
    }

    ctx.lineWidth = 5; // Thicker line
    ctx.stroke();

    // Add glow effect for active games
    if (!crashed && !strokeColor) {
      ctx.shadowBlur = 15; 
      ctx.shadowColor = "#00B4FF";
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  // Calculate rocket rotation angle based on curve tangent
  const calculateRocketRotation = () => {
    // Calculate a reasonable rotation for the rocket to follow the curve
    const baseAngle = -45; // Start with a 45-degree upward angle
    const maxAngle = -80; // Almost vertical at high multipliers
    
    // Gradually rotate more vertical as multiplier increases
    const rotationAngle = baseAngle - Math.min((multiplier - 1) * 5, maxAngle - baseAngle);
    
    return rotationAngle;
  };

  // Format the current multiplier to match the example layout
  const formatDisplayMultiplier = () => {
    if (status === GameStatus.IN_PROGRESS || status === GameStatus.CRASHED) {
      return (
        <div className="text-center">
          <div className="text-6xl font-bold">
            {formatMultiplier(multiplier)}
          </div>
          <div className="text-sm text-cyan-400 mt-1">
            Current Multiplier
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="crash-graph w-full h-full bg-crash-card rounded-lg overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* Enhanced Rocket */}
      {status === GameStatus.IN_PROGRESS && rocketVisible && (
        <div 
          className="absolute transition-all duration-100 z-20"
          style={{ 
            left: `${rocketPosition.x}px`, 
            top: `${rocketPosition.y}px`,
            transform: `translate(-50%, -50%) rotate(${calculateRocketRotation()}deg)`,
            transition: 'top 0.1s ease, left 0.1s ease',
          }}
        >
          {/* Rocket Trail */}
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 translate-y-full z-0">
            <div className="w-5 h-16 bg-gradient-to-t from-blue-500 via-cyan-400 to-transparent rounded-full animate-[rocket-thrust_0.6s_ease-in-out_infinite]"></div>
          </div>
          
          {/* Sparks */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 translate-y-full">
            <Sparkles
              size={24}
              className="text-cyan-300 animate-[pulse_0.5s_ease-in-out_infinite]"
              fill="rgba(103, 232, 249, 0.7)"
            />
          </div>
          
          {/* Main rocket */}
          <div className="relative">
            {/* Glowing effect around rocket */}
            <div 
              className="absolute inset-0 -z-10 rounded-full animate-pulse blur-lg opacity-70"
              style={{ 
                backgroundColor: "#00B4FF",
                width: '150%',
                height: '150%',
                transform: 'translate(-25%, -25%)',
                filter: 'drop-shadow(0 0 15px #00B4FF)'
              }}
            ></div>
            
            {/* Rocket icon */}
            <Rocket 
              size={50} 
              className="rocket-icon" 
              fill="#FFFFFF"
              color="#FFFFFF"
              strokeWidth={1}
            />
          </div>
          
          {/* Power indicator */}
          {multiplier > 2 && (
            <div className="absolute -right-4 -top-4">
              <Zap 
                size={24} 
                className="text-cyan-300 animate-pulse" 
                fill="rgba(103, 232, 249, 0.7)"
              />
            </div>
          )}
        </div>
      )}
      
      {status === GameStatus.CRASHED && (
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
          <div className="animate-crash-out bg-red-500/20 backdrop-blur-sm rounded-full p-12 flex items-center justify-center">
            <div className="text-7xl font-bold text-red-500 text-shadow-lg">
              CRASH!
            </div>
          </div>
        </div>
      )}
      
      {/* Center multiplier display similar to the example */}
      <div 
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    transition-all duration-200 z-10
                    ${status === GameStatus.CRASHED ? 'text-red-500 scale-125' : ''}`}
      >
        {status === GameStatus.WAITING ? (
          <div className="text-3xl text-white animate-pulse">STARTING SOON</div>
        ) : (
          formatDisplayMultiplier()
        )}
      </div>
      
      {/* History bar at bottom */}
      {gameHistory.length > 0 && status === GameStatus.WAITING && (
        <div className="absolute bottom-0 left-0 w-full bg-black/30 py-1 flex justify-center gap-2">
          {gameHistory.slice(0, 15).map((game, i) => (
            <div 
              key={i} 
              className={`text-xs font-mono px-2 py-1 rounded ${
                game.crashPoint < 2 ? 'bg-red-500/80' : 'bg-cyan-500/80'
              }`}
            >
              {formatMultiplier(game.crashPoint)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
