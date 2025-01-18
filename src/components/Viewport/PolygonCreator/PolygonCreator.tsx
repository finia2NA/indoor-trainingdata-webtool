// TODO: mesh completion (when clicking on the first point)
// TODO: deselect by clicking surface when not in create mode

import React, { Fragment, useState } from 'react';

import { Vector3 } from 'three';
import { useEffect } from 'react';
import useEditorStore, { EditorMode, EditorState, PolygonToolMode } from '../../../hooks/useEditorStore.ts';
import { toast, ToastContentProps } from 'react-toastify';
import PolygonVertex from './PolygonVertex.tsx';
import CreatorSurface from './CreatorSurface.tsx';
import PolygonLine from './PolygonLine.tsx';
import usePolygonStore, { PolygonState } from '../../../hooks/usePolygonStore.ts';
import HeightDisplay from './HeightDisplay.tsx';

const PolygonDeletionToast = ({ closeToast }: ToastContentProps) => {
  return (
    <div className='flex flex-col gap-2 align-right'>
      <p>Cannot delete a point in a triangle</p>
      <button className='bg-red-500 rounded-md' onClick={() => closeToast("delete")}>Delete Polygon</button>
    </div>
  )
}


const PolygonCreator: React.FC = () => {
  const { polygonToolMode, setPolygonToolMode, editorMode } = useEditorStore((state) => state as EditorState);

  // // STATE
  // // poly list
  // const [polygons, setPolygons] = useState<Vector3[][]>([[]]);
  // // currently selected poly in <polygonsIndex, pointIndex> format
  // const [selectedPolygon, setSelectedPolygon] = useState<[number | null, number | null]>([null, null]);
  const { getPolygons, setPolygons, selectedPolygon, setSelectedPolygon } = usePolygonStore((state) => state as PolygonState);
  const polygons = getPolygons();

  // reset selected poly when switching out of edit mode
  useEffect(() => {
    if (polygonToolMode !== PolygonToolMode.EDIT) {
      setSelectedPolygon([null, null]);
    }
  }, [polygonToolMode, setSelectedPolygon]);

  // When leaving the component, set the polygon tool to None
  useEffect(() => {
    return () => {
      setPolygonToolMode(PolygonToolMode.NONE);
    }
  }, [setPolygonToolMode]);




  // FUNCTIONS FOR CHILDREN
  /**
   * Adds a point to the current polygon
   */
  const addPoint = (position: Vector3, polygonIndex?: number, afterPoint?: Vector3) => {
    const currentPolygon = polygonIndex !== undefined ? polygons[polygonIndex] : polygons[polygons.length - 1];
    polygonIndex = polygonIndex ?? polygons.length - 1;
    let newCurrentPolygon;

    if (afterPoint) {
      const afterIndex = currentPolygon.indexOf(afterPoint);
      newCurrentPolygon = [...currentPolygon.slice(0, afterIndex + 1), position, ...currentPolygon.slice(afterIndex + 1)];
    } else {
      newCurrentPolygon = [...currentPolygon, position];
    }

    const updatedPolygons = [...polygons];
    updatedPolygons[polygonIndex] = newCurrentPolygon;

    setPolygons(updatedPolygons);
  };

  const deletePolygon = React.useCallback((polygonIndex: number) => {
    const updatedPolygons = [...polygons.slice(0, polygonIndex), ...polygons.slice(polygonIndex + 1)];
    setPolygons(updatedPolygons);
  }, [polygons, setPolygons]);

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
  }, [polygons, setPolygons]);

  // Backspace handler: delete selected point
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // This is a handler for the backspace key
      if (event.key !== 'Backspace') return;

      // If no point is selected, do nothing
      const [polygonIndex, pointIndex] = selectedPolygon;
      if (polygonIndex === null || pointIndex === null) return;

      // If the polygon has only 3 points, give a warning and do nothing
      if (polygons[polygonIndex].length <= 3) {
        toast.warn(PolygonDeletionToast,
          {
            type: 'error',
            onClose: (reason) => {
              if (reason === "delete") {
                deletePolygon(polygonIndex);
                setSelectedPolygon([null, null]);
              }
            }

          });
        return;
      }

      // Golden path: remove the selected point
      const updatedPolygons = [...polygons];
      updatedPolygons[polygonIndex] = updatedPolygons[polygonIndex].filter(
        (_: unknown, index: number | null) => index !== pointIndex
      );
      setPolygons(updatedPolygons);
      setSelectedPolygon([null, null]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletePolygon, polygons, selectedPolygon, setPolygons, setSelectedPolygon]);

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
      {editorMode === EditorMode.MAP && (
        <CreatorSurface
          addPoint={addPoint}
        />
      )}

      {/* points */}
      {polygons.map((polygon, polygonIndex) => (
        <Fragment key={polygonIndex}>
          {polygon.map((point, pointIndex) => (
            <Fragment key={`${polygonIndex}, ${pointIndex}`}>
              {/* Vert */}
              <PolygonVertex
                position={point}
                setPosition={(newPosition) => setPointPosition(polygonIndex, pointIndex, newPosition)}
                isSelected={polygonIndex === selectedPolygon[0] && pointIndex === selectedPolygon[1]}
                setAsSelected={() => setSelectedPolygon([polygonIndex, pointIndex])}
                color={getPointColor(polygonIndex, pointIndex, polygon)}
                tryPolygonCompletion={tryPolygonCompletion} />
              {/* Line(s) */}
              {/* One line when we have just 2 points */}
              {polygon.length === 2 && (
                <PolygonLine
                  start={polygon[0]}
                  end={polygon[1]}
                  polygonIndex={polygonIndex}
                  addPoint={addPoint}
                />
              )}
              {/* Closing the loop when we have more than 2 */}
              {polygon.length > 2 && (
                <PolygonLine
                  start={point}
                  end={polygon[(pointIndex + 1) % polygon.length]}
                  polygonIndex={polygonIndex}
                  addPoint={addPoint}
                />
              )}
            </Fragment>
          ))}
        </Fragment>
      ))}

      {/* Height Display */}
      <HeightDisplay />

      {/* Debug cube */}
      <mesh position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); console.log(polygons) }}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </>
  );
};

export default PolygonCreator;