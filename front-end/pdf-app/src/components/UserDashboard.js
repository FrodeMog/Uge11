import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import PdfFiles from './PdfFiles'; // Import PdfFiles component

const UserDashboard = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = userToken ? jwtDecode(userToken) : null;
    const username = decodedToken ? decodedToken.sub : null;

    return (
        <div style={{
            display: 'grid',
            gridTemplateRows: 'auto 1fr',
            gridGap: '20px',
            padding: '20px',
            paddingTop: '70px',
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
                <PdfFiles />
            </div>
        </div>
    );
}

export default UserDashboard;