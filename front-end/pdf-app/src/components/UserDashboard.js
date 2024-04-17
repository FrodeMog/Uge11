import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


const UserDashboard = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { loggedInUser, handleContextLogin, isAdmin, setLoggedInUser } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = loggedInUser ? jwtDecode(loggedInUser) : null;
    const username = decodedToken ? decodedToken.sub : null;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <>
                <h1>Hello {username} </h1>
                <p>This is your user dashboard</p>
            </>
        </div>
    );
}

export default UserDashboard;