import usePolygonCreatorStore from "../../hooks/usePolygonCreatorStore.ts";
import { InteractiveInput } from '@designbyadrian/react-interactive-input';




const Map: React.FC = () => {

  const { height, setHeight } = usePolygonCreatorStore((state) => state);

  return (
    <div className='flex flex-row px-1 gap-1'>
      <InteractiveInput
        className='w-20 text-right bg-dim_gray  basis-1/3'
        type="number"
        min={-3} max={3} step={0.01}
        value={height}
        onChange={e => setHeight(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default Map;