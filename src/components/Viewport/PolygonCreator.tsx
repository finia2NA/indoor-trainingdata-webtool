import React, { useState } from 'react';

import { DoubleSide, Vector3 } from 'three';
import { useEffect } from 'react';
import useEditorStore, { EditorState, PolygonToolMode } from '../../hooks/useEditorStore.ts';
import { toast } from 'react-toastify';


const PolygonCreator: React.FC = () => {
  const { polygonHeight, polygonSize, polygonToolMode } = useEditorStore((state) => state as EditorState);

  // STATE
  // helper to avoid adding a point when dragging
  const [isDragging, setIsDragging] = useState(false);
  // poly list
  const [polygons, setPolygons] = useState<Vector3[][]>([[]]);
  // currently selected poly in <polygonsIndex, pointIndex> format
  const [selectedPolygon, setSelectedPolygon] = useState<[number | null, number | null]>([null, null]);

  // reset selected poly when switching out of edit mode
  useEffect(() => {
    if (polygonToolMode !== PolygonToolMode.EDIT) {
      setSelectedPolygon([null, null]);
    }
  }, [polygonToolMode]);


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePointerDown = (event: any) => {
    event.stopPropagation();
    setIsDragging(false);
  };

  const handlePointerMove = () => {
    setIsDragging(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        const currentPolygon = polygons[polygons.length - 1];
        if (currentPolygon.length > 2) {
          setPolygons([...polygons, []]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [polygons]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // This is a handler for the backspace key
      if (event.key !== 'Backspace') return;

      // If no polygon is selected, do nothing
      const [polygonIndex, pointIndex] = selectedPolygon;
      if (polygonIndex === null || pointIndex === null) return;

      // If the polygon has only 3 points, give a warning and do nothing
      if (polygons[polygonIndex].length <= 3) {
        toast.warn('Cannot delete a point in a polygon of 3 points', { type: 'error' });
        return;
      }

      // Golden path: remove the selected point
      const updatedPolygons = [...polygons];
      updatedPolygons[polygonIndex] = updatedPolygons[polygonIndex].filter(
        (_: unknown, index: number | null) => index !== pointIndex
      );
      setPolygons(updatedPolygons);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [polygons, selectedPolygon]);

  const getPointColor = (polygonIndex: number, pointIndex: number, polygon: Vector3[]) => {
    // selected is yellow
    if (polygonIndex === selectedPolygon[0] && pointIndex === selectedPolygon[1]) {
      return "yellow";
    }

    // polygon has first and last highlighted if it is not closed
    if (polygonIndex === polygons.length - 1) {
      if (pointIndex === 0) {
        return "green";
      } else if (pointIndex === polygon.length - 1) {
        return "blue";
      } else {
        return "red";
      }
    }

    // default is red
    return "red";
  };

  return (
    <>
      {/* surface */}
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, polygonHeight, 0]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[polygonSize, polygonSize]} />
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
              {/* <meshBasicMaterial color={polygonIndex === polygons.length - 1 ? pointIndex === 0 ? "green" : pointIndex === polygon.length - 1 ? "blue" : "red" : "red"} /> */}
              <meshBasicMaterial color={getPointColor(polygonIndex, pointIndex, polygon)} />
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