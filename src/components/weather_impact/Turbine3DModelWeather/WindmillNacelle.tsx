import React, { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Html } from "@react-three/drei";

export default function WindmillNacelle({ rpm, nacelleposition, showInternals = true, position = [0, 0, 0] }) {
  const shaftRef = useRef();
  const lightRef = useRef();
  const lightMeshRef = useRef();
  const anemometerRef = useRef();

  const [hoveredPart, setHoveredPart] = useState(null);

  const nacelleMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.4,
      }),
    []
  );

  const nacelleGeometry = useMemo(() => {
    const mainBody = new THREE.BoxGeometry(1, 1, 2.5);
    const roundedFront = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
    roundedFront.rotateX(Math.PI / 2);
    roundedFront.translate(0, 0, 0.75);
    return mergeGeometries([mainBody, roundedFront]);
  }, []);

  const shaftGeometry = useMemo(() => {
    const geo = new THREE.CylinderGeometry(0.05, 0.05, 3.4, 64, 1, true);
    geo.rotateX(Math.PI / 2);
    return geo;
  }, []);

  const shaftTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");

    const stripeWidth = 55;
    for (let i = 0; i < canvas.width / stripeWidth; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#000000ff" : "#fefefcff";
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(20, 1);
    return texture;
  }, []);

  // SINGLE useFrame hook - handles shaft, lighting, and anemometer
  useFrame(({ clock }, delta) => {
    if (shaftRef.current) {
      shaftRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
    }

    const t = clock.getElapsedTime();
    const intensity = Math.sin(t * 4) > 0 ? 1 : 0;
    if (lightRef.current) lightRef.current.intensity = intensity * 2;
    if (lightMeshRef.current)
      lightMeshRef.current.material.emissiveIntensity = intensity * 2;

    // Simple anemometer rotation
    if (anemometerRef.current) {
      anemometerRef.current.rotation.y += delta * 4;
    }
  });

  const handleHover = (name, object) => {
    setHoveredPart({ name, object });
  };

  return (
    <group position={position}>
      {/* Nacelle */}
      <mesh
        geometry={nacelleGeometry} 
        material={nacelleMaterial} 
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover(`Nacelle Position: ${nacelleposition?.toFixed(1) || 0}°`, e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      />

      {/* Rotor Shaft */}
      <mesh
        ref={shaftRef}
        position={[0, 0, 1]}
        geometry={shaftGeometry}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover(`Rotor Shaft: ${rpm?.toFixed(1) || 0} RPM`, e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <meshStandardMaterial
          map={shaftTexture}
          metalness={0.3}
          roughness={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Gearbox */}
      <mesh
        position={[0, 0, 0.25]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Gearbox", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[0.4, 0.4, 0.6]} />
        <meshStandardMaterial color="#ff6666" />
      </mesh>

      {/* Generator */}
      <mesh
        position={[0, 0, -0.8]}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Generator", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <cylinderGeometry args={[0.3, 0.3, 0.5, 32]} />
        <meshStandardMaterial color="#0066cc" />
      </mesh>

      {/* Bearings */}
      <mesh
        position={[0, 0, 1]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Main Shaft Bearings", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <torusGeometry args={[0.07, 0.015, 16, 100]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* Cooler */}
      <mesh
        position={[0, 0, -1.2]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Cooler", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[0.8, 0.8, 0.1]} />
        <meshStandardMaterial color="#00cc99" />
      </mesh>

      {/* Controller */}
      <mesh
        position={[0.45, 0, 0.25]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Controller", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <boxGeometry args={[0.1, 0.3, 0.5]} />
        <meshStandardMaterial color="#ffaa00" />
      </mesh>

      {/* Danger Light */}
      <group
        position={[0, 0.6, -1.2]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Danger Light", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.2]} />
          <meshStandardMaterial color="gray" />
        </mesh>
        <mesh ref={lightMeshRef} position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial
            color="red"
            emissive="red"
            emissiveIntensity={1}
          />
        </mesh>
        <pointLight
          ref={lightRef}
          position={[0, 0.2, 0]}
          color="red"
          distance={3}
        />
      </group>

      {/* Anemometer */}
      <group
        ref={anemometerRef}
        position={[0.3, 0.6, -0.8]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Anemometer", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        {/* Vertical shaft */}
        <mesh>
          <cylinderGeometry args={[0.01, 0.01, 0.2, 12]} />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* Horizontal crossbar 1 */}
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 0.10, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.3, 12]} />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* Horizontal crossbar 2 (perpendicular to first) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.10, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.3, 12]} />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* Cups */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 0.15, // x
              0.1,                     // y
              Math.sin(angle) * 0.15,  // z
            ]}
          >
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="black" />
          </mesh>
        ))}
      </group>

            {/* Wind Vane - CORRECTED with proper orientation */}
      <group
        position={[-0.4, 0.8, -0.8]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover(`Wind Vane (${nacelleposition?.toFixed(0) || 0}°)`, e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        {/* Pole */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.3]} />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* Crossbar - horizontal shaft */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, 0.3]} />
          <meshStandardMaterial color="gray" />
        </mesh>

        {/* Arrow head - pointing toward +Z (forward from nacelle) */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.15]}>
          <coneGeometry args={[0.03, 0.08, 12]} />
          <meshStandardMaterial color="red" />
        </mesh>

        {/* Tail fin - at the back */}
        <mesh rotation={[0, 0, 0]} position={[0, 0, -0.15]}>
          <boxGeometry args={[0.15, 0.03, 0.005]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </group>

      {/* Brake System */}
      <mesh
        position={[0, 0, -0.3]}
        name="Brake System"
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Brake System", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <torusGeometry args={[0.1, 0.05, 16, 100]} />
        <meshStandardMaterial color="#333333" />
      </mesh>

      {/* Lightning Protection */}
      <group
        position={[0, 0.9, -1.2]}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleHover("Lightning Rod", e.object);
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <mesh position={[0, 0.001, 0.9]}>
          <cylinderGeometry args={[0.005, 0.02, 0.8]} />
          <meshStandardMaterial color="silver" />
        </mesh>
      </group>

      {/* Hover Label */}
      {hoveredPart && hoveredPart.object && (
        <Html
          position={hoveredPart.object
            .getWorldPosition(new THREE.Vector3())
            .add(new THREE.Vector3(0, -10, 0))}
          center
          sprite
        >
          <div
            style={{
              color: "white",
              fontWeight: "bold",
              background: "rgba(0,0,0,0.6)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "10px",
              whiteSpace: "nowrap",
            }}
          >
            {hoveredPart.name}
          </div>
        </Html>
      )}
    </group>
  );
}