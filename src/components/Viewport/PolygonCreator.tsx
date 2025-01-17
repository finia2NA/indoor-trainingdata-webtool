// TODO: mesh completion (when clicking on the first point)
// TODO: deselect by clicking surface when not in create mode

import React, { useState } from 'react';

import { Vector3 } from 'three';
import { useEffect } from 'react';
import useEditorStore, { EditorState, PolygonToolMode } from '../../hooks/useEditorStore.ts';
import { toast } from 'react-toastify';
import PolygonVertex from './PolygonCreator/PolygonVertex.tsx';
import CreatorSurface from './PolygonCreator/CreatorSurface.tsx';


const PolygonCreator: React.FC = () => {
  const { polygonToolMode } = useEditorStore((state) => state as EditorState);

  // reset selected poly when switching out of edit mode
  useEffect(() => {
    if (polygonToolMode !== PolygonToolMode.EDIT) {
      setSelectedPolygon([null, null]);
    }
  }, [polygonToolMode]);

  // STATE
  // poly list
  const [polygons, setPolygons] = useState<Vector3[][]>([[]]);
  // currently selected poly in <polygonsIndex, pointIndex> format
  const [selectedPolygon, setSelectedPolygon] = useState<[number | null, number | null]>([null, null]);

  // FUNCTIONS FOR CHILDREN
  /**
   * Adds a point to the current polygon
   */
  const addPoint = (position: Vector3) => {
    const currentPolygon = polygons[polygons.length - 1];
    const updatedPolygons = [...polygons];
    updatedPolygons[updatedPolygons.length - 1] = [...currentPolygon, position];
    setPolygons(updatedPolygons);
  }

  /**
   * Taking a point, check if it is the first one in the current polygon.
   * If it is, close the polygon.
   */
  const tryPolygonCompletion = (position: Vector3) => {
    const currentPolygon = polygons[polygons.length - 1];
    debugger;
    if (currentPolygon.length < 3) {
      toast.warn('Cannot complete a polygon with less than 3 points', { type: 'error' });
      return;
    }

    if (!currentPolygon.some(point => point.equals(position))) {
      toast.warn('Cannot complete a polygon with a point that is not in the current polygon', { type: 'error' });
      return;
    }

    // check if the new position is the first point
    const firstPoint = currentPolygon[0];
    if (firstPoint === position) {
      // close the polygon
      setPolygons([...polygons, []]);

    }
  }

  // Enter handler: complete polygon
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

  // Backspace handler: delete selected point
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

  const setPointPosition = (polygonIndex: number, pointIndex: number, newPosition: Vector3) => {
    const updatedPolygons = [...polygons];
    updatedPolygons[polygonIndex][pointIndex] = newPosition;
    setPolygons(updatedPolygons);
  }

  return (
    <>
      {/* surface */}
      <CreatorSurface
        addPoint={addPoint}
      />

      {/* points */}
      {polygons.map((polygon, polygonIndex) => (
        <React.Fragment key={polygonIndex}>
          {polygon.map((point, pointIndex) => (
            <PolygonVertex
              key={`${polygonIndex}-${pointIndex}`}
              position={point}
              setPosition={(newPosition) => setPointPosition(polygonIndex, pointIndex, newPosition)}
              isSelected={polygonIndex === selectedPolygon[0] && pointIndex === selectedPolygon[1]}
              setAsSelected={() => setSelectedPolygon([polygonIndex, pointIndex])}
              color={getPointColor(polygonIndex, pointIndex, polygon)}
              tryPolygonCompletion={tryPolygonCompletion} />
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