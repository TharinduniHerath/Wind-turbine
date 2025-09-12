import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Html } from "@react-three/drei";

// WindmillRotorMesh class - same as before
class WindmillRotorMesh extends THREE.Group {
  blades: THREE.Mesh[];

  constructor(mainRadius = 7, bladeAmount = 3, bulbRadius = 0.5) {
    super();

    // Create bulb geometry
    const latheGeometry = new THREE.LatheGeometry(
      new THREE.Path()
        .moveTo(bulbRadius, 0)
        .lineTo(bulbRadius, 0)
        .absarc(0, 1, bulbRadius, 0, Math.PI * 0.5)
        .getPoints(50),
      72
    ).rotateX(Math.PI * 0.5);

    const circleGeometry = new THREE.CircleGeometry(bulbRadius, 72).rotateX(Math.PI);

    const mergedGeometry = mergeGeometries([latheGeometry, circleGeometry]).translate(0, 0, -0.5);

    const bulbMaterial = new THREE.MeshLambertMaterial({ color: 0xeeeeee });
    const bulbMesh = new THREE.Mesh(mergedGeometry, bulbMaterial);
    bulbMesh.userData.name = "Rotor Hub";
    this.add(bulbMesh);

    // Create blades
    const bladeThickness = 0.055;
    const bladeShape = new THREE.Shape()
      .moveTo(0, bulbRadius)
      .splineThru(
        [
          [0, mainRadius],
          [0.1, mainRadius],
          [0.5, bulbRadius + 1],
          [0.1, bulbRadius],
        ].map((p) => new THREE.Vector2(...p))
      );

    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      steps: 1,
      depth: 0.001,
      bevelEnabled: true,
      bevelThickness: bladeThickness,
      bevelSize: bladeThickness,
    })
      .translate(0, 0, -bladeThickness)
      .rotateY(Math.PI * 0.5);

    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });

    this.blades = Array.from({ length: bladeAmount }, (_, i) => {
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.z = (i * 2 * Math.PI) / bladeAmount;
      blade.rotation.order = "ZYX";
      blade.userData.name = "Blade";
      this.add(blade);
      return blade;
    });

    this.setBladesAngle(Math.PI * 0.25);
  }

  setBladesAngle(angle) {
    this.blades.forEach((b) => (b.rotation.y = angle));
  }
}

// FIXED: Proper React component approach
export default function WindmillRotor({ rpm = 10, pitch = Math.PI / 8, position = [0, 10, 1.2] }) {
  const rotorRef = useRef();
  const [hoveredObj, setHoveredObj] = useState(null);
  
  // Convert pitch from radians to degrees for display
  const pitchDegrees = (pitch * 180 / Math.PI).toFixed(1);

  // Create the rotor mesh once
  useEffect(() => {
    const rotor = new WindmillRotorMesh();
    rotorRef.current = rotor;
  }, []);

  // Update pitch when it changes
  useEffect(() => {
    if (rotorRef.current) {
      rotorRef.current.setBladesAngle(pitch);
    }
  }, [pitch]);

  // Animation loop
  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
      rotorRef.current.setBladesAngle(pitch);
    }
  });

  const handlePointerOver = (e, name) => {
    e.stopPropagation();
    setHoveredObj({ object: e.object, name });
  };

  const handlePointerOut = () => {
    setHoveredObj(null);
  };

  return (
    <group position={position}>
      {/* Use primitive to add the custom mesh */}
      <primitive 
        object={rotorRef.current || new WindmillRotorMesh()}
        onPointerOver={(e) => handlePointerOver(e, e.object.userData.name || "Rotor")}
        onPointerOut={handlePointerOut}
      />
      
      {/* Hover tooltip */}
      {hoveredObj && (
        <Html
          position={[0, 0.5, 0]} // Position relative to the group
          center
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
            {hoveredObj.name === "Blade" 
              ? `Blade Pitch: ${pitchDegrees}°` 
              : `${hoveredObj.name} | RPM: ${rpm?.toFixed(1) || 0}`
            }
          </div>
        </Html>
      )}
    </group>
  );
}