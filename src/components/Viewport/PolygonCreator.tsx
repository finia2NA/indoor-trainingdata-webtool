import React, { useState } from 'react';
import usePolygonCreatorStore from "../../hooks/usePolygonCreatorStore.ts";
import { DoubleSide, Vector3 } from 'three';

const PolygonCreator: React.FC = () => {
  const { height } = usePolygonCreatorStore((state) => state);
  const [points, setPoints] = useState<Vector3[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    setIsDragging(false);
  };

  const handlePointerMove = () => {
    setIsDragging(true);
  };

  const handlePointerUp = (event: any) => {
    event.stopPropagation();
    if (!isDragging) {
      const { x, y, z } = event.point;
      setPoints([...points, new Vector3(x, y, z)]);
    }
  };

  return (
    <>
      {/* surface */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, height, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial
          color="lightblue"
          side={DoubleSide}
          opacity={0.5}
          transparent={true}
        />
      </mesh>
      
      {/* points */}
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color="red" />
        </mesh>
      ))}
    </>
  );
};

export default PolygonCreator;