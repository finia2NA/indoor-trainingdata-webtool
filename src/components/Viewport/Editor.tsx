import { Project } from "../../data/db"
import useEditorStore, { EditorMode, EditorState } from "../../hooks/state/useEditorStore";
import { PolygonCreatorToggles, TransformToggles, ViewmodeToggles } from "./Multitoggle"
import ViewcubeViz from "./Minipanels/ViewcubeViz"
import Viewport from "./Viewport"
import CameraPoseDisplay from "./CameraPoseDisplay";
import { Image360 } from '../../util/get360s';
import { useState } from "react";
import View360Overlay from './View360Overlay';



type EditorProps = {
  project: Project;
}


const Editor = ({ project }: EditorProps) => {

  const { editorMode } = useEditorStore(state => state as EditorState)
  const [selectedImage, setSelectedImage] = useState<Image360 | null>(null);



  return (
    <div className="h-full w-full relative">
      <Viewport project={project} setSelectedImage={setSelectedImage} />
      <div className="
          absolute top-0 left-0 w-full h-full
          grid grid-cols-2 grid-rows-2
          pointer-events-none
        ">
        <div className="flex flex-row gap-2 items-start justify-start p-2">
          {/* Top Left Corner Content */}
          <View360Overlay selectedImage={selectedImage} />
          {editorMode === EditorMode.LAYOUT &&
            <TransformToggles />
          }
          {editorMode === EditorMode.MAP &&
            <PolygonCreatorToggles />
          }
        </div>
        <div className="flex items-start justify-end p-2">
          {/* Top Right Corner Content */}
          <div className="h-28 w-52">
          </div>
        </div>
        <div className="flex flex-col items-start justify-end p-2 gap-1">
          {/* Bottom Left Corner Content */}
          <ViewmodeToggles />
          <div className="h-28 w-28">
            <ViewcubeViz />
          </div>
        </div>
        <div className="flex items-end justify-end p-2">
          {/* Bottom Right Corner Content */}
          <CameraPoseDisplay />
        </div>
      </div>
    </div>
  )
}

export default Editor