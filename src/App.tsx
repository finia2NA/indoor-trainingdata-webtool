import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Display from './pages/Display';

function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/display" element={<Display />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;