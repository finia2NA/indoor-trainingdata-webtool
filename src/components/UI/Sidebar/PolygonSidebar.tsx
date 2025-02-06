import useEditorStore, { EditorState } from "../../../hooks/useEditorStore.ts";
import { InteractiveInput } from '@designbyadrian/react-interactive-input';
import SidebarSection from "./SidebarSection.tsx";
import PolygonTree from "./PolygonTree.tsx";




const PolygonSidebar: React.FC = () => {
  const { polygonHeight, setPolygonHeight, polygonSize, setPolygonSize } = useEditorStore((state) => state as EditorState);


  const setHeight = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPolygonHeight(parseFloat(e.target.value));
  }

  const setSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPolygonSize(parseFloat(e.target.value));
  }

  const surfaceElements = [
    { name: "Height", value: polygonHeight, min: -3, max: 3, step: 0.01, onChange: setHeight },
    { name: "Size", value: polygonSize, min: 1, max: 50, step: 1, onChange: setSize },
  ];

  return (
    <>
      <SidebarSection className="m-2" title="Surface Controls">
        {surfaceElements.map((el) => (
          <div key={el.name} className="flex items-center mb-2">
            <label className="mr-2 w-20">{el.name}</label>
            <InteractiveInput
              className='w-32 text-center bg-dim_gray basis-1/3'
              type="number"
              min={el.min} max={el.max} step={el.step}
              value={el.value}
              onChange={el.onChange}
            />
          </div>
        ))}
      </SidebarSection>
      <SidebarSection className="m-2" title="Polygons">
        <PolygonTree />
      </SidebarSection>
    </>
  );
};

export default PolygonSidebar;