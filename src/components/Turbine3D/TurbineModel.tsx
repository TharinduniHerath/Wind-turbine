import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface TurbineModelProps {
  rpm: number;
}

const TurbineModel: React.FC<TurbineModelProps> = ({ rpm }) => {
  const rotorRef = useRef<THREE.Group>(null!);
  const rpmRef = useRef<number>(rpm);

  useEffect(() => {
    rpmRef.current = rpm;
  }, [rpm]);

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += (rpmRef.current / 60) * 2 * Math.PI * delta;
    }
  });

  return (
    <group scale={[1, 1, 1]} position={[0, -8, 0]}>
      {/* Tower */}
      <mesh position={[0, 5, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 10, 16]} />
        <meshStandardMaterial color="gray" />
      </mesh>

      {/* Nacelle */}
      <mesh position={[0, 10, 0]}>
        <boxGeometry args={[0.5, 0.5, 1]} />
        <meshStandardMaterial color="darkgray" />
      </mesh>

      {/* Rotor with 3 blades */}
      <group ref={rotorRef} position={[0, 10, 0.7]}>
        {[...Array(3)].map((_, i) => (
          <group key={i} rotation={[0, 0, (i * 2 * Math.PI) / 3]}>
            {/* Blade body */}
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.05, 0.25, 5, 7]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {/* Red blade tip */}
            <mesh position={[0, 5, 0]}>
              <cylinderGeometry args={[0.03, 0.05, 2.5, 6]} />
              <meshStandardMaterial color="red" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

export default TurbineModel;
