// src/components/WindmillRotor.tsx
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { Html } from "@react-three/drei";

// --- CLASS: Pure Three.js rotor mesh ---
class WindmillRotorMesh extends THREE.Mesh {
  blades: THREE.Mesh[];

  constructor(mainRadius = 7, bladeAmount = 3, bulbRadius = 0.5) {
    super(
      mergeGeometries([
        new THREE.LatheGeometry(
          new THREE.Path()
            .moveTo(bulbRadius, 0)
            .lineTo(bulbRadius, 0)
            .absarc(0, 1, bulbRadius, 0, Math.PI * 0.5)
            .getPoints(50),
          72
        ).rotateX(Math.PI * 0.5),
        new THREE.CircleGeometry(bulbRadius, 72).rotateX(Math.PI),
      ]).translate(0, 0, -0.5),
      new THREE.MeshLambertMaterial({ color: 0xeeeeee })
    );

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

    // Assign names for hover
    this.userData.name = "Rotor Hub";
  }

  setBladesAngle(angle: number) {
    this.blades.forEach((b) => (b.rotation.y = angle));
  }
}

interface WindmillRotorProps {
  rpm?: number;
  pitch?: number;
  position?: [number, number, number];
}

// --- FUNCTIONAL COMPONENT ---
export default function WindmillRotor({ rpm = 10, pitch = Math.PI / 8, position = [0, 10, 1.2] }: WindmillRotorProps) {
  const rotorRef = useRef<WindmillRotorMesh>();
  const { scene, camera, gl } = useThree();

  const [hoveredObj, setHoveredObj] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    const rotor = new WindmillRotorMesh();
    rotor.position.set(...position);
    rotor.setBladesAngle(pitch);

    rotorRef.current = rotor;
    scene.add(rotor);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = gl.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(rotor, true);
      if (intersects.length > 0) {
        setHoveredObj(intersects[0].object);
      } else {
        setHoveredObj(null);
      }
    };

    gl.domElement.addEventListener("pointermove", handlePointerMove);

    return () => {
      gl.domElement.removeEventListener("pointermove", handlePointerMove);
      scene.remove(rotor);
    };
  }, [scene, camera, gl, position, pitch]);

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
      rotorRef.current.setBladesAngle(pitch);
    }
  });

  return (
    <>
      {hoveredObj && (
        <Html
          position={hoveredObj.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.5, 0))}
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
            {hoveredObj.userData.name}
          </div>
        </Html>
      )}
    </>
  );
}
