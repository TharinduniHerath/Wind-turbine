// src/components/WindTurbine.js
import React from "react";
import WindmillTower from "./WindmillTower";
import WindmillNacelle from "./WindmillNacelle";
import WindmillRotor from "./WindmillRotor";

export default function WindTurbine({ rpm, pitch, windDirection ,windSpeed}) {
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

     <WindmillNacelle position={[0, 12.5, -0.5]}  rpm={rpm}  windSpeed={windSpeed}  windDirection={windDirection}showInternals={true} />

    </group>
  );
}
