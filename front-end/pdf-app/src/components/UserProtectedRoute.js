import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/auth.js';

function UserProtectedRoute({ children }) {
    const { userToken, handleContextLogin } = useContext(AuthContext);

    // Check if the userToken is present
    if (!userToken) {
        // User not logged in, redirect to login page
        return <Navigate to="/" />;
    }

    return children;
}

export default UserProtectedRoute;