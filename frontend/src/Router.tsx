import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import AdminPage from './pages/AdminPage';

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
