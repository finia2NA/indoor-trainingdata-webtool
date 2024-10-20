import { useNavigate, useParams } from "react-router-dom";
import db, { Model3D } from "../data/db";
import { useLiveQuery } from "dexie-react-hooks";
import { isNumeric } from "../utils";
import Viewport from "../components/Viewport/Viewport";
import { ViewmodeToggles, TransformToggles } from "../components/Viewport/Multitoggle";
import ViewcubeViz from "../components/Viewport/ViewcubeViz";
import Channelbox from "../components/UI/Channelbox";

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
    <div className="flex flex-row h-full w-screen">
      <div className="basis-3/4 relative">
        <Viewport model={model as Model3D} />
        <div className="
          absolute top-0 left-0 w-full h-full
          grid grid-cols-2 grid-rows-2
          pointer-events-none
        ">
          <div className="flex items-start justify-start p-2">
            {/* Top Left Corner Content */}
            <TransformToggles />
          </div>
          <div className="flex items-start justify-end p-2">
            {/* Top Right Corner Content */}
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
      <div className="basis-1/4">
        <Channelbox />
      </div>
    </div>
  );
};

export default ViewPage;
