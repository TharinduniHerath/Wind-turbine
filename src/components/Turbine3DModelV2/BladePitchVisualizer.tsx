interface BladePitchVisualizerProps {
  pitch: number;
  style?: React.CSSProperties;
}

const BladePitchVisualizer: React.FC<BladePitchVisualizerProps> = ({ pitch, style }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        ...style,
      }}
    >
      <svg
        width="100"
        height="100"
        viewBox="0 0 100 100"
        style={{
          transformOrigin: '50% 50%',
          transition: 'transform 0.3s ease',
        }}
      >
       {/* X-axis */}
<line x1="0" y1="50" x2="98" y2="50" stroke="black" strokeWidth="3" markerEnd="url(#arrow)" />

{/* Y-axis pointing up */}
<line x1="50" y1="90" x2="50" y2="0" stroke="black" strokeWidth="3" markerEnd="url(#arrow)" />

        {/* Arrow marker definitions */}
        <defs>
          <marker
            id="arrow"
            markerWidth="4"
            markerHeight="4"
            refX="2"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 L0,4 L4,2 Z" fill="black" />
          </marker>
        </defs>

        {/* Blade */}
        <g
          style={{
            transform: `rotate(${pitch}deg)`,
            transformOrigin: '50% 50%',
            transition: 'transform 0.3s ease',
          }}
        >
          <path
            d="M0,50 C10,40 30,30 50,28 C70,27 90,35 90,50 C90,65 70,73 50,72 C30,70 10,60 0,50 Z"
            fill="red"
            stroke="black"
            strokeWidth="1"
          />
        </g>
      </svg>

      {/* Labels */}
      <span style={{ fontWeight: 'bold', color: 'black' }}>{pitch}°</span>
      <span style={{ fontSize: '12px', fontWeight: 'bold',color: 'black' }}>Pitch Angle</span>
    </div>
  );
};

export default BladePitchVisualizer;
