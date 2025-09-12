import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text, Html } from '@react-three/drei';

interface ProfessionalWindTurbineProps {
  rpm?: number;
  pitch?: number;
  nacelle_position?: number;
  scadaData?: {
    nacelle_position: number;
    pitch_angle: number;
    rotor_rpm: number;
    timestamp: string;
  };
}

// Professional Tower Component
const ProfessionalTower = () => {
  const [hovered, setHovered] = useState(false);
  
  const towerGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.8, 1.4, 35, 16);
  }, []);

  return (
    <group>
      {/* Main Tower - Realistic proportions */}
      <mesh 
        position={[0, 17.5, 0]} 
        geometry={towerGeometry}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={hovered ? "#F0F0F0" : "#E8E8E8"} 
          metalness={0.4} 
          roughness={0.3} 
        />
      </mesh>
      
      {/* Foundation */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[3, 3, 1.5, 12]} />
        <meshStandardMaterial color="#A0A0A0" metalness={0.1} roughness={0.8} />
      </mesh>
      
      {/* Service Door */}
      <mesh position={[0, 3, 1.35]} rotation={[0, 0, 0]}>
        <boxGeometry args={[1.2, 3, 0.15]} />
        <meshStandardMaterial color="#2A2A2A" />
      </mesh>
      
      {/* Tower segments (realistic wind turbine appearance) */}
      {[8, 16, 24].map((height, i) => (
        <mesh key={i} position={[0, height, 0]} rotation={[0, Math.PI/4 * i, 0]}>
          <torusGeometry args={[1.2 - i*0.1, 0.02, 8, 32]} />
          <meshStandardMaterial color="#CCCCCC" />
        </mesh>
      ))}
      
      {/* Ladder */}
      <group position={[0, 17.5, 1.3]}>
        {Array.from({ length: 35 }, (_, i) => (
          <mesh key={i} position={[0, -17.5 + i, 0]}>
            <boxGeometry args={[0.4, 0.05, 0.05]} />
            <meshStandardMaterial color="#666666" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// Professional Nacelle with Clear Rotation Indicators
const ProfessionalNacelle = ({ rpm, nacellePosition, showSCADA }) => {
  const [hoveredComponent, setHoveredComponent] = useState(null);
  const shaftRef = useRef();
  
  useFrame((_, delta) => {
    if (shaftRef.current) {
      shaftRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
    }
  });

  return (
    <group>
      {/* Main Nacelle Housing */}
      <mesh>
        <boxGeometry args={[3, 2.5, 8]} />
        <meshStandardMaterial color="#F5F5F5" metalness={0.3} roughness={0.4} />
      </mesh>
      
      {/* Nacelle Front (Rotor Side) */}
      <mesh position={[0, 0, 4.2]}>
        <cylinderGeometry args={[1.3, 1.3, 0.4, 16]} />
        <meshStandardMaterial color="#E0E0E0" metalness={0.4} roughness={0.3} />
      </mesh>
      
      {/* Direction Indicator Arrow - PROMINENT */}
      <mesh position={[0, 3.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.4, 2, 8]} />
        <meshStandardMaterial 
          color="#FF4444" 
          emissive="#FF0000" 
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Rotating Shaft (visible through transparent section) */}
      <mesh 
        ref={shaftRef}
        position={[0, 0, 2]}
        onPointerOver={() => setHoveredComponent('Main Shaft')}
        onPointerOut={() => setHoveredComponent(null)}
      >
        <cylinderGeometry args={[0.15, 0.15, 6, 16]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Gearbox */}
      <mesh 
        position={[0, -0.5, 0]}
        onPointerOver={() => setHoveredComponent('Gearbox')}
        onPointerOut={() => setHoveredComponent(null)}
      >
        <boxGeometry args={[1.5, 1.5, 2]} />
        <meshStandardMaterial color="#CC6666" metalness={0.2} roughness={0.6} />
      </mesh>
      
      {/* Generator */}
      <mesh 
        position={[0, -0.5, -2.5]}
        rotation={[Math.PI/2, 0, 0]}
        onPointerOver={() => setHoveredComponent('Generator')}
        onPointerOut={() => setHoveredComponent(null)}
      >
        <cylinderGeometry args={[0.8, 0.8, 1.5, 16]} />
        <meshStandardMaterial color="#4488CC" metalness={0.5} roughness={0.3} />
      </mesh>
      
      {/* Anemometer */}
      <group position={[1.8, 1.5, -2]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        {/* Anemometer cups */}
        {[0, 90, 180, 270].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle * Math.PI / 180) * 0.2,
              0.25,
              Math.sin(angle * Math.PI / 180) * 0.2
            ]}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
        ))}
      </group>
      
      {/* Wind Vane */}
      <group position={[-1.8, 1.5, -2]}>
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.4, 8]} />
          <meshStandardMaterial color="#666666" />
        </mesh>
        <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, Math.PI/2]}>
          <coneGeometry args={[0.05, 0.2, 8]} />
          <meshStandardMaterial color="#FF6600" />
        </mesh>
      </group>
      
      {/* Aviation Warning Light */}
      <mesh position={[0, 1.8, -3.5]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial 
          color="#FF0000" 
          emissive="#FF0000" 
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Component Label */}
      {hoveredComponent && (
        <Html position={[0, 4, 0]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}>
            {hoveredComponent}
          </div>
        </Html>
      )}
      
      {/* SCADA Data Display */}
      {showSCADA && (
        <Html position={[0, 4.5, 0]} center>
          <div style={{
            background: 'rgba(0, 50, 100, 0.9)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontFamily: 'monospace',
            border: '1px solid #4A90E2'
          }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px' }}>
              SCADA LIVE
            </div>
            <div>Nacelle: {nacellePosition?.toFixed(1)}°</div>
            <div>RPM: {rpm?.toFixed(1)}</div>
            <div>Status: Active</div>
          </div>
        </Html>
      )}
    </group>
  );
};

// Professional Rotor with Visible Pitch Indicators
const ProfessionalRotor = ({ rpm, pitch, diameter = 30 }) => {
  const rotorRef = useRef();
  const bladesRef = useRef([]);
  const [hoveredBlade, setHoveredBlade] = useState(null);
  
  const bladeGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const radius = diameter / 2;
    
    shape.moveTo(0, 0.8);
    shape.quadraticCurveTo(0.3, radius * 0.3, 0.2, radius * 0.7);
    shape.quadraticCurveTo(0.1, radius * 0.9, 0.05, radius);
    shape.lineTo(-0.05, radius);
    shape.quadraticCurveTo(-0.1, radius * 0.9, -0.2, radius * 0.7);
    shape.quadraticCurveTo(-0.3, radius * 0.3, 0, 0.8);
    
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.02,
      bevelSegments: 3
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [diameter]);

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
    }
    
    // Update blade pitch
    bladesRef.current.forEach((blade) => {
      if (blade) {
        blade.rotation.y = pitch;
      }
    });
  });

  const pitchColor = Math.abs(pitch * 180 / Math.PI) > 15 ? '#FF6B6B' : '#4ECDC4';

  return (
    <group ref={rotorRef}>
      {/* Hub */}
      <mesh>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#DDDDDD" metalness={0.6} roughness={0.2} />
      </mesh>
      
      {/* Nose Cone */}
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI/2, 0, 0]}>
        <coneGeometry args={[0.8, 2, 12]} />
        <meshStandardMaterial color="#F0F0F0" metalness={0.4} roughness={0.3} />
      </mesh>
      
      {/* Blades */}
      {[0, 120, 240].map((angle, i) => (
        <group key={i} rotation={[0, 0, angle * Math.PI / 180]}>
          <mesh
            ref={(ref) => bladesRef.current[i] = ref}
            position={[0, diameter/2 - 1, 0]}
            rotation={[Math.PI/2, 0, Math.PI/2]}
            geometry={bladeGeometry}
            onPointerOver={() => setHoveredBlade(i)}
            onPointerOut={() => setHoveredBlade(null)}
          >
            <meshStandardMaterial 
              color={hoveredBlade === i ? '#E8E8E8' : '#F5F5F5'} 
              metalness={0.1} 
              roughness={0.6}
            />
          </mesh>
          
          {/* Pitch Indicator */}
          <mesh position={[0, 2, 0]}>
            <boxGeometry args={[0.1, 0.5, 0.1]} />
            <meshStandardMaterial 
              color={pitchColor}
              emissive={pitchColor}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}
      
      {/* Pitch Angle Display */}
      {hoveredBlade !== null && (
        <Html position={[0, 0, 3]} center>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            Blade {hoveredBlade + 1} - Pitch: {(pitch * 180 / Math.PI).toFixed(1)}°
          </div>
        </Html>
      )}
    </group>
  );
};

// Ground Reference System
const GroundCompass = ({ nacelleDirection }) => {
  return (
    <group position={[0, 0.1, 0]}>
      {/* Compass Rose */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[12, 14, 32]} />
        <meshStandardMaterial color="#FFFFFF" opacity={0.6} transparent />
      </mesh>
      
      {/* Direction markers */}
      <mesh rotation={[-Math.PI/2, 0, 0]}>
        <ringGeometry args={[11, 12, 4, 1, 0]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Nacelle Direction Pointer */}
      <group rotation={[0, nacelleDirection * Math.PI / 180, 0]}>
        <mesh position={[0, 0.3, 13]}>
          <boxGeometry args={[0.8, 0.6, 6]} />
          <meshStandardMaterial 
            color="#FF4444" 
            emissive="#FF0000" 
            emissiveIntensity={0.3}
          />
        </mesh>
        
        {/* Arrow tip */}
        <mesh position={[0, 0.3, 16.5]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.6, 1.5, 8]} />
          <meshStandardMaterial 
            color="#FF4444"
            emissive="#FF0000"
            emissiveIntensity={0.3}
          />
        </mesh>
      </group>
      
      {/* Cardinal Directions */}
      <Text position={[0, 0.5, 16]} fontSize={2} color="#000000" fontWeight="bold">N</Text>
      <Text position={[16, 0.5, 0]} fontSize={2} color="#000000" fontWeight="bold">E</Text>
      <Text position={[0, 0.5, -16]} fontSize={2} color="#000000" fontWeight="bold">S</Text>
      <Text position={[-16, 0.5, 0]} fontSize={2} color="#000000" fontWeight="bold">W</Text>
      
      {/* Degree markings */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <Text 
          key={deg}
          position={[
            Math.sin(deg * Math.PI / 180) * 10,
            0.5,
            Math.cos(deg * Math.PI / 180) * 10
          ]}
          fontSize={0.8}
          color="#666666"
        >
          {deg}°
        </Text>
      ))}
    </group>
  );
};

// Main Professional Wind Turbine Component
export default function ProfessionalWindTurbine({ 
  rpm = 10, 
  pitch = 0, 
  nacellePosition = 0,
  scadaData 
}: ProfessionalWindTurbineProps) {
  const nacelleGroupRef = useRef();
  
  // Use SCADA data if available
  const actualRpm = scadaData?.rotor_rpm || rpm;
  const actualPitch = scadaData?.pitch_angle ? (scadaData.pitch_angle * Math.PI / 180) : pitch;
  const actualNacellePos = scadaData?.nacelle_position || nacellePosition;
  
  useFrame(() => {
    if (nacelleGroupRef.current) {
      // Smooth nacelle rotation based on SCADA position
      const targetRotation = actualNacellePos * Math.PI / 180;
      nacelleGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        nacelleGroupRef.current.rotation.y,
        targetRotation,
        0.02
      );
    }
  });

  return (
    <group>
      {/* Professional Tower */}
      <ProfessionalTower />
      
      {/* Nacelle Assembly */}
      <group ref={nacelleGroupRef} position={[0, 35, 0]}>
        <ProfessionalNacelle 
          rpm={actualRpm}
          nacellePosition={actualNacellePos}
          showSCADA={!!scadaData}
        />
        
        {/* Rotor Assembly */}
        <group position={[0, 0, 5]}>
          <ProfessionalRotor
            rpm={actualRpm}
            pitch={actualPitch}
            diameter={30}
          />
        </group>
      </group>
      
      {/* Ground Reference System */}
      <GroundCompass nacellePosition={actualNacellePos} />
      
      {/* Performance Indicators */}
      <Html position={[-20, 20, 0]} center>
        <div style={{
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '14px',
          fontFamily: 'Arial, sans-serif',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#4A90E2' }}>
            TURBINE PARAMETERS
          </div>
          <div style={{ marginBottom: '4px' }}>
            RPM: <span style={{ color: '#4ECDC4' }}>{actualRpm.toFixed(1)}</span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            Pitch: <span style={{ color: '#FFD93D' }}>{(actualPitch * 180 / Math.PI).toFixed(1)}°</span>
          </div>
          <div style={{ marginBottom: '4px' }}>
            Nacelle Pos: <span style={{ color: '#FF6B6B' }}>{actualNacellePos.toFixed(1)}°</span>
          </div>
          {scadaData && (
            <div style={{ fontSize: '10px', color: '#CCCCCC', marginTop: '8px' }}>
              SCADA: {new Date(scadaData.timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}