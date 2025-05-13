import React, { useRef, useEffect, useState } from "react";
import { GameStatus } from "@/types/game";
import { formatMultiplier, getMultiplierColor } from "@/utils/crash";
import { Rocket } from "lucide-react";

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
      }
      
      // Start animation
      if (animationRef.current === null) {
        const animate = () => {
          if (canvasRef.current && status === GameStatus.IN_PROGRESS) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              const now = Date.now();
              const elapsed = startTimeRef.current ? now - startTimeRef.current : 0;
              
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
    } else {
      // Game is waiting
      startTimeRef.current = null;
      
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

    ctx.lineWidth = 3;
    ctx.stroke();

    // Add glow effect for active games
    if (!crashed && !strokeColor) {
      ctx.shadowBlur = 10;
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
      
      {/* Rocket animation */}
      {status === GameStatus.IN_PROGRESS && (
        <div 
          className="absolute transition-all duration-100 transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ 
            left: `${rocketPosition.x}px`, 
            top: `${rocketPosition.y}px`,
            transform: `translate(-50%, -50%) rotate(${calculateRocketRotation()}deg)`,
          }}
        >
          <Rocket 
            size={28} 
            className="rocket-icon animate-pulse-grow" 
            fill={getMultiplierColor(multiplier)}
            color={getMultiplierColor(multiplier)} 
          />
        </div>
      )}
      
      {status !== GameStatus.WAITING && (
        <div 
          className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                      text-5xl font-bold multiplier-text transition-all
                      ${status === GameStatus.CRASHED ? 'animate-crash-out' : 'animate-crash-in'}`}
          style={{ color: getMultiplierColor(multiplier) }}
        >
          {status === GameStatus.CRASHED ? 'CRASH!' : formatMultiplier(multiplier)}
        </div>
      )}
      
      {status === GameStatus.WAITING && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white animate-pulse">
          Next Round Starting...
        </div>
      )}
    </div>
  );
};

export default CrashGraph;
