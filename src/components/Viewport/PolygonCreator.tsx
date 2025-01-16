import React, { useState } from 'react';
import usePolygonCreatorStore from "../../hooks/usePolygonCreatorStore.ts";
import { DoubleSide, Vector3 } from 'three';

const PolygonCreator: React.FC = () => {
  const { height } = usePolygonCreatorStore((state) => state);

  // STATE
  // helper to avoid adding a point when dragging
  const [isDragging, setIsDragging] = useState(false);
  // poly list
  const [polygons, setPolygons] = useState<Vector3[][]>([[]]);


  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    setIsDragging(false);
  };

  const handlePointerMove = () => {
    setIsDragging(true);
  };

  const handlePointerUp = (event: any) => {
    event.stopPropagation();
    if (isDragging) return;

    const { x, y, z } = event.point;
    const currentPolygon = polygons[polygons.length - 1];
    const newPoint = new Vector3(x, y, z);

    if (currentPolygon.length > 0 && currentPolygon[0].distanceTo(newPoint) < 0.1) {
      // Complete the current polygon and start a new one
      setPolygons([...polygons, []]);
    } else {
      // Add the new point to the current polygon
      const updatedPolygons = [...polygons];
      updatedPolygons[updatedPolygons.length - 1] = [...currentPolygon, newPoint];
      setPolygons(updatedPolygons);
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
      {polygons.map((polygon, polygonIndex) => (
        <React.Fragment key={polygonIndex}>
          {polygon.map((point, pointIndex) => (
            <mesh key={`${polygonIndex}-${pointIndex}`} position={point}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color={pointIndex===0 ? "green": "red"} />
            </mesh>
          ))}
          {polygon.length > 1 && (
            <line>
              <bufferGeometry
                attach="geometry"
                ref={(geometry) => geometry && geometry.setFromPoints([...polygon, polygon[0]])}
              />
              <lineBasicMaterial attach="material" color="black" />
            </line>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default PolygonCreator;