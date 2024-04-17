import React, { useState, useContext } from 'react';
import Card from 'react-bootstrap/Card';
import Toast from 'react-bootstrap/Toast';
import Modal from 'react-bootstrap/Modal'; // Import Modal
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showToast, setShowToast] = useState(false); 
    const [toastMessage, setToastMessage] = useState('');
    const [showModal, setShowModal] = useState(false); // State to control the visibility of the modal

    const { setLoggedInUser } = useContext(AuthContext);

    const handleLogin = async (event) => {
        event.preventDefault();

        // Check if username or password is empty
        if (!username || !password) {
            setToastMessage('Username and password are required.');
            setShowToast(true);
            return;
        }

        try {
            const response = await api.post('/token', `username=${username}&password=${password}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const { access_token } = response.data;
            console.log(access_token);
        
            setLoggedInUser(access_token); // Set the access token
        
            // Store the access token in localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(access_token));
        
            setToastMessage('User: '+username+' logged in successfully!');
            setShowToast(true);
            setShowModal(false); // Close the modal after a successful login
        } catch (error) {
            console.error('Failed to login user:', error);
            let errorMessage = 'Failed to login.';
            if (error.response?.data?.detail) {
                errorMessage = typeof error.response.data.detail === 'object' 
                    ? JSON.stringify(error.response.data.detail)
                    : error.response.data.detail;
            }
            setToastMessage(errorMessage);
            setShowToast(true);
        }
    };

    return (
        <>
            <button onClick={() => setShowModal(true)} className="btn btn-primary">Login</button> {/* Button to open the modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)}> {/* Modal */}
                <Modal.Header closeButton>
                    <Modal.Title>Login</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleLogin}>
                        <input className="form-control mb-4" type="text" placeholder="Username" aria-label="Username" onChange={e => setUsername(e.target.value)} />
                        <input className="form-control mb-4" type="password" placeholder="Password" aria-label="Password" onChange={e => setPassword(e.target.value)} />
                        <button type="submit" className="btn btn-primary d-block mx-auto">Login</button>
                    </form>
                </Modal.Body>
                <div className="d-flex justify-content-center align-items-center mb-4" >
                    <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide>
                        <Toast.Body className="text-center">{toastMessage}</Toast.Body>
                    </Toast>
                </div>
            </Modal>
        </>
    );
};

export default Login;