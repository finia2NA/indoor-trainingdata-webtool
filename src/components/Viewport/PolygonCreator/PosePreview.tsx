import { PoseType } from "../../../hooks/offscreen/useDataGeneratorUtils";
import usePrecomputedPoses from "../../../hooks/state/usePrecomputedPoses";
import React from "react";

const PosesPreview = () => {
  const { poses, posttrainingPoses } = usePrecomputedPoses();
  
  // Process normal poses
  const withSmallerTarget = poses.map((pose) => {
    return {
      position: pose.position,
      target: pose.target.clone().sub(pose.position).multiplyScalar(0.1).add(pose.position),
      type: pose.type,
      isPosttraining: false
    }
  });

  // Process posttraining poses
  const posttrainingWithSmallerTarget = posttrainingPoses.map((pose) => {
    return {
      position: pose.position,
      target: pose.target.clone().sub(pose.position).multiplyScalar(0.1).add(pose.position),
      type: pose.type,
      isPosttraining: true
    }
  });

  // Combine all poses
  const allPoses = [...withSmallerTarget, ...posttrainingWithSmallerTarget];

  // Find pairs for normal poses
  const posePairs = [];
  for (const p1 of poses) {
    if (p1.type === PoseType.PAIR) {
      // find the 1st image
      const pair = poses.find(p2 => p2.type === PoseType.SINGLE && p1.series === p2.series);
      if (pair) {
        posePairs.push({ p1, p2: pair });
      }
    }
  }

  // Find pairs for posttraining poses
  const posttrainingPosePairs = [];
  for (const p1 of posttrainingPoses) {
    if (p1.type === PoseType.PAIR) {
      // find the 1st image
      const pair = posttrainingPoses.find(p2 => p2.type === PoseType.SINGLE && p1.series === p2.series);
      if (pair) {
        posttrainingPosePairs.push({ p1, p2: pair });
      }
    }
  }

  return (
    <>
      {allPoses.map((pose, index) => (
        <React.Fragment key={index}>
          <mesh position={pose.position}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshBasicMaterial color={
              pose.isPosttraining 
                ? "cyan" 
                : pose.type === PoseType.PAIR 
                  ? "violet" 
                  : "white"
            } />
          </mesh>
          <line>
            <bufferGeometry attach="geometry" ref={(geometry) => geometry && geometry.setFromPoints([pose.position, pose.target])} />
            <lineBasicMaterial attach="material" color={
              pose.isPosttraining 
                ? "cyan" 
                : pose.type === PoseType.PAIR 
                  ? "violet" 
                  : "white"
            } />
          </line>
        </React.Fragment>
      ))}
      {/* Draw lines between normal pose pairs */}
      {posePairs.map((pair, index) => (
        <React.Fragment key={`normal-${index}`}>
          <line>
            <bufferGeometry attach="geometry" ref={(geometry) => geometry && geometry.setFromPoints([pair.p1.position, pair.p2.position])} />
            <lineBasicMaterial attach="material" color="green" />
          </line>
        </React.Fragment>
      ))}
      {/* Draw lines between posttraining pose pairs */}
      {posttrainingPosePairs.map((pair, index) => (
        <React.Fragment key={`posttraining-${index}`}>
          <line>
            <bufferGeometry attach="geometry" ref={(geometry) => geometry && geometry.setFromPoints([pair.p1.position, pair.p2.position])} />
            <lineBasicMaterial attach="material" color="cyan" />
          </line>
        </React.Fragment>
      ))}
    </>
  );
}

export default PosesPreview;