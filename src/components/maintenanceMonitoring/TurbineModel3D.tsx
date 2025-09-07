import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import WindTurbine from '../WTModelMaintenance/WindTurbine';

const TurbineModel3D: React.FC = () => {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">3D Turbine Model</h3>
            <p className="text-slate-400 text-sm mt-1">
              Interactive 3D visualization of wind turbine components
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Drag to rotate • Scroll to zoom • Hover for component info
          </div>
        </div>
      </div>
      
      <div className="relative h-96">
        <Canvas
          camera={{ 
            position: [12, 8, 12], 
            fov: 50 
          }}
          shadows
          className="rounded-b-xl"
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight
              position={[10, 20, 5]}
              intensity={1}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
            
            {/* Environment */}
            <Environment preset="sunset" />
            
            {/* Wind Turbine Model */}
            <WindTurbine rpm={12} pitch={Math.PI / 7} />
            
            {/* Controls */}
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={8}
              maxDistance={25}
              autoRotate={false}
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>
        
      </div>
    </div>
  );
};

export default TurbineModel3D;
