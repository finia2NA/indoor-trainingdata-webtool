import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import UploadComponent from './components/UploadComponent';
import ModelOverview from './components/ModelOverview';

function App() {
  return (
    // <Router>
    //   <div>
    //     <Routes>
    //       <Route path="/" element={<Home />} />
    //       <Route path="/upload" element={<Upload />} />
    //     </Routes>
    //   </div>
    // </Router>



    <>
      <span className='font-bold text-2xl'>Hello World</span>
      <UploadComponent />
      <ModelOverview />
    </>
  );
}

export default App;