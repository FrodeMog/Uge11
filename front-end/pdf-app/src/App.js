import React, {useState, useEffect, useContext} from 'react';
import api from './api/api.js';

// Import AuthContext
import { AuthProvider } from './contexts/auth.js'; 
import { AuthContext } from './contexts/auth.js';
// Import Components
import NavBar from './components/NavBar.js';
import Home from './components/Home.js';
import UserDashboard from './components/UserDashboard.js';
import AdminDashboard from './components/AdminDashboard.js';
// Import React Router
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Import User Protected Routes
import UserProtectedRoute from './components/UserProtectedRoute.js';
import AdminProtectedRoute from './components/AdminProtectedRoute.js';

const App = () => {
  
  const { loggedInUser } = useContext(AuthContext);

  return (
    <div className="App">
    <BrowserRouter>
      <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard/user" element={
            <UserProtectedRoute>
              <UserDashboard />
            </UserProtectedRoute>
          } />
          <Route path="/dashboard/admin" element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>

    </div>
  );
}


export default App;