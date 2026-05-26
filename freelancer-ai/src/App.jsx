import { Routes, Route, useNavigate } from 'react-router-dom';
import VideoBackground from './components/VideoBackground';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import BrowseJobs from './components/BrowseJobs';
import ClientDashboard from './components/ClientDashboard';
import ClientMessages from './components/ClientMessages';
import FreelancerMessages from './components/FreelancerMessages';
import Chat from './components/Chat';
import FreelancerProposals from './components/Freelancerproposals';
import ClientContracts from './components/Clientcontracts';
import ClientAddJob    from './components/ClientAddJob';

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
          path="/freelancer/messages"
          element={<FreelancerMessages />}
        />

        <Route
          path="/freelancer/proposals"
          element={<FreelancerProposals />}
        />

        <Route
          path="/client/dashboard"
          element={<ClientDashboard />}
        />

        <Route
          path="/client/messages"
          element={<ClientMessages />}
        />

        <Route
          path="/client/contracts"
          element={<ClientContracts />}
        />

        <Route
          path="/chat/:chatId"
          element={<Chat />}
        />

        <Route path="/client/post-job"   element={<ClientAddJob />} />
        <Route path="/client/contracts"  element={<ClientContracts />} />
      </Routes>
    </VideoBackground>
  );
}