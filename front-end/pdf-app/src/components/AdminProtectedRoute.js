import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/auth.js';

function ProtectedRoute({ children }) {
    const { loggedInUser, handleContextLogin, isAdmin } = useContext(AuthContext);

    // Check if the loggedInUser is an admin
    if (!loggedInUser || isAdmin != "True") {
        // User not logged in or not an admin, redirect to login page
        return <Navigate to="/" />;
    }

    return children;
}

export default ProtectedRoute;