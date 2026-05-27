import { Routes, Route, useNavigate } from 'react-router-dom';

import VideoBackground from './components/VideoBackground';

import Navbar from './components/Navbar';

import Login from './components/Login';

import Dashboard from './components/Dashboard';

import Profile from './components/Profile';

import BrowseJobs from './components/BrowseJobs';

import Earnings from './components/Earnings';

import ClientDashboard from './components/Clientdashboard';

import ClientMessages from './components/ClientMessages';

import FreelancerMessages from './components/Freelancermessages';

import Chat from './components/Chat';

import FreelancerProposals from './components/Freelancerproposals';

import ClientContracts from './components/Clientcontracts';

import ClientAddJob from './components/Clientaddjob';

import Settings from './components/Settings';

export default function App() {

  const navigate = useNavigate();

  return (

    <Routes>

      {/* HOME */}

      <Route
        path="/"
        element={
          <VideoBackground>

            <Navbar
              onNavigateToLogin={() =>
                navigate('/login')
              }
            />

          </VideoBackground>
        }
      />

      {/* LOGIN */}

      <Route
        path="/login"
        element={
          <VideoBackground>

            <Login
              onBackToHome={() =>
                navigate('/')
              }
            />

          </VideoBackground>
        }
      />

      {/* FREELANCER */}

      <Route
        path="/freelancer/dashboard"
        element={<Dashboard />}
      />

      <Route
        path="/freelancer/earnings"
        element={<Earnings />}
      />

      {/* UPDATE PROFILE PAGE */}

      <Route
        path="/freelancer/profile"
        element={<Profile />}
      />

      {/* SETTINGS PAGE */}

      <Route
        path="/freelancer/settings"
        element={<Settings />}
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

      {/* CLIENT */}

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
        path="/client/post-job"
        element={<ClientAddJob />}
      />

      {/* CHAT */}

      <Route
        path="/chat/:chatId"
        element={<Chat />}
      />

    </Routes>
  );
}