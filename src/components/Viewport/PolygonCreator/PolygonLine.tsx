import { useEffect, useState } from "react";
import { Vector3 } from "three";
import useEditorStore, { EditorState, PolygonToolMode } from "../../../hooks/useEditorStore";

type PolygonLineProps = {
  start: Vector3;
  end: Vector3;
  polygonIndex: number;
  // eslint-disable-next-line no-unused-vars
  addPoint: (position: Vector3, polygonIndex: number, after: Vector3) => void;
}

const PolygonLine = ({ start, end, polygonIndex, addPoint }: PolygonLineProps) => {
  const { polygonToolMode } = useEditorStore((state) => state as EditorState);

  // Color
  const [myColor, setMyColor] = useState("black");
  // when the mode is splice, it is yellow when hovered
  const onPointerEnter = () => {
    if (polygonToolMode !== PolygonToolMode.SPLICE) return;
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
    addPoint(intersection.point, polygonIndex, start)
  }



  return (
    <line onClick={onLineClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <bufferGeometry
        attach="geometry"
        ref={(geometry) => geometry && geometry.setFromPoints([start, end])}
      />
      <lineBasicMaterial attach="material" color={myColor} />
    </line>
  )
}

export default PolygonLine;