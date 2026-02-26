import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTurbineStore } from '../../store/turbineStore';
import { Maximize2, RotateCcw, Settings, Play, Pause } from 'lucide-react';

const TurbineSimulation: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { 
    simulationActive, 
    turbineAnimation, 
    toggleSimulation,
    currentData 
  } = useTurbineStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotorAngle = 0;
    const drawTurbine = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Set canvas center
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#0f172a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#065f46';
      ctx.fillRect(0, canvas.height * 0.8, canvas.width, canvas.height * 0.2);
      
      // Tower
      const towerHeight = 200;
      const towerWidth = 8;
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(centerX - towerWidth/2, centerY + 50, towerWidth, towerHeight);
      
      // Nacelle
      const nacelleWidth = 40;
      const nacelleHeight = 20;
      ctx.save();
      ctx.translate(centerX, centerY + 50);
      ctx.rotate((turbineAnimation.yaw * Math.PI) / 180);
      
      // Nacelle body
      ctx.fillStyle = '#d1d5db';
      ctx.fillRect(-nacelleWidth/2, -nacelleHeight/2, nacelleWidth, nacelleHeight);
      
      // Hub
      const hubRadius = 12;
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(nacelleWidth/2 - 5, 0, hubRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Rotor blades
      if (simulationActive) {
        rotorAngle += turbineAnimation.rotorSpeed * 0.1;
      }
      
      ctx.save();
      ctx.translate(nacelleWidth/2 - 5, 0);
      ctx.rotate(rotorAngle);
      
      // Draw 3 blades
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i * 120 * Math.PI) / 180);
        
        // Blade
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.ellipse(0, -80, 8, 80, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
      
      ctx.restore();
      ctx.restore();
      
      // Draw wind particles
      drawWindParticles(ctx, canvas.width, canvas.height);
      
      // Continue animation
      if (simulationActive) {
        animationRef.current = requestAnimationFrame(drawTurbine);
      }
    };

    // Start animation
    drawTurbine();
    if (simulationActive) {
      animationRef.current = requestAnimationFrame(drawTurbine);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulationActive, turbineAnimation]);

  const drawWindParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    for (let i = 0; i < 20; i++) {
      const x = (Date.now() * 0.05 + i * 50) % (width + 100) - 50;
      const y = 100 + Math.sin(Date.now() * 0.001 + i) * 50;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h3 className="text-white font-semibold">3D Turbine Simulation</h3>
          <p className="text-slate-400 text-sm">Real-time digital twin visualization</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleSimulation}
            className={`p-2 rounded-lg transition-colors ${
              simulationActive 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {simulationActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="w-full bg-slate-900"
          style={{ aspectRatio: '3/2' }}
        />
        
        {/* Overlay Info */}
        <div className="absolute top-4 left-4 bg-black/50 rounded-lg p-3 text-white text-sm">
          <div className="space-y-1">
            <div>RPM: {currentData?.rotorRpm.toFixed(1) || '0.0'}</div>
            <div>Yaw: {currentData?.nacelle.yaw.toFixed(0) || '0'}°</div>
            <div>Pitch: {currentData?.blades.pitch.toFixed(1) || '0.0'}°</div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="absolute top-4 right-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            simulationActive 
              ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
              : 'bg-slate-600/20 text-slate-400 border border-slate-600/30'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              simulationActive ? 'bg-green-400' : 'bg-slate-400'
            }`} />
            <span>{simulationActive ? 'Running' : 'Stopped'}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-slate-400 mb-1">Wind Speed</div>
            <div className="text-white font-semibold">
              {currentData?.windSpeed.toFixed(1) || '0.0'} m/s
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">Power Output</div>
            <div className="text-white font-semibold">
              {currentData?.powerOutput.toFixed(2) || '0.00'} MW
            </div>
          </div>
          <div className="text-center">
            <div className="text-slate-400 mb-1">Efficiency</div>
            <div className="text-white font-semibold">
              {currentData ? ((currentData.powerOutput / 3.0) * 100).toFixed(1) : '0.0'}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurbineSimulation;