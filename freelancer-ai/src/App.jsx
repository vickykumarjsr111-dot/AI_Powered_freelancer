import { Routes, Route, useNavigate } from 'react-router-dom';
import VideoBackground from './components/VideoBackground';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import BrowseJobs from './components/BrowseJobs';

export default function App() {
  const navigate = useNavigate();

  return (
    <VideoBackground>
      <Routes>
        <Route
          path="/"
          element={<Navbar onNavigateToLogin={() => navigate('/login')} />}
        />

        <Route
          path="/login"
          element={<Login onBackToHome={() => navigate('/')} />}
        />

        <Route
          path="/freelancer/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/freelancer/profile"
          element={<Profile />}
        />

        <Route
          path="/freelancer/jobs"
          element={<BrowseJobs />}
        />

        <Route
          path="/client/dashboard"
          element={<div>Client Dashboard</div>}
        />
      </Routes>
    </VideoBackground>
  );
}