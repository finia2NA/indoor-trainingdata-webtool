import { useNavigate, useParams } from "react-router-dom";
import db, { Model } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { isNumeric } from "../utils";
import Viewport from "../components/Viewport";

const ViewPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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
    <div className="flex flex-row h-full w-screen">
      <div className="basis-3/4">
        <Viewport model={model as Model} />
      </div>
      <div className="basis-1/4">
        hi
      </div>
    </div>
  );
};

export default ViewPage;
