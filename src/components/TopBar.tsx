import { Link, useLocation, useParams } from 'react-router-dom';
import { MdArrowBackIosNew } from "react-icons/md";
import { useLiveQuery } from 'dexie-react-hooks';
import db from '../data/db';

const TopBar = () => {
  const location = useLocation();
  const { id } = useParams<{ id: string; editorMode?: string }>();

  // Extract ID from pathname as fallback
  const pathId = location.pathname.startsWith('/view/')
    ? location.pathname.split('/')[2]
    : undefined;
  const projectId = id || pathId;

  const project = useLiveQuery(
    () => projectId ? db.projects.get(Number(projectId)) : undefined,
    [projectId]
  );

  console.log('TopBar debug:', { id, pathId, projectId, project, pathname: location.pathname });

  return (
    <div className="
    p-4 w-full fixed top-0 max-h-16
    bg-bg text-white
    flex flex-row
    items-center
    justify-between
    ">
      {location.pathname !== '/' && (
        <Link to="/" className="text-blue-500 underline">
          <div className='bg-white rounded-full p-2'>
            <MdArrowBackIosNew className='text-bg' />
          </div>
        </Link>
      )}
      <div className="flex-grow text-center">
        <h1 className="text-xl">{project?.name ? 'Webtool: ' + project?.name : 'Webtool'}</h1>
      </div>
    </div>
  );
}

export default TopBar;