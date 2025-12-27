import React, { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Dashboard from './pages/Dashboard.tsx';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from './components/Sidebar.tsx';

import Properties from './pages/Properties.tsx';
import Login from './pages/Login.tsx';
import Nopage from './pages/Nopage.tsx';
import Settings from './pages/Settings.tsx';
import MainDataManagment from './pages/MainDataManagment.tsx';
import apiService from './services/ApiService'; // Gebruik de instantie
import Agencies from './pages/Agencies.tsx';
import AdminOverview from './pages/AdminOverview.tsx';

// PrivateRoute component
const PrivateRoute = ({ element }: { element: React.ReactElement }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const enableAuth = import.meta.env.VITE_REACT_ENABLE_AUTH === 'true';
    if (!enableAuth) {
      setIsAuthenticated(true);
      setLoading(false);
      return;
    }

    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await apiService.verifyToken(token);
          if (response.status === 200) {
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };
    verifyToken();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? element : <Navigate to="/login" />;
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Logout component
  const Logout = () => {
    useEffect(() => {
      localStorage.removeItem('token');
      setToken(null); // Update state to trigger re-render
    }, []); // Run only once on component mount

    return <Navigate to="/login" replace />;
  };

  const enableAuth = import.meta.env.VITE_REACT_ENABLE_AUTH === 'true'; // Check if auth is enabled

  return (
    <StrictMode>
      <BrowserRouter>
        <div className="flex bg-gray-100 dark:bg-gray-800 min-h-screen">
          {(!enableAuth || token) && <Sidebar />} {/* Render Sidebar if auth is off or token exists */}
          <div className="flex-1 min-h-screen">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
              <Route path="/properties" element={<PrivateRoute element={<Properties />} />} />
              <Route path="/agencies" element={<PrivateRoute element={<Agencies />} />} />
              <Route path="/admin-overview" element={<PrivateRoute element={<AdminOverview />} />} />

              <Route path="/datamanagment" element={<PrivateRoute element={<MainDataManagment />} />} />
              <Route path="/settings" element={<PrivateRoute element={<Settings />} />} />
              <Route
                path="/login"
                element={token ? <Navigate to="/dashboard" replace /> : <Login />}
              />
              <Route path="/logout" element={<Logout />} />
              <Route path="*" element={<Nopage />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </StrictMode>
  );
};

createRoot(document.getElementById('root')!).render(<App />);
