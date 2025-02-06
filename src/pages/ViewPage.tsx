import { useNavigate, useParams } from "react-router-dom";
import db, { Model3D } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { isNumeric } from "../utils";
import Sidebar from "../components/UI/Sidebar/Sidebar";
import Editor from "../components/Viewport/Editor";
import { useEffect } from "react";
import useEditorStore, { EditorMode } from "../hooks/useEditorStore";

const ViewPage = () => {
  const { id, editorMode } = useParams();
  const navigate = useNavigate();
  // @ts-expect-error //Q: Why does this cause a ts error? It doesn't every other file I use it in.
  const { setEditorMode, resetEditorConfig } = useEditorStore((state) => state);

  // get our model, or redirect to 404 if it doesn't exist
  const model = useLiveQuery(
    async () => {
      let curr = null;
      if (!id || !isNumeric(id)) {
        navigate('/404');
        return null;
      }
      curr = await db.models.where('id').equals(Number(id)).first();
      if (!curr) {
        navigate('/404');
        return null;
      }
      return curr;
    },
    [id]
  );

  // When id changes, reset the editor
  // FIXME: does the 2nd useEffect always run 2nd? it needs to to keep the editormode in sync with the url. Investigate this.
  useEffect(() => {
    resetEditorConfig();
  }, [resetEditorConfig, id]);

  useEffect(() => {
    if (!editorMode) {
      navigate(`/view/${id}/layout`, { replace: true });
    }
    setEditorMode(editorMode as EditorMode);
  }, [editorMode, setEditorMode, id, navigate]);

  if (!model) {
    return <div>Loading...</div>;
  }

  // TODO: proper sizing
  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      <div className="flex-grow flex-shrink h-1/2 md:h-auto md:basis-3/4 min-h-[400px] min-w-0">
        <Editor model={model as Model3D} />
      </div>
      <div className="flex-grow flex-shrink h-1/2 md:h-auto md:basis-1/4 md:min-w-[400px] overflow-auto">
        <Sidebar />
      </div>
    </div>
  );
};

export default ViewPage;
