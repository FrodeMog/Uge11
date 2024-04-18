import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-bootstrap/Toast';
import { Checkbox, Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

const UploadExcel = () => {
    const { userToken } = useContext(AuthContext);
    const [selectedFile, setSelectedFile] = useState(null);
    const [overwrite, setOverwrite] = useState(false);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleOverwriteChange = (event) => {
        setOverwrite(event.target.checked);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            console.error('No file selected');
            return;
        }

        const formData = new FormData();
        formData.append('files', selectedFile, selectedFile.name);

        try {
            await api.post(`/upload_files/pdf-urls/${overwrite}`, formData, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('File uploaded successfully');
            setToastMessage(`File: ${selectedFile.name} uploaded successfully`);
            setShowToast(true);
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
                <Card.Title>Upload file for downloader</Card.Title>
                <Card.Text> Upload file with mandatory rows: 'BRnum', 'pdf_url' as file with extension: '.csv', '.xlsx', '.xlsm', '.xltx', '.xltm'</Card.Text>
                <Form>
                    <Form.Control type="file" id="custom-file" label="Choose file" onChange={handleFileChange} />
                    <Form.Check type="checkbox" label="Overwrite existing file" onChange={handleOverwriteChange} />
                    <Button variant="primary" onClick={handleUpload}>
                        Upload
                    </Button>
                </Form>
                <Toast
                    style={{
                        position: 'absolute',
                        top: 100,
                        right: 20,
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

export default UploadExcel;