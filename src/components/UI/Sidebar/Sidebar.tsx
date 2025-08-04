import useEditorStore, { EditorMode, EditorState } from "../../../hooks/state/useEditorStore";
import LayoutSidebar from "./LayoutSidebar";
import Progress from "../Progress";
import PolygonSidebar from "./PolygonSidebar";
import GenerateSidebar from "./GenerateSidebar";
import { Project } from "../../../data/db";
import DebugSidebar from "./DebugSidebar";

type SidebarProps = {
  project: Project;
};

const Sidebar = ({ project }: SidebarProps) => {

  const { editorMode } = useEditorStore((state) => state as EditorState);

  return (
    <div
      className="h-full w-full overflow-y-auto bg-bg
      ">
      <Progress />
      <div className="text-white">
        {editorMode === EditorMode.LAYOUT && <LayoutSidebar project={project} />}
        {editorMode === EditorMode.MAP && <PolygonSidebar />}
        {editorMode === EditorMode.GENERATE && <GenerateSidebar project={project}/>}
        {editorMode === EditorMode.DEBUG && <DebugSidebar project={project}/>}

      </div>
    </div>
  );
};

export default Sidebar;