import useEditorStore, { EditorState } from "../../hooks/useEditorStore";
import LayoutSidebar from "./LayoutSidebar";
import Progress from "./Progress";
import PolygonSidebar from "./PolygonSidebar";


const Sidebar: React.FC = () => {

  const { editorMode } = useEditorStore((state) => state as EditorState);

  return (
    <div
      className="
       w-full bg-oxford_blue
      ">
      <Progress />
      <div className="text-white">

        {editorMode === 'layout' &&
          <LayoutSidebar />
        }
        {editorMode === 'map' &&
          <PolygonSidebar />
        }


      </div>
    </div>
  );
};

export default Sidebar;