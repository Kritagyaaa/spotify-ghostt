import styles from './App.module.css';
import { useState } from "react";
import { Header } from './components/Header/Header.jsx';
import { LibrarySidebar } from './components/LibrarySidebar/LibrarySidebar.jsx';
import { PlayerBar } from './components/PlayerBar/PlayerBar.jsx';
import { RightSidebar } from './components/RightSidebar/RightSidebar.jsx';
import { MainPage } from './components/MainPage';
import { PlaylistView } from "./components/PlaylistView/PlaylistView";
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import AccountPage from './components/Auth/AccountPage';

function App() {
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  });
  const [showAuthScreen, setShowAuthScreen] = useState('login'); // 'login' or 'signup'
  const [currentView, setCurrentView] = useState('main'); // 'main' or 'account'

  const handleLoginSuccess = (token, loggedInUser) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentView('main');
  };

  if (!isAuthenticated) {
    if (showAuthScreen === 'login') {
      return (
        <Login
          onShowSignUp={() => setShowAuthScreen('signup')}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    } else {
      return (
        <SignUp
          onShowLogin={() => setShowAuthScreen('login')}
          onSignUpSuccess={() => setShowAuthScreen('login')}
        />
      );
    }
  }

  return (
    <div className={styles.appFrame}>
      <Header
        onHomeClick={() => { setSelectedPlaylist(null); setCurrentView('main'); }}
        user={user}
        onLogout={handleLogout}
        onAccountClick={() => setCurrentView('account')}
      />
      <div className={styles.appShell}>
        <LibrarySidebar
          onPlaylistSelect={(playlist) => {
            setSelectedPlaylist(playlist);
            setCurrentView('main');
          }}
          selectedPlaylist={selectedPlaylist}
        />
        <main
          className={styles.mainPlaceholder}
          aria-label="Main content"
        >
          {currentView === 'account' ? (
            <AccountPage
              user={user}
              onProfileUpdate={(updated) => setUser(updated)}
              onBackToMain={() => setCurrentView('main')}
            />
          ) : selectedPlaylist ? (
            <PlaylistView playlist={selectedPlaylist} />
          ) : (
            <MainPage />
          )}
        </main>
        <RightSidebar />
      </div>
      <PlayerBar />
    </div>
  );
}

export default App;
