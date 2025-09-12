import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import WindmillTower from "./WindmillTower";
import WindmillNacelle from "./WindmillNacelle";
import WindmillRotor from "./WindmillRotor";

interface WindTurbineProps {
  rpm?: number;
  pitch?: number;
  nacelleposition?: number;
}

export default function WindTurbine({ 
  rpm = 10, 
  pitch = Math.PI / 8, 
  nacelleposition = 0 
}: WindTurbineProps) {
  const nacelleGroupRef = useRef<THREE.Group>(null);
  const currentYaw = useRef(0);
  const targetYaw = useRef(0);
  
  // Convert nacelle position to target yaw
  useEffect(() => {
    targetYaw.current = THREE.MathUtils.degToRad(nacelleposition);
  }, [nacelleposition]);

  // Smooth yaw rotation animation
  useFrame((_, delta) => {
    if (!nacelleGroupRef.current) return;

    const yawSpeed = 0.5; // radians per second
    const yawDifference = targetYaw.current - currentYaw.current;
    
    // Handle angle wrapping
    let adjustedDifference = yawDifference;
    if (Math.abs(yawDifference) > Math.PI) {
      if (yawDifference > 0) {
        adjustedDifference = yawDifference - 2 * Math.PI;
      } else {
        adjustedDifference = yawDifference + 2 * Math.PI;
      }
    }

    // Apply smooth rotation
    if (Math.abs(adjustedDifference) > 0.01) {
      const rotationStep = Math.sign(adjustedDifference) * Math.min(Math.abs(adjustedDifference), yawSpeed * delta);
      currentYaw.current += rotationStep;
      currentYaw.current = (currentYaw.current + 2 * Math.PI) % (2 * Math.PI);
      
      nacelleGroupRef.current.rotation.y = currentYaw.current;
    }
  });

  return (
    <group>
      {/* Tower positioned at origin */}
      <WindmillTower />

      {/* Nacelle and Rotor group that rotates together */}
      <group ref={nacelleGroupRef}>
        {/* Nacelle WITHOUT rotation prop (rotation handled by group) */}
        <WindmillNacelle 
          position={[0, 12.5, -0.5]}  
          rpm={rpm}    
          nacelleposition={nacelleposition} // For tooltip display only
          showInternals={true} 
        />

        {/* Rotor positioned relative to nacelle */}
        <WindmillRotor
          position={[0, 12.5, 1.2]}
          rpm={rpm}
          pitch={pitch}
        />
      </group>
    </group>
  );
}