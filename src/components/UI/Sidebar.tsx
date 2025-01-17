import useEditorStore, { EditorState } from "../../hooks/useEditorStore";
import Channelbox from "./Channelbox";
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
          <Channelbox />
        }
        {editorMode === 'map' &&
          <PolygonSidebar />
        }


      </div>
    </div>
  );
};

export default Sidebar;