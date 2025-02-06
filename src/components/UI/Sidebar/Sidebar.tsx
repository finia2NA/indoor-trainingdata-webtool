import useEditorStore, { EditorMode, EditorState } from "../../../hooks/useEditorStore";
import LayoutSidebar from "./LayoutSidebar";
import Progress from "../Progress";
import PolygonSidebar from "./PolygonSidebar";
import GenerateSidebar from "./GenerateSidebar";


const Sidebar: React.FC = () => {

  const { editorMode } = useEditorStore((state) => state as EditorState);

  return (
    <div
      className="h-full w-full overflow-y-auto bg-oxford_blue
      ">
      <Progress />
      <div className="text-white">
        {editorMode === EditorMode.LAYOUT && <LayoutSidebar />}
        {editorMode === EditorMode.MAP && <PolygonSidebar />}
        {editorMode === EditorMode.GENERATE && <GenerateSidebar />}
      </div>
    </div>
  );
};

export default Sidebar;