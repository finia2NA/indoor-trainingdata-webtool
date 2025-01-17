import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StartPage from './pages/StartPage';
import Error404Page from './pages/Error404Page';
import ViewPage from './pages/ViewPage';
import TopBar from './components/TopBar';
import { Flip, ToastContainer } from 'react-toastify';

function App() {
  return (
    <>
      <Router>
        <TopBar />
        <div className="pt-16 h-full w-full bg-slate-300">
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/view/:id" element={<ViewPage />} />
            <Route path="/404" element={<Error404Page />} />
            <Route path="*" element={<Error404Page />} />
          </Routes>
        </div >
      </Router>
      <ToastContainer
        position='bottom-right'
        transition={Flip}
        hideProgressBar
        theme="dark"
      />
    </>
  );
}

export default App;
