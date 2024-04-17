import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/auth.js';

function ProtectedRoute({ children }) {
    const { userToken, handleContextLogin, isAdmin } = useContext(AuthContext);

    // Check if the userToken is an admin
    if (!userToken || isAdmin != "True") {
        // User not logged in or not an admin, redirect to login page
        return <Navigate to="/" />;
    }

    return children;
}

export default ProtectedRoute;