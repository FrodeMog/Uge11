import React, { useState, useContext } from 'react';
import Login from './Login'; // Import the Login component
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


const Home = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = userToken ? jwtDecode(userToken) : null;
    const username = decodedToken ? decodedToken.sub : null;
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            {userToken ? (
                <>
                    <h1>Hello {username} </h1>
                    <p>You are home</p>
                </>
            ) : (
                <>
                    <h1>Hello</h1>
                    <p>Please log in</p>
                </>
            )}
        </div>
    );
}

export default Home;