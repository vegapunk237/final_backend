import { useState } from 'react';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import ParentSignup from './components/ParentSignup';
import TeacherSignup from './components/TeacherSignup';
import ParentDashboard from './components/ParentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import AppointmentPage from './components/AppointmentPage';
import PaymentPage from './components/PaymentPage';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  const navigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    if (user.role === 'parent') {
      navigate('parent-dashboard');
    } else if (user.role === 'teacher') {
      navigate('teacher-dashboard');
    } else if (user.role === 'admin') {
      navigate('admin-dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('home');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage navigate={navigate} />;
      case 'login':
        return <LoginPage navigate={navigate} onLogin={handleLogin} />;
      case 'parent-signup':
        return <ParentSignup navigate={navigate} />;
      case 'teacher-signup':
        return <TeacherSignup navigate={navigate} />;
      case 'parent-dashboard':
        return <ParentDashboard navigate={navigate} user={currentUser} onLogout={handleLogout} />;
      case 'teacher-dashboard':
        return <TeacherDashboard navigate={navigate} user={currentUser} onLogout={handleLogout} />;
      case 'admin-dashboard':
        return <AdminDashboard navigate={navigate} user={currentUser} onLogout={handleLogout} />;
      case 'appointment':
        return <AppointmentPage navigate={navigate} user={currentUser} />;
      case 'payment':
        return <PaymentPage navigate={navigate} user={currentUser} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderPage()}
    </div>
  );
}

export default App;
