import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';
import { createDistribution } from '../../../util/probability';
import { Html, Line, OrthographicCamera } from '@react-three/drei';
import { useMemo } from 'react';

const xSpread = 9;

type ReferenceScopeProps = {
  startAtZero?: boolean;
  minVal?: number;
  maxVal?: number;
};

const ReferenceScope = ({ startAtZero, minVal, maxVal }: ReferenceScopeProps) => {
  const yLocation = startAtZero ? -xSpread : 0;
  return (
    <>
    // Coord System
      <Line points={[new Vector3(-xSpread, 0, 0), new Vector3(xSpread, 0, 0)]} color="red" lineWidth={1} />
      <Line points={[new Vector3(yLocation, 0, 0), new Vector3(yLocation, 10, 0)]} color="blue" lineWidth={1} />

      // Labels
      {minVal !== undefined && maxVal !== undefined && (
        <>
          {!startAtZero && (
            <Html position={[yLocation, -0.3, 0]} center>
              <div style={{ color: 'violet' }}>avg:{parseFloat(((minVal + maxVal) / 2).toFixed(2))}</div>
            </Html>
          )}
          <Html position={[xSpread - 1, -0.3, 0]} center>
            <div style={{ color: 'violet' }}>max:{parseFloat(maxVal.toFixed(2))}</div>
          </Html>
          <Html position={[-xSpread + 1, -0.3, 0]} center>
            <div style={{ color: 'violet' }}>min:{parseFloat(minVal.toFixed(2))}</div>
          </Html>
        </>
      )}
    </>
  );
}

type LineGraphProps = {
  data: number[][];
  startAtZero?: boolean;
};


const LineGraph = ({ data, startAtZero }: LineGraphProps) => {
  const highestY = Math.max(...data.map(([, y]) => y));
  const offset = startAtZero ? -xSpread : 0;
  const mult = startAtZero ? 2 : 1;
  const points = data.map(([x, y]) => new Vector3(mult * xSpread * x + offset, y / highestY, 0));

  return (
    <>
      {points.slice(0, points.length - 1).map((point, index) => (
        <Line key={index} points={[point, points[index + 1]]} color="white" lineWidth={1} />
      ))}
    </>
  );
};

type DistributionVizProps = {
  concentration: number;
  startAtZero?: boolean;
  minVal?: number;
  maxVal?: number;
};

const DistributionViz = ({ concentration, minVal, maxVal, startAtZero = false }: DistributionVizProps) => {

  const values = useMemo(() => {
    const length = startAtZero ? 100 : 200;
    const dist = createDistribution(concentration);
    const samplePoints = Array.from({ length }, (_, i) => startAtZero ? i / 100 : (i - 100) / 100);
    return samplePoints.map(i => [i, dist(i)]);
  }, [concentration, startAtZero]);

  return (
    <Canvas className='bg-black' style={{ width: '100%', height: '50px' }}>
      <OrthographicCamera makeDefault position={[0, 0.5, 10]} zoom={20} />
      <LineGraph data={values} startAtZero={startAtZero} />
      <ReferenceScope startAtZero={startAtZero} minVal={minVal} maxVal={maxVal} />
    </Canvas>
  );
}

export default DistributionViz;