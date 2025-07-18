import { useParams } from 'react-router-dom';
import { useEffect, useState } from "react";
import { Vector3 } from "three";
import useEditorStore, { EditorState, PolygonToolMode } from "../../../hooks/state/useEditorStore";
import useMultiPolygonStore from '../../../hooks/state/useMultiPolygonStore';

type PolygonLineProps = {
  startPoint: Vector3;
  startIndex: number;
  endPoint: Vector3;
  polygonIndex: number;
}

const PolygonLine = ({ startPoint, startIndex, endPoint, polygonIndex }: PolygonLineProps) => {
  const { polygonToolMode } = useEditorStore((state) => state as EditorState);
  const { addPoint } = useMultiPolygonStore();
  const id = Number(useParams<{ id: string }>().id);

  // Color
  const [myColor, setMyColor] = useState("black");
  // when the mode is splice, it is yellow when hovered
  const onPointerEnter = () => {
    if (polygonToolMode !== PolygonToolMode.SPLICE) return;
    console.log(startPoint, endPoint, polygonIndex)
    setMyColor("yellow");
  }
  // when not hovered, it is black
  const onPointerLeave = () => {
    setMyColor("black");
  }
  // When mode changes to not splice, it resets to black
  useEffect(() => {
    if (polygonToolMode !== PolygonToolMode.SPLICE) {
      setMyColor("black");
    }
  }, [polygonToolMode]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onLineClick = (intersection: any) => {
    if (polygonToolMode !== PolygonToolMode.SPLICE) return;

    intersection.stopPropagation();
    console.log("Line clicked");
    console.log(polygonIndex, startIndex, startIndex);
    addPoint(id, intersection.point, polygonIndex, startIndex)
  }

  return (
    <line onClick={onLineClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <bufferGeometry
        attach="geometry"
        ref={(geometry) => geometry && geometry.setFromPoints([startPoint, endPoint])}
      />
      <lineBasicMaterial attach="material" color={myColor} />
    </line>
  )
}

export default PolygonLine;