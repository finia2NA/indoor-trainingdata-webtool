import { Model3D } from "../../data/db"
import useEditorStore, { EditorMode, EditorState } from "../../hooks/useEditorStore";
import { PolygonCreatorToggles, TransformToggles, ViewmodeToggles } from "./Multitoggle"
import ViewcubeViz from "./ViewcubeViz"
import Viewport from "./Viewport"

interface EditorProps {
  model: Model3D;
}


const Editor = ({ model }: EditorProps) => {

  const { editorMode } = useEditorStore(state => state as EditorState)

  return (
    <div className="h-full w-full relative">
      <Viewport model={model as Model3D} />
      <div className="
          absolute top-0 left-0 w-full h-full
          grid grid-cols-2 grid-rows-2
          pointer-events-none
        ">
        <div className="flex items-start justify-start p-2">
          {/* Top Left Corner Content */}
          {editorMode === EditorMode.LAYOUT &&
            <TransformToggles />
          }
          {editorMode === EditorMode.MAP &&
            <PolygonCreatorToggles />
          }
        </div>
        <div className="flex items-start justify-end p-2">
          {/* Top Right Corner Content */}
          {/* <div className="h-28 w-28" ref={aref}>
            <Stats parent={aref} />
          </div> */}
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
        </div>
      </div>
    </div>
  )
}

export default Editor