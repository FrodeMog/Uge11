import React, { useContext } from 'react';
import { AuthContext } from '../contexts/auth.js';
import Register from './Register'; 
import Login from './Login';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const NavBar = () => {
    const navigate = useNavigate();

    // get the logged in user
    const { loggedInUser, handleContextLogin, isAdmin, setLoggedInUser } = useContext(AuthContext);

    // decode the token to get the username
    const decodedToken = loggedInUser ? jwtDecode(loggedInUser) : null;
    const username = decodedToken ? decodedToken.sub : null;

    return (
      <nav className="navbar navbar-dark bg-primary">
          <div className="container-fluid">
          <a className="navbar-brand" href="#" onClick={() => navigate('/')}>
            pdf App
          </a>
          {loggedInUser && <button className="btn btn-primary" onClick={() => navigate('/dashboard/user')}>User Dashboard</button>}
          {loggedInUser && isAdmin==="True" && <button className="btn btn-primary" onClick={() => navigate('/dashboard/admin')}>Admin Dashboard</button>}
              {loggedInUser ? (
                <div>
                    <span className="navbar-text">
                        Logged in as: {username}
                    </span>
                    <button className="btn btn-primary" onClick={() => { // Logout button
                        setLoggedInUser(null);
                        localStorage.removeItem('loggedInUser'); // Remove the user data from localStorage
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