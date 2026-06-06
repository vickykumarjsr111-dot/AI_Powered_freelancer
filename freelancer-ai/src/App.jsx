import { Routes, Route, useNavigate } from 'react-router-dom';
import VideoBackground from './components/Videobackground';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import BrowseJobs from './components/BrowseJobs';
import ClientDashboard from './components/Clientdashboard';
import ClientMessages from './components/Clientmessages';
import FreelancerMessages from './components/Freelancermessages';
import Chat from './components/Chat';
import FreelancerProposals from './components/Freelancerproposals';
import ClientContracts from './components/Clientcontracts';
import ClientAddJob from './components/Clientaddjob';
import ClientPayments from './components/Clientpayments';
import FreelancerEarnings from './components/Freelancerearnings';
import AIAssistant from './components/Aiassistant';
import './components/Aiassistant.css';

export default function App() {
  const navigate = useNavigate();

  return (
    <VideoBackground>
      <Routes>
        <Route path="/" element={<Navbar onNavigateToLogin={() => navigate('/login')} />} />
        <Route path="/login" element={<Login onBackToHome={() => navigate('/')} />} />

        {/* Freelancer routes */}
        <Route path="/freelancer/dashboard" element={<Dashboard />} />
        <Route path="/freelancer/profile"   element={<Profile />} />
        <Route path="/freelancer/jobs"      element={<BrowseJobs />} />
        <Route path="/freelancer/messages"  element={<FreelancerMessages />} />
        <Route path="/freelancer/proposals" element={<FreelancerProposals />} />
        <Route path="/freelancer/earnings"  element={<FreelancerEarnings />} />

        {/* Client routes */}
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/messages"  element={<ClientMessages />} />
        <Route path="/client/contracts" element={<ClientContracts />} />
        <Route path="/client/post-job"  element={<ClientAddJob />} />
        <Route path="/client/payments"  element={<ClientPayments />} />
        <Route path="/client/profile"   element={<Profile />} />
        {/* Shared */}
        <Route path="/chat/:chatId" element={<Chat />} />
        
      </Routes>
      <AIAssistant />
    </VideoBackground>
  );
}