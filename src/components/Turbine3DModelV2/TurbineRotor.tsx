
import React, { useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import WindmillRotor from "./WindmillRotor";

export default function TurbineRotor({ rpm = 10, pitch = Math.PI / 8 }) {
  const { scene } = useThree();
  const rotorRef = useRef();

  useEffect(() => {
    const rotor = new WindmillRotor();
    rotorRef.current = rotor;
    rotor.setBladesAngle(pitch);
    scene.add(rotor);

    return () => {
      scene.remove(rotor);
    };
  }, [scene]);

  useFrame((_, delta) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
      rotorRef.current.setBladesAngle(pitch);
    }
  });

  return null; // no JSX output, purely side effects on scene
}
