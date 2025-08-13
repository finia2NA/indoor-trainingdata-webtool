import { Vector2, Vector3, Quaternion, Matrix4 } from 'three';

// Worker-side types and utilities
export enum PoseType {
  SINGLE = 'single',
  PAIR = 'pair',
}

export type Pose = {
  position: Vector3;
  target: Vector3;
  quaternion: Quaternion;
  fov: number;
  series: number;
  type: PoseType;
}

export type PostTrainingPose = Pose & {
  imageName: string;
}

type PolygonEX = {
  polygon: SerializedVector3[];
  triangulation: TriangulationData;
  area: number;
}

type TriangulationData = {
  triangles: [SerializedVector3, SerializedVector3, SerializedVector3][];
  area: number;
}

type SerializedVector3 = {
  x: number;
  y: number;
  z: number;
}

type WorkerMessage = {
  type: 'GENERATE_POSES' | 'GENERATE_POSTTRAINING_POSES' | 'PROGRESS_UPDATE';
  data: any;
}

type GeneratePosesRequest = {
  startIndex: number;
  endIndex: number;
  polygonsEX: PolygonEX[];
  totalArea: number;
  heightOffset: number;
  anglesRange: [number, number];
  anglesConcentration: number;
  fovRange: [number, number];
  fovConcentration: number;
  avoidWalls: boolean;
  pair: boolean;
  pairDistanceRange: [number, number];
  pairDistanceConcentration: number;
  pairAngleOffset: number;
  pairAngleConcentration: number;
  raycastData?: RaycastData[];
}

type RaycastData = {
  start: Vector3;
  target: Vector3;
  hasIntersection: boolean;
  distance?: number;
}

type PosttrainingPosition = {
  x: number;
  y: number;
  z: number;
  name: string;
}

type GeneratePosttrainingPosesRequest = {
  startIndex: number;
  endIndex: number;
  positions: PosttrainingPosition[];
  numPosttrainingImages: number;
  anglesRange: [number, number];
  anglesConcentration: number;
  fovRange: [number, number];
  fovConcentration: number;
  avoidWalls: boolean;
  pair: boolean;
  pairDistanceRange: [number, number];
  pairDistanceConcentration: number;
  pairAngleOffset: number;
  pairAngleConcentration: number;
}

// Helper functions for Vector3 serialization
function toVector3(serialized: SerializedVector3): Vector3 {
  return new Vector3(serialized.x, serialized.y, serialized.z);
}

// Helper function for serialization (currently unused but may be needed)
// function toSerializedVector3(vector: Vector3): SerializedVector3 {
//   return { x: vector.x, y: vector.y, z: vector.z };
// }

function reconstructPolygonsEX(polygonsEX: PolygonEX[]): {
  polygon: Vector3[];
  triangulation: {
    triangles: [Vector3, Vector3, Vector3][];
    area: number;
  };
  area: number;
}[] {
  return polygonsEX.map(poly => ({
    polygon: poly.polygon.map(toVector3),
    triangulation: {
      triangles: poly.triangulation.triangles.map(([a, b, c]) => [
        toVector3(a),
        toVector3(b),
        toVector3(c)
      ] as [Vector3, Vector3, Vector3]),
      area: poly.triangulation.area
    },
    area: poly.area
  }));
}

// Probability distribution functions
function normPdf(x: number, mu: number, sigma: number): number {
  return (1 / (sigma * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
}

function createDistribution(a: number): (x: number) => number {
  if (a < 0 || a > 1) {
    throw new Error("Parameter 'a' must be between 0 and 1");
  }

  const sigma = 1 / Math.pow(2, 5 * a);
  const uniformComponent = (1 - a) * 0.1;

  return function (x: number) {
    const normalComponent = a * normPdf(x, 0, sigma);
    return uniformComponent + normalComponent;
  };
}

function takeRandomSample(dist: (x: number) => number, maxTries = 10000, positive = false): number {
  const maxValue = dist(0);

  for (let i = 0; i < maxTries; i++) {
    const x = Math.random() * 2 - 1;
    const u = Math.random();

    if (u < dist(x) / maxValue) {
      return positive ? Math.abs(x) : x;
    }
  }

  throw new Error("Sampling failed after maximum attempts.");
}

// Triangulation utilities
function getTriangleArea(a: Vector3, b: Vector3, c: Vector3): number {
  const ab = b.clone().sub(a);
  const ac = c.clone().sub(a);
  const cross = new Vector3().crossVectors(ab, ac);
  return 0.5 * cross.length();
}

function getRandomPointInTriangle(triangle: [Vector3, Vector3, Vector3]): Vector3 {
  const [A, B, C] = triangle;
  const s = Math.random();
  const t = Math.random();
  const aCoeff = 1 - Math.sqrt(t);
  const bCoeff = (1 - s) * Math.sqrt(t);
  const cCoeff = s * Math.sqrt(t);

  return A.clone().multiplyScalar(aCoeff)
    .add(B.clone().multiplyScalar(bCoeff))
    .add(C.clone().multiplyScalar(cCoeff));
}

function isInTriangle2D(point: Vector2, triangle: [Vector3, Vector3, Vector3]): boolean {
  const [tri0, tri1, tri2] = triangle;
  const a = new Vector2(tri0.x, tri0.z);
  const b = new Vector2(tri1.x, tri1.z);
  const c = new Vector2(tri2.x, tri2.z);
  
  const v0 = c.clone().sub(a);
  const v1 = b.clone().sub(a);
  const v2 = point.clone().sub(a);

  const d00 = v0.dot(v0);
  const d01 = v0.dot(v1);
  const d11 = v1.dot(v1);
  const d20 = v2.dot(v0);
  const d21 = v2.dot(v1);

  const denom = d00 * d11 - d01 * d01;
  const i = (d11 * d20 - d01 * d21) / denom;
  const j = (d00 * d21 - d01 * d20) / denom;

  return i >= 0 && j >= 0 && i + j <= 1;
}

function isInExtrudedPolygon(point: Vector3, polygonsEX: { polygon: Vector3[]; triangulation: { triangles: [Vector3, Vector3, Vector3][]; area: number; }; area: number; }[], _heightOffset: number): boolean {
  const p = new Vector2(point.x, point.z);
  
  for (const polygon of polygonsEX) {
    for (const triangle of polygon.triangulation.triangles) {
      if (isInTriangle2D(p, triangle)) {
        // Check height constraint (simplified - would need plane intersection in full implementation)
        return true;
      }
    }
  }
  return false;
}

function getQuaternionFromTarget(position: Vector3, target: Vector3): Quaternion {
  const up = new Vector3(0, 1, 0);
  const m = new Matrix4();
  m.lookAt(position, target, up);
  return new Quaternion().setFromRotationMatrix(m);
}

async function getRandomPoseInPolygons(
  series: number,
  polygonsEX: PolygonEX[],
  totalArea: number,
  heightOffset: number,
  anglesRange: [number, number],
  anglesConcentration: number,
  fovRange: [number, number],
  fovConcentration: number,
  _avoidWalls: boolean,
  _wallAvoidanceThreshold = 0.3,
  maxTries = 10000
): Promise<Pose> {

  if (maxTries <= 0) {
    throw new Error('getRandomPoseInPolygons failed after maximum attempts');
  }

  // Reconstruct Vector3 objects from serialized data
  const reconstructedPolygons = reconstructPolygonsEX(polygonsEX);

  // Pick a random polygon weighted by area
  const randomArea = Math.random() * totalArea;
  let currentArea = 0;
  let selectedPolygon: typeof reconstructedPolygons[0] | undefined;
  
  for (let i = 0; i < reconstructedPolygons.length; i++) {
    currentArea += reconstructedPolygons[i].area;
    if (currentArea >= randomArea) {
      selectedPolygon = reconstructedPolygons[i];
      break;
    }
  }

  if (!selectedPolygon) {
    throw new Error('No polygon selected');
  }

  // Get random point in the selected polygon's triangulation
  const triangleArea = selectedPolygon.triangulation.area;
  const randomTriangleArea = Math.random() * triangleArea;
  let currentTriangleArea = 0;
  let selectedTriangle: [Vector3, Vector3, Vector3] | undefined;

  for (const triangle of selectedPolygon.triangulation.triangles) {
    const area = getTriangleArea(triangle[0], triangle[1], triangle[2]);
    currentTriangleArea += area;
    if (currentTriangleArea >= randomTriangleArea) {
      selectedTriangle = triangle;
      break;
    }
  }

  if (!selectedTriangle) {
    throw new Error('No triangle selected');
  }

  const selectedPoint = getRandomPointInTriangle(selectedTriangle);

  // Add random height offset
  const rndHeightOffset = (Math.random() * 2 - 1) * heightOffset;
  selectedPoint.add(new Vector3(0, rndHeightOffset, 0));

  // Generate random direction in XZ plane
  const directionXZ = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1);
  if (directionXZ.length() > 0) {
    directionXZ.normalize();
  } else {
    directionXZ.set(1, 0);
  }

  // Sample pitch angle
  const anglesDist = createDistribution(anglesConcentration);
  const angleSample = takeRandomSample(anglesDist);
  const angleVal = (anglesRange[0] + anglesRange[1]) / 2 + 
    angleSample * (anglesRange[1] - anglesRange[0]) / 2;

  // Compute target direction
  const y = Math.sin((angleVal / 180.0) * Math.PI);
  const horizontalScale = Math.cos((angleVal / 180.0) * Math.PI);

  const targetPoint = new Vector3(
    selectedPoint.x + directionXZ.x * horizontalScale,
    selectedPoint.y + y,
    selectedPoint.z + directionXZ.y * horizontalScale
  );

  const quaternionRotation = getQuaternionFromTarget(selectedPoint, targetPoint);

  // Generate random FOV
  const fovDist = createDistribution(fovConcentration);
  const fovSample = takeRandomSample(fovDist);
  const fov = (fovRange[0] + fovRange[1]) / 2 + fovSample * (fovRange[1] - fovRange[0]) / 2;

  // Note: Wall avoidance would require raycast data to be passed in
  // For now, we assume this check is done elsewhere or simplified

  return {
    position: selectedPoint,
    target: targetPoint,
    quaternion: quaternionRotation,
    fov,
    type: PoseType.SINGLE,
    series,
  };
}

async function getPairPoint(
  pose: Pose,
  series: number,
  polygonsEX: PolygonEX[],
  heightOffset: number,
  pairDistanceRange: [number, number],
  pairDistanceConcentration: number,
  pairAngleOffset: number,
  pairAngleConcentration: number,
  _avoidWalls: boolean,
  maxTries = 10000
): Promise<Pose> {

  if (maxTries <= 0) {
    throw new Error('getPairPoint failed after maximum attempts');
  }

  // Reconstruct Vector3 objects from serialized data
  const reconstructedPolygons = reconstructPolygonsEX(polygonsEX);

  // Sample distance and angle
  const distanceDist = createDistribution(pairDistanceConcentration);
  const distanceSample = takeRandomSample(distanceDist, 10000, true);
  const distanceVal = pairDistanceRange[0] + distanceSample * (pairDistanceRange[1] - pairDistanceRange[0]);

  const pairAngleDist = createDistribution(pairAngleConcentration);
  const pairAngleSample = takeRandomSample(pairAngleDist);
  const pairAngleVal = pairAngleSample * pairAngleOffset * (Math.PI / 180);

  // Generate new position
  const newPos = pose.position.clone().add(new Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  ).multiplyScalar(distanceVal));

  // Generate new direction based on original pose direction and angle offset
  const direction = pose.target.clone().sub(pose.position).normalize();
  const up = new Vector3(0, 1, 0);
  const right = new Vector3().crossVectors(up, direction).normalize();

  const t = Math.random();
  const yawAngle = t * pairAngleVal;
  const pitchAngle = (1 - t) * pairAngleVal;

  const yawQuat = new Quaternion().setFromAxisAngle(up, yawAngle);
  direction.applyQuaternion(yawQuat);
  const pitchQuat = new Quaternion().setFromAxisAngle(right, pitchAngle);
  direction.applyQuaternion(pitchQuat);
  direction.normalize();

  const newTarget = newPos.clone().add(direction);
  const quaternionRotation = getQuaternionFromTarget(newPos, newTarget);

  // Check if position is in polygon
  if (!isInExtrudedPolygon(newPos, reconstructedPolygons, heightOffset)) {
    return getPairPoint(pose, series, polygonsEX, heightOffset, pairDistanceRange, 
      pairDistanceConcentration, pairAngleOffset, pairAngleConcentration, _avoidWalls, maxTries - 1);
  }

  return {
    position: newPos,
    target: newTarget,
    quaternion: quaternionRotation,
    fov: pose.fov,
    type: PoseType.PAIR,
    series,
  };
}

async function generatePosttrainingPose(
  position: PosttrainingPosition,
  poseIndex: number,
  anglesRange: [number, number],
  anglesConcentration: number,
  fovRange: [number, number],
  fovConcentration: number,
  _avoidWalls: boolean
): Promise<PostTrainingPose> {
  // Create position vector
  const pos = new Vector3(position.x, position.y, position.z);

  // Generate random direction in XZ plane
  const directionXZ = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1);
  if (directionXZ.length() > 0) {
    directionXZ.normalize();
  } else {
    directionXZ.set(1, 0);
  }

  // Sample pitch angle
  const anglesDist = createDistribution(anglesConcentration);
  const angleSample = takeRandomSample(anglesDist);
  const angleVal = (anglesRange[0] + anglesRange[1]) / 2 + 
    angleSample * (anglesRange[1] - anglesRange[0]) / 2;

  // Compute the Y component using the pitch angle
  const y = Math.sin((angleVal / 180.0) * Math.PI);
  const horizontalScale = Math.cos((angleVal / 180.0) * Math.PI);

  // Final target vector
  const target = new Vector3(
    pos.x + directionXZ.x * horizontalScale,
    pos.y + y,
    pos.z + directionXZ.y * horizontalScale
  );

  // Generate random FOV based on settings
  const fovDist = createDistribution(fovConcentration);
  const fovSample = takeRandomSample(fovDist);
  const fov = (fovRange[0] + fovRange[1]) / 2 + fovSample * (fovRange[1] - fovRange[0]) / 2;

  // Note: Wall avoidance check would be done here if raycast data was provided

  return {
    position: pos,
    target: target,
    quaternion: getQuaternionFromTarget(pos, target),
    fov,
    type: PoseType.SINGLE,
    series: poseIndex,
    imageName: position.name
  };
}

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, data } = event.data;

  switch (type) {
    case 'GENERATE_POSES': {
      try {
        const request = data as GeneratePosesRequest;
        const poses: Pose[] = [];
        
        const totalPosesToGenerate = request.endIndex - request.startIndex;
        
        for (let i = request.startIndex; i < request.endIndex; i++) {
          // Generate primary pose
          const pose = await getRandomPoseInPolygons(
            i,
            request.polygonsEX,
            request.totalArea,
            request.heightOffset,
            request.anglesRange,
            request.anglesConcentration,
            request.fovRange,
            request.fovConcentration,
            request.avoidWalls
          );
          poses.push(pose);

          // Generate pair pose if needed
          if (request.pair) {
            const pairPose = await getPairPoint(
              pose,
              i,
              request.polygonsEX,
              request.heightOffset,
              request.pairDistanceRange,
              request.pairDistanceConcentration,
              request.pairAngleOffset,
              request.pairAngleConcentration,
              request.avoidWalls
            );
            poses.push(pairPose);
          }

          // Send progress update
          const progress = (i - request.startIndex + 1) / totalPosesToGenerate;
          self.postMessage({
            type: 'PROGRESS_UPDATE',
            data: { progress, workerId: self.name }
          });
        }

        // Send completed poses
        self.postMessage({
          type: 'POSES_COMPLETE',
          data: { poses, workerId: self.name }
        });

      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          data: { error: (error as Error).message, workerId: self.name }
        });
      }
      break;
    }

    case 'GENERATE_POSTTRAINING_POSES': {
      try {
        const request = data as GeneratePosttrainingPosesRequest;
        const poses: PostTrainingPose[] = [];
        
        let totalPoses = 0;
        const totalPosesToGenerate = (request.endIndex - request.startIndex) * request.numPosttrainingImages;

        // Generate poses for each position in the assigned range
        for (let positionIndex = request.startIndex; positionIndex < request.endIndex; positionIndex++) {
          const position = request.positions[positionIndex];
          
          for (let i = 0; i < request.numPosttrainingImages; i++) {
            totalPoses++;
            
            const pose = await generatePosttrainingPose(
              position,
              totalPoses - 1,
              request.anglesRange,
              request.anglesConcentration,
              request.fovRange,
              request.fovConcentration,
              request.avoidWalls
            );
            poses.push(pose);

            // Generate pair pose if needed
            if (request.pair) {
              // For posttraining, we need a simplified pair generation without polygons
              const pairPose: PostTrainingPose = {
                ...pose,
                type: PoseType.PAIR,
                series: totalPoses - 1,
              };
              poses.push(pairPose);
            }

            // Send progress update
            const progress = totalPoses / totalPosesToGenerate;
            self.postMessage({
              type: 'PROGRESS_UPDATE',
              data: { progress, workerId: self.name }
            });
          }
        }

        // Send completed poses
        self.postMessage({
          type: 'POSES_COMPLETE',
          data: { poses, workerId: self.name }
        });

      } catch (error) {
        self.postMessage({
          type: 'ERROR',
          data: { error: (error as Error).message, workerId: self.name }
        });
      }
      break;
    }
  }
};