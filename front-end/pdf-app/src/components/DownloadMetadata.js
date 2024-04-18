import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

const DownloadMetadata = () => {
    const { userToken } = useContext(AuthContext);

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
            console.error(`Failed to download ${fileType} file:`, error);
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
            </Card.Body>
        </Card>
    );
};

export default DownloadMetadata;