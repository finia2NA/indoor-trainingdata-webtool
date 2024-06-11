import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StartPage from './pages/StartPage';
import Error404Page from './pages/Error404Page';
import ViewPage from './pages/ViewPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/view/:id" element={<ViewPage />} />
        <Route path="/404" element={<Error404Page />} />
        <Route path="*" element={<Error404Page />} />
      </Routes>
    </Router>
  );
}

export default App;