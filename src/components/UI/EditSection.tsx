import useEditorStore, { EditorState } from "../../hooks/useEditorStore";
import Channelbox from "./Channelbox";
import Progress from "./Progress";


const EditSection: React.FC = () => {

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

      </div>
    </div>
  );
};

export default EditSection;