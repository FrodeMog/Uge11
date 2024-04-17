import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/auth.js';

function UserProtectedRoute({ children }) {
    const { loggedInUser, handleContextLogin } = useContext(AuthContext);

    // Check if the loggedInUser is an admin
    if (!loggedInUser) {
        // User not logged in, redirect to login page
        return <Navigate to="/" />;
    }

    return children;
}

export default UserProtectedRoute;