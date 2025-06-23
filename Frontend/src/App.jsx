import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import DashboardLayout from './components/Dashboard'; // Renamed for clarity
import Debt from './components/Debt';
import Advisor from './components/aiAdvisor';
import Messages from './components/Messages';
import InvestmentTracker from './components/InvestmentTracker';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (credentials) => {
    if (credentials.email && credentials.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleRegister = (userData) => {
    if (userData.email && userData.password) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={
            !isAuthenticated ? (
              <Login onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />
        <Route 
          path="/register" 
          element={
            !isAuthenticated ? (
              <Register onRegister={handleRegister} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } 
        />

        {/* Dashboard and nested routes */}
        <Route 
          path="/dashboard/*"  // Note the /* for nested routes
          element={
            isAuthenticated ? (
              <DashboardLayout onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          {/* Nested routes */}
          <Route index element={<DashboardHome />} />
          <Route path="debt" element={<Debt />} />
          <Route path="advisor" element={<Advisor />} />
          <Route path="messages" element={<Messages />} />
          <Route path="investments" element={<InvestmentTracker />} />
        </Route>

        {/* Default redirect */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </Router>
  );
}

// Simple component for dashboard home
function DashboardHome() {
  return <div>Welcome to your Dashboard</div>;
}

export default App;