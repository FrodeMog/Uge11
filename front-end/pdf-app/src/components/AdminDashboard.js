import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import DownloadMetadata from './DownloadMetadata';
import RunDownloader from './RunDownloader';
import UploadExcel from './UploadExcel';


const AdminDashboard = () => {
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
                <p>This is your admin dashboard</p>
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '20px',
                overflowY: 'auto',
                padding: '20px',
                border: '1px solid #ccc',
                borderRadius: '10px'
            }}>
                <DownloadMetadata />
                <RunDownloader />
                <UploadExcel />
            </div>
        </div>
    );
}

export default AdminDashboard;