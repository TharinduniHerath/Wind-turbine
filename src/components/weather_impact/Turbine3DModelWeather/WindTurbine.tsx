// import React, { FC } from "react";
// import WindmillTower from "./WindmillTower";
// import WindmillNacelle from "./WindmillNacelle";
// import WindmillRotor from "./WindmillRotor";

// interface WindTurbineProps {
//   rpm?: number;
//   pitch?: number;
//   position?: [number, number, number];  // Added position prop
//    scale?: [number, number, number];
// }

// const WindTurbine: FC<WindTurbineProps> = ({
//   rpm = 10,
//   pitch = Math.PI / 8,
//   position = [0, 0, 0], // default position at origin
//    scale = [1, 1, 1],
// }) => {
//   return (
//     <group position={position} scale={scale}>
//       {/* Tower positioned at origin */}
//       <WindmillTower />

//       {/* Nacelle on top of tower, positioned at 10.5 on Y axis */}
//       <WindmillNacelle position={[0, 10.5, 0]} rpm={rpm} showInternals={true} />

//       {/* Rotor positioned relative to the nacelle */}
//       <WindmillRotor position={[0, 10.5, 1.2]} rpm={rpm} pitch={pitch} />
//     </group>
//   );
// };

// export default WindTurbine;


// src/components/WindTurbine.js
import React from "react";
import WindmillTower from "./WindmillTower";
import WindmillNacelle from "./WindmillNacelle";
import WindmillRotor from "./WindmillRotor";

export default function WindTurbine({ rpm, pitch, windDirection }) {
  return (
    <group>
      {/* Tower positioned at origin */}
      <WindmillTower />

      {/* Nacelle on top of tower */}
     

      {/* Rotor placed at the front of the nacelle */}
      <WindmillRotor
        position={[0, 12.5, 1.2]}
        rpm={rpm}
        pitch={pitch}
      />

     <WindmillNacelle position={[0, 12.5, -0.5]}  rpm={rpm}    windDirection={windDirection}showInternals={true} />

    </group>
  );
}
