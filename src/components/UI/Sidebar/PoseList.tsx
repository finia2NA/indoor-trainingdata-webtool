import { useState } from "react";
import { InteractiveInput } from "@designbyadrian/react-interactive-input";
import { Vector3, Quaternion, Matrix4 } from "three";
import { Pose, PostTrainingPose, PoseType } from "../../../hooks/offscreen/useDataGeneratorUtils";
import usePrecomputedPoses from "../../../hooks/state/usePrecomputedPoses";
import useMultiGenerationStore from "../../../hooks/state/useMultiGenerationStore";
import { useParams } from "react-router-dom";
import SidebarSection from "./SidebarSection";

const getQuaternionFromTarget = (position: Vector3, target: Vector3) => {
  const up = new Vector3(0, 1, 0);

  // Create a quaternion that looks from position towards target
  const quaternion = new Quaternion();
  const matrix = new Matrix4();
  matrix.lookAt(position, target, up);
  quaternion.setFromRotationMatrix(matrix);

  return quaternion;
};

const PoseList = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const { poses, posttrainingPoses, addPose, clearAllPoses } = usePrecomputedPoses();
  const { getFovRange } = useMultiGenerationStore();

  // Form state for adding new pose
  const [newPose, setNewPose] = useState({
    positionX: 0,
    positionY: 0,
    positionZ: 0,
    directionX: 1,
    directionY: 0,
    directionZ: 0,
  });

  const fovRange = getFovRange(projectId);
  const defaultFov = (fovRange[0] + fovRange[1]) / 2;

  const handleAddPose = () => {
    const position = new Vector3(newPose.positionX, newPose.positionY, newPose.positionZ);
    const direction = new Vector3(newPose.directionX, newPose.directionY, newPose.directionZ).normalize();
    const target = position.clone().add(direction);
    const quaternion = getQuaternionFromTarget(position, target);

    // Generate random series number between 200,000 and 500,000
    const series = Math.floor(Math.random() * (500000 - 200000 + 1)) + 200000;

    const pose: Pose = {
      position,
      target,
      quaternion,
      fov: defaultFov,
      series,
      type: PoseType.SINGLE,
    };

    addPose(pose);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPose();
    }
  };

  const formatVector = (vec: Vector3) => {
    return `(${vec.x.toFixed(2)}, ${vec.y.toFixed(2)}, ${vec.z.toFixed(2)})`;
  };

  const formatQuaternion = (quat: Quaternion) => {
    return `(${quat.x.toFixed(3)}, ${quat.y.toFixed(3)}, ${quat.z.toFixed(3)}, ${quat.w.toFixed(3)})`;
  };

  return (
    <SidebarSection title="Poses" level={2}>
      <div className="flex flex-col gap-4">

        {/* Add New Pose Section */}
        <SidebarSection title="Add New Pose" level={3}>
          <form onSubmit={(e) => { e.preventDefault(); handleAddPose(); }} className="flex flex-col gap-2">
            <div className="text-sm font-medium">Position</div>
            <div className="flex gap-2">
              <InteractiveInput
                className="w-16 text-center bg-inactive"
                type="number"
                step={0.1}
                value={newPose.positionX}
                onChange={(e) => setNewPose(prev => ({ ...prev, positionX: Number(e.target.value) }))}
                placeholder="X"
              />
              <InteractiveInput
                className="w-16 text-center bg-inactive"
                type="number"
                step={0.1}
                value={newPose.positionY}
                onChange={(e) => setNewPose(prev => ({ ...prev, positionY: Number(e.target.value) }))}
                placeholder="Y"
              />
              <InteractiveInput
                className="w-16 text-center bg-inactive"
                type="number"
                step={0.1}
                value={newPose.positionZ}
                onChange={(e) => setNewPose(prev => ({ ...prev, positionZ: Number(e.target.value) }))}
                placeholder="Z"
              />
            </div>

            <div className="text-sm font-medium">Direction Vector</div>
            <div className="flex gap-2">
              <InteractiveInput
                className="w-16 text-center bg-inactive"
                type="number"
                step={0.1}
                value={newPose.directionX}
                onChange={(e) => setNewPose(prev => ({ ...prev, directionX: Number(e.target.value) }))}
                placeholder="X"
              />
              <InteractiveInput
                className="w-16 text-center bg-inactive"
                type="number"
                step={0.1}
                value={newPose.directionY}
                onChange={(e) => setNewPose(prev => ({ ...prev, directionY: Number(e.target.value) }))}
                placeholder="Y"
              />
              <InteractiveInput
                className="w-16 text-center bg-inactive"
                type="number"
                step={0.1}
                value={newPose.directionZ}
                onChange={(e) => setNewPose(prev => ({ ...prev, directionZ: Number(e.target.value) }))}
                placeholder="Z"
              />
            </div>

            <button
              type="submit"
              className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Add Pose
            </button>
          </form>
        </SidebarSection>

        {/* Clear All Poses Button */}
        {(poses.length > 0 || posttrainingPoses.length > 0) && (
          <button
            onClick={clearAllPoses}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Clear All Poses
          </button>
        )}

        {/* Regular Poses List */}
        <SidebarSection title={`Regular Poses (${poses.length})`} level={3}>
          <div className="max-h-60 overflow-y-auto">
            {poses.length === 0 ? (
              <div className="text-gray-500 text-sm">No poses generated yet</div>
            ) : (
              <div className="space-y-2">
                {poses.map((pose, index) => (
                  <div key={index} className="p-2 bg-black rounded text-xs">
                    <div><strong>Series:</strong> {pose.series}{pose.type === PoseType.PAIR ? 'b' : 'a'}</div>
                    <div><strong>Type:</strong> {pose.type}</div>
                    <div><strong>Position:</strong> {formatVector(pose.position)}</div>
                    <div><strong>Target:</strong> {formatVector(pose.target)}</div>
                    <div><strong>Quaternion:</strong> {formatQuaternion(pose.quaternion)}</div>
                    <div><strong>FOV:</strong> {pose.fov.toFixed(1)}°</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SidebarSection>

        {/* Post-training Poses List */}
        <SidebarSection title={`Post-training Poses (${posttrainingPoses.length})`} level={3}>
          <div className="max-h-60 overflow-y-auto">
            {posttrainingPoses.length === 0 ? (
              <div className="text-gray-500 text-sm">No post-training poses generated yet</div>
            ) : (
              <div className="space-y-2">
                {posttrainingPoses.map((pose, index) => (
                  <div key={index} className="p-2 bg-black rounded text-xs">
                    <div><strong>Series:</strong> {pose.series}{pose.type === PoseType.PAIR ? 'b' : 'a'}</div>
                    <div><strong>Type:</strong> {pose.type}</div>
                    <div><strong>Image:</strong> {pose.imageName}</div>
                    <div><strong>Position:</strong> {formatVector(pose.position)}</div>
                    <div><strong>Target:</strong> {formatVector(pose.target)}</div>
                    <div><strong>Quaternion:</strong> {formatQuaternion(pose.quaternion)}</div>
                    <div><strong>FOV:</strong> {pose.fov.toFixed(1)}°</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SidebarSection>
      </div>
    </SidebarSection>
  );
};

export default PoseList;