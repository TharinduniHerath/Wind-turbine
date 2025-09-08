import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import WindTurbine from '../WTModelMaintenance/WindTurbine';

interface TurbineModel3DProps {
  isModal?: boolean;
  hideLabels?: boolean;
}

const TurbineModel3D: React.FC<TurbineModel3DProps> = ({ isModal = false, hideLabels = false }) => {
  if (isModal) {
    // Modal version - fills entire container
    return (
      <Canvas
        camera={{ 
          position: [4, 12.5, 4], 
          fov: 35 
        }}
        shadows
        className="w-full h-full"
        style={{ 
          display: 'block',
          width: '100%',
          height: '100%'
        }}
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
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
            <WindTurbine rpm={12} pitch={Math.PI / 7} hideLabels={false} />
            
            {/* Controls */}
            <OrbitControls 
              target={[0, 12.5, 0]}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={15}
              autoRotate={false}
              autoRotateSpeed={0.5}
            />
          </Suspense>
        </Canvas>
    );
  }

  // Regular version - with header and fixed height
  return (
    <div className="w-full">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold">3D Turbine Model</h4>
            <p className="text-slate-400 text-sm mt-1">
              Interactive 3D visualization of wind turbine components
            </p>
          </div>
          <div className="text-xs text-slate-400">
            Drag to rotate • Scroll to zoom • Hover for component info
          </div>
        </div>
      </div>
      
      <div className="relative h-96 bg-slate-900 rounded-lg border border-slate-600 overflow-hidden">
        <Canvas
          camera={{ 
            position: [4, 12.5, 4], 
            fov: 35 
          }}
          shadows
          className="rounded-lg"
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
            <WindTurbine rpm={12} pitch={Math.PI / 7} hideLabels={hideLabels} />
            
            {/* Controls */}
            <OrbitControls 
              target={[0, 12.5, 0]}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={15}
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
