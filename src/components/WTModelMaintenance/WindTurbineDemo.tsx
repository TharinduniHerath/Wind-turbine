import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import WindTurbine from './WindTurbine';

const WindTurbineDemo: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gradient-to-b from-blue-400 to-blue-600">


      {/* 3D Canvas */}
      <Canvas
        camera={{ 
          position: [15, 10, 15], 
          fov: 60 
        }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* Environment */}
          <Environment preset="sunset" />
          
          {/* Wind Turbine Model */}
          <WindTurbine rpm={15} pitch={Math.PI / 6} />
          
          {/* Controls */}
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default WindTurbineDemo;
