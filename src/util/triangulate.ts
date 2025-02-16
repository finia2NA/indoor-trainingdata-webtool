import { Line3, Vector3 } from "three";
import earcut from 'earcut';

type IndexedPoint = {
  index: number;
  position: Vector3;
}

class Triangulation {
  polygon: Vector3[];
  lines: [IndexedPoint, IndexedPoint][];
  triangles: [IndexedPoint, IndexedPoint, IndexedPoint][];
  #area: number | null = null;

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

  getArea() {
    if (this.#area !== null) {
      return this.#area;
    }
    let area = 0;
    for (let i = 0; i < this.triangles.length; i++) {
      const triangle = this.triangles[i];
      const a = triangle[0].position;
      const b = triangle[1].position;
      const c = triangle[2].position;
      const ab = b.clone().sub(a);
      const ac = c.clone().sub(a);
      const cross = new Vector3().crossVectors(ab, ac);
      area += 0.5 * cross.length();
    }
    this.#area = area;
    return area;
  }

  getRandomPoint() {
    // First, get a triangle weighted by area
    // We do this by first computing a goal area as a fraction of the total shape area,
    // then iterating over the triangles and taking the first one that pushes us over the goal area
    const totalArea = this.getArea();
    const randomArea = Math.random() * totalArea;
    let currentArea = 0;
    let triangleIndex = 0;
    for (let i = 0; i < this.triangles.length; i++) {
      const triangle = this.triangles[i];
      const a = triangle[0].position;
      const b = triangle[1].position;
      const c = triangle[2].position;
      const ab = b.clone().sub(a);
      const ac = c.clone().sub(a);
      const cross = new Vector3().crossVectors(ab, ac);
      const triangleArea = 0.5 * cross.length();
      if (currentArea + triangleArea > randomArea) {
        triangleIndex = i;
        break;
      }
      currentArea += triangleArea;
    }

    // Now, get a random point in the triangle
    // https://theswissbay.ch/pdf/Gentoomen%20Library/Game%20Development/Programming/Graphics%20Gems%201.pdf
    const triangle = this.triangles[triangleIndex];
    const A = triangle[0].position;
    const B = triangle[1].position;
    const C = triangle[2].position;
    const s = Math.random();
    const t = Math.random();
    const aCoeff = 1 - Math.sqrt(t);
    const bCoeff = (1 - s) * Math.sqrt(t);
    const cCoeff = s * Math.sqrt(t);

    const point =
      A.clone().multiplyScalar(aCoeff)
        .add(B.clone().multiplyScalar(bCoeff))
        .add(C.clone().multiplyScalar(cCoeff));

    return { point, triangleIndex };
  }

  /**
   * Determines whether a given point is inside the polygon.
   *
   * This method implements the ray-casting algorithm by drawing a horizontal ray from the
   * point and counting the number of times the ray intersects with the polygon's edges.
   *
   * The algorithm works as follows:
   * - Iterate over each edge of the polygon, where each edge is defined by two consecutive vertices.
   * - For each edge, check if the ray crossed from the point's z coordinate lies within the
   *   vertical span of the edge.
   * - Calculate the intersection point's x coordinate on the edge.
   * - Toggle the resulting boolean state if the ray intersects the edge.
   *
   * A final odd number of crossings indicates that the point is inside the polygon, while
   * an even number indicates that it is outside.
   *
   * @param point - The point with x and z coordinates to test against the polygon.
   * @returns True if the point is inside the polygon, false otherwise.
   */
  isInPolygon = (point: Vector3) => {
    let isInside = false;
    for (let i = 0, j = this.polygon.length - 1; i < this.polygon.length; j = i++) {
      const xi = this.polygon[i].x;
      const zi = this.polygon[i].z;
      const xj = this.polygon[j].x;
      const zj = this.polygon[j].z;
      const intersect = ((zi > point.z) !== (zj > point.z)) &&
        (point.x < (xj - xi) * (point.z - zi) / (zj - zi) + xi);
      if (intersect) isInside = !isInside;
    }
    return isInside;
  }

  getDistanceToClosestEdge = (point: Vector3) => {
    let minDistance = Infinity;
    for (let i = 0; i < this.lines.length; i++) {
      const A = point;
      const B = this.lines[i][0].position;
      const C = this.lines[i][1].position;
      const line = new Line3(B, C);
      const d = line.closestPointToPoint(A, true, new Vector3()).distanceTo(A);
      if (d < minDistance) {
        minDistance = d;
      }
    }
    return minDistance;
  }
}

export default Triangulation; 