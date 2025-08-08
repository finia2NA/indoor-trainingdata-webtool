import useCameraPoseStore from '../../hooks/sync/useCameraPoseStore';
import { Image360 } from '../../util/get360s';

type View360OverlayProps = {
  selectedImage?: Image360 | null;
  onExit?: () => void;
};

const View360Overlay = ({ selectedImage, onExit }: View360OverlayProps) => {
  const { is360ViewActive, exit360View, sphereOpacity, setSphereOpacity } = useCameraPoseStore();
  
  const handleExit = () => {
    exit360View();
    if (onExit) onExit();
  };

  if (!is360ViewActive) return null;

  return (
    <div className="fixed top-20 left-4 z-50 bg-black bg-opacity-50 rounded-lg p-4 space-y-3">
      <button
        onClick={handleExit}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2 w-full"
      >
        <span>←</span>
        Exit 360° View
      </button>
      
      {selectedImage && (
        <div className="text-white space-y-2">
          <h3 className="text-sm font-medium border-b border-gray-400 pb-1">Image Properties</h3>
          <div className="text-xs space-y-1">
            <div><span className="text-gray-300">Name:</span> {selectedImage.name}</div>
            <div><span className="text-gray-300">Position:</span> ({selectedImage.x.toFixed(3)}, {selectedImage.y.toFixed(3)}, {selectedImage.z.toFixed(3)})</div>
            <div><span className="text-gray-300">Course:</span> {selectedImage.course.toFixed(1)}°</div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2 text-white">
        <label htmlFor="opacity-slider" className="text-sm font-medium">
          Sphere Opacity
        </label>
        <div className="flex items-center gap-2">
          <input
            id="opacity-slider"
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={sphereOpacity}
            onChange={(e) => setSphereOpacity(Number(e.target.value))}
            className="flex-grow"
          />
          <span className="text-xs min-w-[2rem]">{Math.round(sphereOpacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
};

export default View360Overlay;