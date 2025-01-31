import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';
import { createDistribution } from '../../../util/probability';
import { Line, OrthographicCamera } from '@react-three/drei';
import { useMemo } from 'react';

const LineGraph = ({ data }: { data: number[][] }) => {
  const highestY = Math.max(...data.map(([_, y]) => y));
  const points = data.map(([x, y]) => new Vector3(10 * x, y / highestY, 0));

  // TODO: fix the line going on infinitely on the right but not on the left
  return (
    <>
      {points.map((point, index) => (
        <Line key={index} points={[point, points[index + 1] || point]} color="white" lineWidth={1} />
      ))}
    </>
  );
};

const CoordinateSystem = () => {
  return (
    <>
      <Line points={[new Vector3(-10, 0, 0), new Vector3(10, 0, 0)]} color="red" lineWidth={1} />
      <Line points={[new Vector3(0, 0, 0), new Vector3(0, 10, 0)]} color="blue" lineWidth={1} />
    </>
  );
}

const DistributionViz = ({ concentration }: { concentration: number }) => {

  const values = useMemo(() => {
    const dist = createDistribution(concentration);
    const samplePoints = Array.from({ length: 200 }, (_, i) => (i - 50) / 50);
    return samplePoints.map(i => [i, dist(i)]);
  }, [concentration]);

  return (
    <Canvas className='bg-black' style={{ width: '100%', height: '50px' }}>
      <OrthographicCamera makeDefault position={[0, 0.5, 10]} zoom={20} />
      <LineGraph data={values} />
      <CoordinateSystem />
    </Canvas>
  );
}

export default DistributionViz;