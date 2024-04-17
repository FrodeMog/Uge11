import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import PdfFiles from './PdfFiles'; // Import PdfFiles component

const UserDashboard = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { loggedInUser, handleContextLogin, isAdmin, setLoggedInUser } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = loggedInUser ? jwtDecode(loggedInUser) : null;
    const username = decodedToken ? decodedToken.sub : null;
    
    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateRows: 'auto 1fr', 
            gridGap: '20px', 
            padding: '20px', 
            height: '100vh' 
        }}>
            <div>
                <h1>Hello {username} </h1>
                <p>This is your user dashboard</p>
            </div>
            <div style={{ 
                overflowY: 'auto', 
                padding: '20px', 
                border: '1px solid #ccc', 
                borderRadius: '10px' 
            }}>
                <PdfFiles /> {/* Use PdfFiles component */}
            </div>
        </div>
    );
}

export default UserDashboard;