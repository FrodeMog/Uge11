import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-bootstrap/Toast';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

const DownloadMetadata = () => {
    const { userToken } = useContext(AuthContext);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const downloadFile = async (fileType) => {
        const fileName = `metadata_summary.${fileType}`;
        try {
            const response = await api.get(`/download_metadata_${fileType}/?file_name=${fileName}`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Failed to fetch resource:', error);
            let errorMessage = 'Failed to fetch resource.';
            if (error.response) {
                if (error.response.data && error.response.data.detail) {
                    errorMessage = typeof error.response.data.detail === 'object'
                        ? JSON.stringify(error.response.data.detail)
                        : error.response.data.detail;
                } else if (error.response.status === 404) {
                    errorMessage = 'Resource not found.';
                } else if (error.response.status === 401) {
                    errorMessage = 'Unauthorized.';
                }
            }
            setToastMessage(errorMessage);
            setShowToast(true);
        }
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Download metadata of processed rows</Card.Title>
                <Card.Text>Click to download as .xlsx or .csv</Card.Text>
                <Button variant="primary" onClick={() => downloadFile('xlsx')} style={{ marginRight: '10px' }}>
                    Download Metadata (xlsx)
                </Button>
                <Button variant="primary" onClick={() => downloadFile('csv')}>
                    Download Metadata (csv)
                </Button>
                <Toast
                    style={{
                        position: 'absolute',
                        top: '30%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                    }}
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                >
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </Card.Body>
        </Card>
    );
};

export default DownloadMetadata;