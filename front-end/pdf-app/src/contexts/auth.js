import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api.js';
import {jwtDecode} from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [userToken, setuserToken] = useState(null);

    useEffect(() => {
        const storedToken = JSON.parse(localStorage.getItem('userToken'));
        if (storedToken) {
            setuserToken(storedToken);
        }
    }, []);

    const decodedToken = userToken ? jwtDecode(userToken) : null;
    const isAdmin = decodedToken && decodedToken.is_admin;

    const handleContextLogin = async (username,password) => {
        try {
            const response = await api.post('/token', { username, password });
            const { access_token } = response.data;
            console.log(access_token);
            setuserToken(access_token); // Set the access token
            localStorage.setItem('userToken', JSON.stringify(access_token)); // Store the access token in localStorage
        } catch (error) {
            // Handle error
        }
    };

    return (
        <AuthContext.Provider value={{ username, setUsername, password, setPassword, userToken, setuserToken, handleContextLogin, isAdmin }}>
        {children}
        </AuthContext.Provider>
    );
}
export { AuthContext, AuthProvider };