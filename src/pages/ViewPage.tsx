import { useNavigate, useParams } from "react-router-dom";
import db, { Model3D } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { isNumeric } from "../utils";
import Sidebar from "../components/UI/Sidebar/Sidebar";
import Editor from "../components/Viewport/Editor";

const ViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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

  if (!model) {
    return <div>Loading...</div>;
  }

  // TODO: proper sizing
  return (
    <div className="flex flex-row h-full w-full flex-grow flex-shrink">
      <div className="flex-grow flex-shrink basis-3/4 min-h-[400px]">
        <Editor model={model as Model3D} />
      </div>
      <div className="flex-grow flex-shrink basis-1/4">
        <Sidebar />
      </div>
    </div>
  );
};

export default ViewPage;
