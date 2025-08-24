// // src/components/TurbineRotor.tsx
// import React, { useEffect, useRef } from "react";
// import { useThree, useFrame } from "@react-three/fiber";
// import WindmillRotor from "./WindmillRotor";

// interface TurbineRotorProps {
//   rpm?: number;
//   pitch?: number;
// }

// export default function TurbineRotor({
//   rpm = 10,
//   pitch = Math.PI / 8,
// }: TurbineRotorProps) {
//   const { scene } = useThree();
//   // Define type of rotorRef: WindmillRotor instance or null initially
//   const rotorRef = useRef<InstanceType<typeof WindmillRotor> | null>(null);

//   useEffect(() => {
//     // WindmillRotor is a class, create instance
//     const rotor = new WindmillRotor();
//     rotorRef.current = rotor;
//     rotor.setBladesAngle(pitch);
//     scene.add(rotor);

//     return () => {
//       if (rotorRef.current) {
//         scene.remove(rotorRef.current);
//         rotorRef.current = null;
//       }
//     };
//   }, [scene, pitch]);

//   useFrame((_, delta) => {
//     if (rotorRef.current) {
//       rotorRef.current.rotation.z += (rpm * 2 * Math.PI * delta) / 60;
//       rotorRef.current.setBladesAngle(pitch);
//     }
//   });

//   return null; // No JSX output
// }



// src/components/TurbineRotor.js
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
