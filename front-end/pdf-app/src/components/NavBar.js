import React, { useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import Register from './Register';
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const NavBar = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = userToken ? jwtDecode(userToken) : null;
    const username = decodedToken ? decodedToken.sub : null;

    return (
        <nav className="navbar navbar-dark bg-primary fixed-top">
            <div className="container-fluid">
                <a className="navbar-brand" href="#" onClick={() => navigate('/')}>
                    pdf App
                </a>
                {userToken && <button className="btn btn-primary" onClick={() => navigate('/dashboard/user')}>User Dashboard</button>}
                {userToken && isAdmin === "True" && <button className="btn btn-primary" onClick={() => navigate('/dashboard/admin')}>Admin Dashboard</button>}
                {userToken ? (
                    <div>
                        <span className="navbar-text">
                            Logged in as: {username}
                        </span>
                        <button className="btn btn-primary" onClick={() => { // Logout button
                            setuserToken(null);
                            localStorage.removeItem('userToken'); // Remove the user data from localStorage
                        }}>Logout</button>
                    </div>
                ) : (
                    <div className="d-flex justify-content-end align-items-center">
                        <Login />
                        <Register />
                    </div>
                )}
            </div>
        </nav>
    );
}

export default NavBar;