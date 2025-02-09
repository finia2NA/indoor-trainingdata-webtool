import { Vector3, BufferAttribute, DoubleSide } from "three";
import Triangulation from "../../../util/triangulate";
import useEditorStore, { EditorMode } from "../../../hooks/useEditorStore";

type TriangulationDisplayProps = {
  polygon: Vector3[];
}

const TriangulationDisplay = ({ polygon }: TriangulationDisplayProps) => {
  const triangulation = new Triangulation(polygon);
  const { editorMode } = useEditorStore();

  return (
    <>
      {triangulation.lines.map((line, i) => (
        <line key={`line-${i}`}>
          <bufferGeometry
            attach="geometry"
            ref={(geometry) => geometry && geometry.setFromPoints(line.map((point) => point.position))}
          />
          <lineBasicMaterial
            attach="material"
            color="white"
          />
        </line>
      ))}

      {editorMode === EditorMode.MAP && 
          triangulation.triangles.map((triangle, i) => (
            <mesh key={`triangle-${i}`}>
              <bufferGeometry
                attach="geometry"
                ref={(geometry) => {
                  if (!geometry) return;
                  const positions = new Float32Array([
                    triangle[0].position.x, triangle[0].position.y, triangle[0].position.z,
                    triangle[1].position.x, triangle[1].position.y, triangle[1].position.z,
                    triangle[2].position.x, triangle[2].position.y, triangle[2].position.z,
                  ]);
                  geometry.setAttribute('position', new BufferAttribute(positions, 3));
                  geometry.setIndex([0, 1, 2]);
                  geometry.computeVertexNormals();
                }}
              />
              <meshBasicMaterial
                attach="material"
                color="blue"
                side={DoubleSide}
                transparent
                opacity={0.5}
              />
            </mesh>
          ))
      }
    </>
  );
}

export default TriangulationDisplay;