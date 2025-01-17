import useEditorStore, { EditorState } from "../../hooks/useEditorStore.ts";
import { InteractiveInput } from '@designbyadrian/react-interactive-input';




const PolygonSidebar: React.FC = () => {

  const {  polygonHeight, setPolygonHeight, polygonSize, setPolygonSize } = useEditorStore((state) => state as EditorState);

  return (
    <div className='flex flex-row px-1 gap-1'>
      <InteractiveInput
        className='w-20 text-right bg-dim_gray  basis-1/3'
        type="number"
        min={-3} max={3} step={0.01}
        value={polygonHeight}
        onChange={e => setPolygonHeight(parseFloat(e.target.value))}
      />
      <InteractiveInput
        className='w-20 text-right bg-dim_gray  basis-1/3'
        type="number"
        min={1} max={50} step={1}
        value={polygonSize}
        onChange={e => setPolygonSize(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default PolygonSidebar;