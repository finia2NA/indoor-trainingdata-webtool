import { Vector3 } from "three";
import earcut from 'earcut';

type IndexedPoint = {
  index: number;
  position: Vector3;
}

class Triangulation {
  polygon: Vector3[];
  lines: [IndexedPoint, IndexedPoint][];
  triangles: [IndexedPoint, IndexedPoint, IndexedPoint][];

  constructor(polygon: Vector3[]) {
    this.polygon = polygon;
    const flatCoords = polygon.flatMap((point) => [point.x, point.z]);
    const earcutIndices = earcut(flatCoords, undefined, 2);
    const lineIndices: number[][] = [];
    for (let i = 0; i < earcutIndices.length; i += 3) {
      lineIndices.push([earcutIndices[i], earcutIndices[i + 1]]);
      lineIndices.push([earcutIndices[i + 1], earcutIndices[i + 2]]);
      lineIndices.push([earcutIndices[i + 2], earcutIndices[i]]);
    }
    this.lines = lineIndices.map((line) => line.map((index) => ({ index, position: polygon[index] }))) as [IndexedPoint, IndexedPoint][]

    this.triangles = [];
    for (let i = 0; i < earcutIndices.length; i += 3) {
      this.triangles.push([
        { index: earcutIndices[i], position: polygon[earcutIndices[i]] },
        { index: earcutIndices[i + 1], position: polygon[earcutIndices[i + 1]] },
        { index: earcutIndices[i + 2], position: polygon[earcutIndices[i + 2]] }
      ]);
    }
  }
}

export default Triangulation; 