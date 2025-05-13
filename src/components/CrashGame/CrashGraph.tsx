
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

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
              ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    ctx.globalAlpha = 0.4;
    history.slice(0, 5).forEach((game, index) => {
      drawCurve(
        ctx,
        width,
        height,
        game.crashPoint,
        true,
        `rgba(255, 255, 255, ${0.3 - index * 0.05})`
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

    // Determine color based on multiplier or crashed state
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
    } else if (crashed) {
      ctx.strokeStyle = "#ff5353"; // Red for crashed
    } else {
      ctx.strokeStyle = getMultiplierColor(currentMultiplier);
    }

    ctx.lineWidth = 4; // Thicker line
    ctx.stroke();

    // Add glow effect for active games
    if (!crashed && !strokeColor) {
      ctx.shadowBlur = 15; // Increased glow
      ctx.shadowColor = getMultiplierColor(currentMultiplier);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  };

  // Calculate rocket rotation angle based on curve tangent
  const calculateRocketRotation = () => {
    // Calculate a reasonable rotation for the rocket to follow the curve
    // Higher multiplier = steeper curve = more vertical rotation
    const baseAngle = -45; // Start with a 45-degree upward angle
    const maxAngle = -80; // Almost vertical at high multipliers
    
    // Gradually rotate more vertical as multiplier increases
    const rotationAngle = baseAngle - Math.min((multiplier - 1) * 5, maxAngle - baseAngle);
    
    return rotationAngle;
  };

  return (
    <div className="crash-graph w-full h-full bg-crash-card rounded-lg overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
      />
      
      {/* Enhanced Rocket Animation */}
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
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full z-0">
            <div className="w-5 h-12 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full animate-[rocket-thrust_0.6s_ease-in-out_infinite]"></div>
          </div>
          
          {/* Sparks */}
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full">
            <Sparkles
              size={20}
              className="text-yellow-300 animate-[pulse_0.5s_ease-in-out_infinite]"
              fill="rgba(253, 224, 71, 0.6)"
            />
          </div>
          
          {/* Rocket shadow for better visibility */}
          <div className="absolute inset-0 scale-110 opacity-30 blur-sm">
            <Rocket 
              size={48} 
              className="rocket-icon"
              fill="black"
              color="black" 
            />
          </div>
          
          {/* Main rocket */}
          <Rocket 
            size={40} 
            className="rocket-icon" 
            fill={getMultiplierColor(multiplier)}
            color="white"
            strokeWidth={1.5}
          />
          
          {/* Glowing effect around rocket */}
          <div 
            className="absolute inset-0 -z-10 rounded-full animate-pulse blur-lg opacity-70"
            style={{ 
              backgroundColor: getMultiplierColor(multiplier),
              width: '120%',
              height: '120%',
              transform: 'translate(-10%, -10%)',
              filter: `drop-shadow(0 0 10px ${getMultiplierColor(multiplier)})`
            }}
          ></div>
          
          {/* Power indicator */}
          {multiplier > 2 && (
            <div className="absolute -right-4 -top-4">
              <Zap 
                size={20} 
                className="text-yellow-300 animate-pulse" 
                fill="rgba(253, 224, 71, 0.6)"
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
      
      <div 
        className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    text-6xl font-bold multiplier-text transition-all duration-200
                    ${status === GameStatus.CRASHED ? 'text-red-500 scale-125' : ''}`}
        style={{ 
          color: status !== GameStatus.CRASHED ? getMultiplierColor(multiplier) : 'rgb(239, 68, 68)',
          textShadow: '0 0 10px rgba(255,255,255,0.5)',
          zIndex: 15
        }}
      >
        {status === GameStatus.WAITING ? (
          <div className="text-3xl animate-pulse">STARTING SOON</div>
        ) : (
          formatMultiplier(multiplier)
        )}
      </div>
    </div>
  );
};

export default CrashGraph;
