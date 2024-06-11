import { Link } from 'react-router-dom';

function Home() {
  return (
    <div>
      <h1>Welcome to the File Upload App</h1>
      <Link to="/upload">Go to Upload Page</Link>
    </div>
  );
}

export default Home;