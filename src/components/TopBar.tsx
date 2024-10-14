import { Link, useLocation } from 'react-router-dom';
import { MdArrowBackIosNew } from "react-icons/md";

const TopBar = () => {
  const location = useLocation();

  return (
    <div className="
    p-4 w-full fixed top-0 max-h-16
    bg-oxford_blue text-white
    flex flex-row
    items-center
    justify-between
    ">
      {location.pathname !== '/' && (
        <Link to="/" className="text-blue-500 underline">
          <div className='bg-white rounded-full p-2'>
            <MdArrowBackIosNew className='text-oxford_blue' />
          </div>
        </Link>
      )}
      <div className="flex-grow text-center">
        <h1 className="text-xl">Webtool</h1>
      </div>
    </div>
  );
}

export default TopBar;