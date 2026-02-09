import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RoleSwitcher from './pages/RoleSwitcher';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MalikDashboard from './pages/MalikDashboard';
import BhadotDashboard from './pages/BhadotDashboard';
import MalikRegister from './pages/MalikRegister';
import BhadotRegister from './pages/BhadotRegister';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSwitcher />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/malik/register" element={<MalikRegister />} />
        <Route path="/malik/dashboard/:id" element={<MalikDashboard />} />
        <Route path="/bhadot/register" element={<BhadotRegister />} />
        <Route path="/bhadot/dashboard/:id" element={<BhadotDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

