import { Line3, Plane, Vector2, Vector3 } from "three";
import earcut from 'earcut';

type IndexedPoint = {
  index: number;
  position: Vector3;
}

class Triangulation {
  polygon: Vector3[];
  lines: [IndexedPoint, IndexedPoint][];
  outliLines: [IndexedPoint, IndexedPoint][];
  triangles: [IndexedPoint, IndexedPoint, IndexedPoint][];
  #area: number | null = null;

  constructor(polygon: Vector3[]) {
    this.polygon = polygon;
    this.outliLines = polygon.map((point, index) => {
      const nextIndex = (index + 1) % polygon.length;
      return [{ index, position: point }, { index: nextIndex, position: polygon[nextIndex] }];
    }) as [IndexedPoint, IndexedPoint][];
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
   * @param heightOffset - The maximum allowed height offset to the triangle.
   * @returns True if the point is inside the polygon, false otherwise.
   */
  isInPolygon = (point: Vector3, heightOffset: number) => {
    // part 1: find the triangle we project to
    const p = new Vector2(point.x, point.z);
    for (const tri of this.triangles) {
      const a = new Vector2(tri[0].position.x, tri[0].position.z);
      const b = new Vector2(tri[1].position.x, tri[1].position.z);
      const c = new Vector2(tri[2].position.x, tri[2].position.z);
      const v0 = c.clone().sub(a);
      const v1 = b.clone().sub(a);
      const v2 = p.clone().sub(a);

      const d00 = v0.dot(v0);
      const d01 = v0.dot(v1);
      const d11 = v1.dot(v1);
      const d20 = v2.dot(v0);
      const d21 = v2.dot(v1);

      // Compute determinant
      const denom = d00 * d11 - d01 * d01;

      // Compute barycentric coordinates
      const i = (d11 * d20 - d01 * d21) / denom;
      const j = (d00 * d21 - d01 * d20) / denom;

      // If we are not in the triangle, continue
      if (!(i >= 0 && j >= 0 && i + j <= 1)) {
        continue;
      }

      // part 2: check if we are above/below the triangle with height < heightOffset
      // for this, first get abc in 3d, construct the plane from this
      const a3 = tri[0].position;
      const b3 = tri[1].position;
      const c3 = tri[2].position;
      const myPlane = new Plane().setFromCoplanarPoints(a3, b3, c3);

      // now, intersect this plane with the line from the point to the triangle
      const pointDown = point.clone().setY(point.y - heightOffset);
      const pointUp = point.clone().setY(point.y + heightOffset);
      const myLine = new Line3(pointDown, pointUp);
      const hasIntersection = myPlane.intersectsLine(myLine);

      return hasIntersection;

    }
    return false;
  }
  /**
   Returns the distance to the closest edge of the polygon
   works in 2D! Only x and z are considered
   This is because the offset goes straight up

   The returned distance and closest point are for an assumed perpendicular line from the point to the closest edge
  */
  getClosestEdgePoint = (point: Vector2) => {
    let closestDistance = Infinity;
    let closestPoint = new Vector3();
    for (let i = 0; i < this.outliLines.length; i++) {
      const A = new Vector3(point.x, 0, point.y);
      const B = new Vector3(this.lines[i][0].position.x, 0, this.lines[i][0].position.z);
      const C = new Vector3(this.lines[i][1].position.x, 0, this.lines[i][1].position.z);
      const line = new Line3(B, C);
      const currentPoint = line.closestPointToPoint(A, true, new Vector3());
      const currentDistance = currentPoint.distanceTo(A);
      if (currentDistance < closestDistance) {
        closestDistance = currentDistance;
        closestPoint = currentPoint.clone().setY(point.y);
      }
    }
    return { closestDistance, closestPoint };
  }
}

export default Triangulation; 