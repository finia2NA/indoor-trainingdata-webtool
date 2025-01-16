import React from 'react';
import usePolygonCreatorStore from "../../hooks/usePolygonCreatorStore.ts";

const PolygonCreator: React.FC = () => {

  const {height} = usePolygonCreatorStore((state) => state);

  return (
    <mesh rotation={[Math.PI/2, 0, 0]} position={[0, height, 0]}>
      <planeGeometry args={[5, 5]} />
      <meshStandardMaterial color="lightblue" depthTest={false} />
    </mesh>
  );
};

export default PolygonCreator;