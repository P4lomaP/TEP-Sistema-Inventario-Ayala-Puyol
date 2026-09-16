import { useState } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [currentView, setCurrentView] = useState('login');

  return (
    <main>
      {currentView === 'login' ? (
        <Login onSwitchToRegister={() => setCurrentView('register')} />
      ) : (
        <Register onSwitchToLogin={() => setCurrentView('login')} />
      )}
    </main>
  );
}