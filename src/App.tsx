import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StartPage from './pages/StartPage';
import Error404Page from './pages/Error404Page';
import ViewPage from './pages/ViewPage';
import TopBar from './components/TopBar';
import { Flip, ToastContainer } from 'react-toastify';
import theme from "./muiTheme"
import { ThemeProvider } from '@mui/material/styles';

function App() {
  return (
    <>
    <ThemeProvider theme={theme}>
      <Router>
        <TopBar />
        <div className="pt-16 h-screen w-full bg-slate-300 overflow-hidden">
          <Routes>
            <Route path="/" element={<StartPage />} />
            <Route path="/view/:id/:editorMode?" element={<ViewPage />} />
            <Route path="/404" element={<Error404Page />} />
            <Route path="*" element={<Error404Page />} />
          </Routes>
        </div >
      </Router>
      <ToastContainer
        position='top-right'
        transition={Flip}
        hideProgressBar
        theme="dark"
      />
    </ThemeProvider>
    </>
  );
}

export default App;
