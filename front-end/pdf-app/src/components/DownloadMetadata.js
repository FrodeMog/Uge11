import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const DownloadMetadata = () => {
    const navigate = useNavigate();
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);
    const decodedToken = userToken ? jwtDecode(userToken) : null;

    return (
        <div>
            <h2>DownloadMetadata</h2>
            <p>Click the button below to DownloadMetadata</p>
        </div>
    );

};
export default DownloadMetadata;