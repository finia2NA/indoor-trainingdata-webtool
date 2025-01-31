import { Sphere, Line, Html } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Vector3 } from 'three';

export type AngleDisplayProps = {
  minAngle: number,
  maxAngle: number,
}

const AngleLines = ({ radius }: { radius: number }) => {
  const angles = [
    { angle: 0, color: "red" },
    { angle: 45, color: "green" },
    { angle: 90, color: "blue" },
  ].map(el => {
    return [
      { angle: -el.angle, color: el.color },
      { angle: el.angle, color: el.color }];
  }).flat();

  const lines = angles.map((el) => {
    const angleInRad = el.angle * Math.PI / 180;
    const start = new Vector3(0, 0, 0);
    const end = new Vector3(0, radius, 0);
    end.applyAxisAngle(new Vector3(0, 0, 1), angleInRad + Math.PI * (6 / 4));
    return ({
      start: start,
      end: end,
      color: el.color
    });
  });

  return (
    <>
      {lines.map((el, index) => (
        <Line key={index} points={[el.start, el.end]} color={el.color} lineWidth={1} />
      ))}
    </>
  )
}

const AngleLabels = ({ radius, minInRad, maxInRad }: { radius: number, minInRad: number, maxInRad: number }) => {
  const minDisplay = Math.round(minInRad * 180 / Math.PI);
  const minPosition = new Vector3(0, radius, 0);
  minPosition.applyAxisAngle(new Vector3(0, 0, 1), minInRad + Math.PI * (6 / 4));

  const maxDisplay = Math.round(maxInRad * 180 / Math.PI);
  const maxPosition = new Vector3(0, radius, 0);
  maxPosition.applyAxisAngle(new Vector3(0, 0, 1), maxInRad + Math.PI * (6 / 4));
  maxPosition.y += 1.4;


  return (

    <>
      <mesh position={minPosition}>
        <Html style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          {`${minDisplay}°`}
        </Html>
      </mesh>
      <mesh position={maxPosition}>
        <Html style={{ color: 'violet', fontSize: '0.7rem', fontWeight: 'bold' }}>
          {`${maxDisplay}°`}
        </Html>
      </mesh>
    </>
  )

}

const AngleDisplay = ({ minAngle, maxAngle }: AngleDisplayProps) => {
  const minInRad = minAngle * Math.PI / 180;
  const maxInRad = maxAngle * Math.PI / 180;
  const spread = maxInRad - minInRad;

  return (
    <Canvas className='bg-black' style={{ width: '100px', height: '100px' }}>
      <AngleLines radius={4} />
      <AngleLabels radius={2} minInRad={minInRad} maxInRad={maxInRad} />
      <Sphere
        rotation={[Math.PI / 2, 0, 0]}
        args={[
          2.5, // radius — sphere radius. Default is 1.
          32, // widthSegments — number of horizontal segments. Minimum value is 3, and the default is 32.
          2, // heightSegments — number of vertical segments. Minimum value is 2, and the default is 16.
          minInRad + Math.PI, // phiStart — specify horizontal starting angle. Default is 0.
          spread, // phiLength — specify horizontal sweep angle size. Default is Math.PI * 2.
          0, // thetaStart — specify vertical starting angle. Default is 0.
          Math.PI / 2 // thetaLength — specify vertical sweep angle size. Default is Math.PI.
        ]}
        position={[0, 0, 0]}
      />
    </Canvas>
  )
}

export default AngleDisplay;