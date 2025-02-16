// TODO: mesh completion (when clicking on the first point)
// TODO: deselect by clicking surface when not in create mode

import React, { Fragment } from 'react';

import { Vector3 } from 'three';
import { useEffect } from 'react';
import useEditorStore, { EditorMode, PolygonToolMode } from '../../../hooks/useEditorStore.ts';
import { toast } from 'react-toastify';
import PolygonVertex from './PolygonVertex.tsx';
import CreatorSurface from './CreatorSurface.tsx';
import PolygonLine from './PolygonLine.tsx';
import useMultiPolygonStore from '../../../hooks/useMultiPolygonStore.ts';
import HeightDisplay from './HeightDisplay.tsx';
import { useParams } from 'react-router-dom';
import TriangulationDisplay from './TriangulizationDisplay.tsx';
import PosesPreview from './PosePreview.tsx';

const PolygonCreator: React.FC = () => {
  "use no memo"
  const { polygonToolMode, setPolygonToolMode, editorMode, showTriangulation, showPoses } = useEditorStore();
  const id = Number(useParams<{ id: string }>().id);
  const { getPolygons, deletePolygon, deletePoint, setPolygons, addPoint, getSelectedPolygon, setSelectedPolygon } = useMultiPolygonStore();
  const polygons = getPolygons(id);
  const selectedPolygon = getSelectedPolygon(id);

  // reset selected poly when switching out of edit mode
  useEffect(() => {
    if (polygonToolMode !== PolygonToolMode.EDIT) {
      setSelectedPolygon(id, [null, null]);
    }
  }, [polygonToolMode, setSelectedPolygon, id]);

  // When leaving the component, set the polygon tool to None
  useEffect(() => {
    return () => {
      setPolygonToolMode(PolygonToolMode.NONE);
    }
  }, [setPolygonToolMode]);


  // FUNCTIONS FOR CHILDREN

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
      setPolygons(id, [...polygons, []]);
    }
  }

  // Enter handler: complete polygon
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        const currentPolygon = polygons[polygons.length - 1];
        if (currentPolygon.length > 2) {
          setPolygons(id, [...polygons, []]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [polygons, setPolygons, id]);

  // Backspace handler: delete selected point
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // This is a handler for the backspace key
      if (event.key !== 'Backspace') return;

      // If no point is selected, do nothing
      const [polygonIndex, pointIndex] = selectedPolygon;
      if (polygonIndex === null || pointIndex === null) return;
      deletePoint(id, polygonIndex, pointIndex);
      setSelectedPolygon(id, [null, null]);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deletePoint, deletePolygon, polygons, selectedPolygon, setPolygons, setSelectedPolygon, id]);

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
    setPolygons(id, updatedPolygons);
    // console.log('setting position');
  }

  return (
    <>
      {/* surface */}
      {editorMode === EditorMode.MAP && (
        <CreatorSurface
          addPoint={pos => addPoint(id, pos)}
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
                pointIndex={pointIndex}
                setPosition={(newPosition) => setPointPosition(polygonIndex, pointIndex, newPosition)}
                isSelected={polygonIndex === selectedPolygon[0] && pointIndex === selectedPolygon[1]}
                setAsSelected={() => setSelectedPolygon(id, [polygonIndex, pointIndex])}
                color={getPointColor(polygonIndex, pointIndex, polygon)}
                tryPolygonCompletion={tryPolygonCompletion} />
              {/* Line(s) */}
              {!showTriangulation && (
                <>
                  {/* One line when we have just 2 points */}
                  {polygon.length === 2 && (
                    <PolygonLine
                      startPoint={polygon[0]}
                      startIndex={0}
                      endPoint={polygon[1]}
                      polygonIndex={polygonIndex}
                    />
                  )}
                  {/* Closing the loop when we have more than 2 */}
                  {polygon.length > 2 && (
                    <PolygonLine
                      startPoint={point}
                      startIndex={pointIndex}
                      endPoint={polygon[(pointIndex + 1) % polygon.length]}
                      polygonIndex={polygonIndex}
                    />
                  )}
                </>
              )}
            </Fragment>
          ))}
          {showTriangulation &&
            <TriangulationDisplay polygon={polygon} />
          }
        </Fragment>
      ))}

      {/* Height Display */}
      {editorMode === EditorMode.GENERATE && <HeightDisplay />}

      {/* Poses */}
      {editorMode === EditorMode.GENERATE && showPoses && (
        <PosesPreview />
      )}


      {/* Debug cube */}
      {/* <mesh position={[0, 0, 0]} onClick={(e) => { e.stopPropagation(); console.log(polygons) }}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshBasicMaterial color="red" />
      </mesh> */}
    </>
  );
};

export default PolygonCreator;