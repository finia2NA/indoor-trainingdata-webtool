import React from 'react';

const PolygonSurface: React.FC = () => {
  return (
    <mesh rotation={[0, -Math.PI / 2, 0]}>
      <planeGeometry args={[5, 5]} />
      <meshStandardMaterial color="lightblue" />
    </mesh>
  );
};

export default PolygonSurface;