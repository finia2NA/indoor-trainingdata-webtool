import usePolygonCreatorStore from "../../hooks/usePolygonCreatorStore.ts";
import InputWithDrag from 'react-input-with-drag';



const Map: React.FC = () => {

  const { height, setHeight } = usePolygonCreatorStore((state) => state);

  return (
    <div className='flex flex-row px-1 gap-1'>
    {/* //   <InputWithDrag
    //     className='w-20 text-right bg-dim_gray  basis-1/3'
    //     type="number"
    //     min={0} max={100} step={1}
    //     value={height}
    //     onChange={setHeight}
    //   /> */}
    </div>
  );
};

export default Map;