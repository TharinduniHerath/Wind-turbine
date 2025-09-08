// src/components/WindTurbine.tsx
import WindmillTower from "./WindmillTower";
import WindmillNacelle from "./WindmillNacelle";
import WindmillRotor from "./WindmillRotor";

interface WindTurbineProps {
  rpm?: number;
  pitch?: number;
  hideLabels?: boolean;
}

export default function WindTurbine({ rpm = 10, pitch = Math.PI / 8, hideLabels = false }: WindTurbineProps) {
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
        hideLabels={hideLabels}
      />

     <WindmillNacelle position={[0, 12.5, -0.5]} rpm={rpm} showInternals={true} hideLabels={hideLabels} />

    </group>
  );
}
