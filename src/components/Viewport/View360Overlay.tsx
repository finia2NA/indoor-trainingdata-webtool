import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import { Image360 } from '../../util/get360s';
import { Slider } from "@mui/material";
import { Project } from '../../data/db';
import useMultiTransformationStore from '../../hooks/state/useMultiTransformationStore';

type View360OverlayProps = {
  selectedImage?: Image360 | null;
  onExit?: () => void;
  project: Project;
};

const View360Overlay = ({ selectedImage, onExit, project }: View360OverlayProps) => {
  const { is360ViewActive, restoreCameraPose, exit360ViewWithoutReset, sphereOpacity, setSphereOpacity } = useCameraPoseStore();
  const { getCourseCorrection, setCourseCorrection, getFineCourseCorrection, setFineCourseCorrection, getCourseCorrectionOrNull, getFineCorrectionOrNull, removeCourseCorrection, removeFineCourseCorrection } = useMultiTransformationStore();

  const projectId = project.id;
  if (!projectId) {
    throw new Error("Project has no id");
  }

  const handleExit = () => {
    restoreCameraPose();
    if (onExit) onExit();
  };

  const handleExitWithoutReset = () => {
    exit360ViewWithoutReset();
    if (onExit) onExit();
  };

  if (!is360ViewActive) return null;

  return (
    <div className="bg-bg bg-opacity-70 px-2 py-3 space-y-3 pointer-events-auto">
      <div className="flex flex-col gap-2">
        <button
          onClick={handleExit}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 w-full"
        >
          <span>←</span>
          Exit & Return to Position
        </button>
        <button
          onClick={handleExitWithoutReset}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 w-full"
        >
          <span>×</span>
          Exit & Stay Here
        </button>
      </div>

      {selectedImage && (
        <div className="text-white space-y-2">
          <h3 className="text-sm font-medium border-b border-gray-400 pb-1">Image Properties</h3>
          <div className="text-xs space-y-1">
            <div><span className="text-gray-300">Name:</span> {selectedImage.name}</div>
            <div><span className="text-gray-300">Position:</span> ({selectedImage.x.toFixed(3)}, {selectedImage.y.toFixed(3)}, {selectedImage.z.toFixed(3)})</div>
            <div className="flex items-center gap-2">
              <span className="text-gray-300">Course:</span> 
              <span>{selectedImage.course.toFixed(1)}°</span>
              {((getCourseCorrectionOrNull(projectId, selectedImage.name) !== null) || (getFineCorrectionOrNull(projectId, selectedImage.name) !== null)) && (
                <span className="text-green-400 text-xs">,modified</span>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div className="flex flex-col gap-3 text-white">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Course Correction
            </label>
            <button
              onClick={() => {
                removeCourseCorrection(projectId, selectedImage.name);
                removeFineCourseCorrection(projectId, selectedImage.name);
              }}
              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
            >
              Reset
            </button>
          </div>

          {/* Fine Course Correction (-5 to +5) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-300">Fine (-5° to +5°)</label>
            <div className="flex items-center gap-4">
              <Slider
                color="secondary"
                getAriaLabel={() => 'Fine Course Correction'}
                value={getFineCourseCorrection(projectId, selectedImage.name)}
                onChange={(_, value) => setFineCourseCorrection(projectId, selectedImage.name, value as number)}
                valueLabelDisplay="off"
                getAriaValueText={(value) => `${value}°`}
                min={-5}
                max={5}
                step={0.1}
                className="flex-grow"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    color: 'primary.main',
                    '&:hover, &:focus-visible': {
                      boxShadow: '0px 0px 0px 6px rgba(0, 0, 0, 0.3)',
                    },
                  },
                }}
              />
              <span className="text-xs min-w-[2.5rem]">{getFineCourseCorrection(projectId, selectedImage.name).toFixed(1)}°</span>
            </div>
          </div>

          {/* Coarse Course Correction (-180 to +180, steps of 10) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-300">Coarse (-180° to +180°, 10° steps)</label>
            <div className="flex items-center gap-4">
              <Slider
                color="secondary"
                getAriaLabel={() => 'Coarse Course Correction'}
                value={getCourseCorrection(projectId, selectedImage.name)}
                onChange={(_, value) => setCourseCorrection(projectId, selectedImage.name, value as number)}
                valueLabelDisplay="off"
                getAriaValueText={(value) => `${value}°`}
                min={-180}
                max={180}
                step={10}
                className="flex-grow"
                sx={{
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                    color: 'primary.main',
                    '&:hover, &:focus-visible': {
                      boxShadow: '0px 0px 0px 6px rgba(0, 0, 0, 0.3)',
                    },
                  },
                }}
              />
              <span className="text-xs min-w-[2.5rem]">{getCourseCorrection(projectId, selectedImage.name)}°</span>
            </div>
          </div>
        </div>
      )}

      <hr className="border-gray-400" />

      <div className="flex flex-col gap-2 text-white">
        <label htmlFor="opacity-slider" className="text-sm font-medium">
          Sphere Opacity
        </label>
        <div className="flex items-center gap-4">
          <Slider
            color="secondary"
            getAriaLabel={() => 'Sphere Opacity'}
            value={sphereOpacity}
            onChange={(_, value) => setSphereOpacity(value as number)}
            valueLabelDisplay="off"
            getAriaValueText={(value) => `${Math.round(value * 100)}%`}
            min={0}
            max={1}
            step={0.01}
            className="flex-grow"
            sx={{
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                color: 'primary.main',
                '&:hover, &:focus-visible': {
                  boxShadow: '0px 0px 0px 6px rgba(0, 0, 0, 0.3)',
                },
              },
            }}
          />
          <span className="text-xs min-w-[2rem]">{Math.round(sphereOpacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default View360Overlay;