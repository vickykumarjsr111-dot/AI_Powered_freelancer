import { useState } from 'react';
import Home from './components/Navbar';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import VideoBackground from './components/VideoBackground';

export default function App() {
  const [currentPage, setCurrentPage] = useState('Home');
  const [user, setUser] = useState(null);

  const navigateToLogin = () => setCurrentPage('Login');
  const navigateToHome = () => setCurrentPage('Home');

  const handleLogin = (e) => {
    e.preventDefault();
    setUser({ name: 'Alex Kumar', role: 'Full-Stack Dev', initials: 'AK' });
    setCurrentPage('Dashboard');
  };

  const renderPage = () => {
    if (currentPage === 'Dashboard' && user) {
      return <Dashboard user={user} />;
    }
    if (currentPage === 'Login') {
      return <Login onBackToHome={navigateToHome} onLogin={handleLogin} />;
    }
    return <Home onNavigateToLogin={navigateToLogin} />;
  };

  return (
    <VideoBackground>
      {renderPage()}
    </VideoBackground>
  );
}