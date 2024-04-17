import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AdminDashboard = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = userToken ? jwtDecode(userToken) : null;
    const username = decodedToken ? decodedToken.sub : null;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <>
                <h1>Hello {username} </h1>
                <p>This is your admin dashboard</p>
            </>
        </div>
    );
}

export default AdminDashboard;