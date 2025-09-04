import React, { useMemo, useState } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";

export default function WindmillTower() {
  const [hovered, setHovered] = useState(false);

  // Tower geometry/material
  const towerGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.4, 0.85, 12, 32),
    []
  );
  const towerMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: 0x888888 }),
    []
  );

  // Grass blades data
  const grassBlades = useMemo(() => {
    const blades = [];
    const density = 1000; // number of blades
    const width = 50;
    const depth = 50;

    for (let i = 0; i < density; i++) {
      const x = (Math.random() - 0.5) * width;
      const z = (Math.random() - 0.5) * depth;
      const height =0.5 + Math.random() * 0.5; // blade height
      const rotationY = Math.random() * Math.PI;
      blades.push({ x, z, height, rotationY });
    }

    return blades;
  }, []);

  return (
    <>
      {/* Tower */}
      <mesh
        geometry={towerGeometry}
        material={towerMaterial}
        position={[0, 6, 0]} // tower height / 2
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {hovered && (
          <Html position={[0, 6, 0]} center>
            <div
              style={{
                color: "black",
                fontWeight: "bold",
                background: "rgba(255, 255, 255, 0.6)",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: "10px",
              }}
            >
              Tower
            </div>
          </Html>
        )}
      </mesh>

      {/* Grass / Ground */}
      {grassBlades.map((blade, index) => (
        <mesh
          key={index}
          position={[blade.x, blade.height / 2, blade.z]}
          rotation={[0, blade.rotationY, 0]}
        >
          <planeGeometry args={[0.05, blade.height]} />
          <meshStandardMaterial color="green" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Optional: base plane for shadow */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={new THREE.PlaneGeometry(50, 50)}
        material={new THREE.MeshStandardMaterial({ color: 0x228B22 })}
      />
    </>
  );
}

