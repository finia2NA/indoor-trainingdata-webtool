import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';
import { Html, Line } from '@react-three/drei';
import { useMemo } from 'react';

export type InfluenceDisplayProps = {
  fullInfluenceUntil: number;
  zeroInfluenceAt: number;
}

const InfluenceDisplay = ({ fullInfluenceUntil, zeroInfluenceAt }: InfluenceDisplayProps) => {
  // Create the influence falloff function data points
  const functionData = useMemo(() => {
    const points: Vector3[] = [];
    const minDistance = -0.5;
    const maxDistance = 20.5;
    const totalRange = maxDistance - minDistance;
    const numPoints = 100;
    
    for (let i = 0; i <= numPoints; i++) {
      const distance = minDistance + (i / numPoints) * totalRange;
      let influence: number;
      
      if (distance <= 0) {
        influence = 1.0; // Before distance 0, full influence
      } else if (distance <= fullInfluenceUntil) {
        influence = 1.0; // Full influence
      } else if (distance >= zeroInfluenceAt) {
        influence = 0.0; // Zero influence
      } else {
        // Linear falloff between fullInfluenceUntil and zeroInfluenceAt
        influence = 1.0 - (distance - fullInfluenceUntil) / (zeroInfluenceAt - fullInfluenceUntil);
      }
      
      // Scale for display: x = distance mapped to -9 to 9, y = influence mapped to 0 to 10
      const x = ((distance - minDistance) / totalRange) * 18 - 9;
      const y = influence * 10;
      points.push(new Vector3(x, y, 0));
    }
    
    return { points, minDistance, maxDistance, totalRange };
  }, [fullInfluenceUntil, zeroInfluenceAt]);

  return (
    <Canvas className='bg-black' style={{ width: '100px', height: '100px' }}>
      {/* Coordinate system */}
      <Line points={[new Vector3(-9, 0, 0), new Vector3(9, 0, 0)]} color="red" lineWidth={1} />
      <Line points={[new Vector3(-9, 0, 0), new Vector3(-9, 10, 0)]} color="blue" lineWidth={1} />
      
      {/* Influence function curve */}
      <Line points={functionData.points} color="white" lineWidth={2} />
      
      {/* X-axis distance labels */}
      <Html position={[-9, -1, 0]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          -0.5m
        </div>
      </Html>
      
      <Html position={[0, -1, 0]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          10m
        </div>
      </Html>
      
      <Html position={[9, -1, 0]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          20.5m
        </div>
      </Html>
      
      {/* Labels for critical points */}
      <Html position={[
        ((fullInfluenceUntil - functionData.minDistance) / functionData.totalRange) * 18 - 9, 
        11, 
        0
      ]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          {`${fullInfluenceUntil.toFixed(1)}m`}
        </div>
      </Html>
      
      <Html position={[
        ((zeroInfluenceAt - functionData.minDistance) / functionData.totalRange) * 18 - 9, 
        11, 
        0
      ]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          {`${zeroInfluenceAt.toFixed(1)}m`}
        </div>
      </Html>
      
      {/* Y-axis labels */}
      <Html position={[-10, 10, 0]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          1.0
        </div>
      </Html>
      
      <Html position={[-10, 0, 0]} center>
        <div style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          0.0
        </div>
      </Html>
      
      {/* Vertical lines at critical points */}
      <Line 
        points={[
          new Vector3(((fullInfluenceUntil - functionData.minDistance) / functionData.totalRange) * 18 - 9, 0, 0),
          new Vector3(((fullInfluenceUntil - functionData.minDistance) / functionData.totalRange) * 18 - 9, 10, 0)
        ]} 
        color="violet" 
        lineWidth={1} 
        opacity={0.5}
      />
      
      <Line 
        points={[
          new Vector3(((zeroInfluenceAt - functionData.minDistance) / functionData.totalRange) * 18 - 9, 0, 0),
          new Vector3(((zeroInfluenceAt - functionData.minDistance) / functionData.totalRange) * 18 - 9, 10, 0)
        ]} 
        color="violet" 
        lineWidth={1} 
        opacity={0.5}
      />
    </Canvas>
  )
}

export default InfluenceDisplay;