import { Vector3 } from "three";
import earcut from 'earcut';

type TriangulizationDisplayProps = {
  polygon: Vector3[];
}

const TriangulizationDisplay = ({ polygon }: TriangulizationDisplayProps) => {
  const lineIndices: number[][] = [];
  // const a = polygon.flatMap((point) => [point.x, point.z]);
  const a = polygon.flatMap((point) => [point.x, point.y, point.z]);
  const earcutIndices = earcut(a, undefined, 3);

  for (let i = 0; i < earcutIndices.length; i += 3) {
    lineIndices.push([earcutIndices[i], earcutIndices[i + 1]]);
    lineIndices.push([earcutIndices[i + 1], earcutIndices[i + 2]]);
    lineIndices.push([earcutIndices[i + 2], earcutIndices[i]]);
  }

  const linePoints = lineIndices.map((line) => line.map((index) => polygon[index]));

  return (
    <>
      {linePoints.map((line, i) => (
        <line key={i} >
          <bufferGeometry
            attach="geometry"
            ref={(geometry) => geometry && geometry.setFromPoints(line)}
          />
          <lineBasicMaterial
          attach="material"
          color="white"
          // transparent opacity={0.2}
          />
        </line>

      ))}
    </>
  );
}

export default TriangulizationDisplay;