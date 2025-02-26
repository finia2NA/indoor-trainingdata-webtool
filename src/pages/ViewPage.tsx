import { useNavigate, useParams } from "react-router-dom";
import db, { Model3D } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { isNumeric } from "../util/validation";
import Sidebar from "../components/UI/Sidebar/Sidebar";
import Editor from "../components/Viewport/Editor";
import { useEffect } from "react";
import useEditorStore, { EditorMode } from "../hooks/useEditorStore";

const ViewPage = () => {
  const { id, editorMode } = useParams();
  const navigate = useNavigate();
  const { setEditorMode, resetEditorConfig } = useEditorStore();

  // When id changes, reset the editor
  // FIXME: does the 2nd useEffect always run 2nd? it needs to to keep the editormode in sync with the url. Investigate this.
  useEffect(() => {
    resetEditorConfig();
  }, [resetEditorConfig, id]);

  const project = useLiveQuery(() => db.projects.get(Number(id)), [id]);
  useEffect(() => {
    if (!id || !isNumeric(id)) {
      navigate("/404");
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!editorMode) {
      navigate(`/view/${id}/layout`, { replace: true });
    }
    setEditorMode(editorMode as EditorMode);
  }, [editorMode, setEditorMode, id, navigate]);

  if (!project) {
    return <div>Loading...</div>;
  }

  // TODO: proper sizing
  return (
    <div className="flex flex-col lg:flex-row h-full w-full">
      <div className="flex-grow flex-shrink h-1/2 lg:h-auto lg:basis-3/4 min-h-[400px] min-w-0">
        <Editor project={project} />
      </div>
      <div className="flex-grow flex-shrink h-1/2 lg:h-auto lg:basis-1/4 lg:min-w-[400px] overflow-auto">
        <Sidebar project={project} />
      </div>
    </div>
  );
};

export default ViewPage;
