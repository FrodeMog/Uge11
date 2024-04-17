import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-bootstrap/Toast';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

const PdfFiles = () => {
    const navigate = useNavigate();
    const { loggedInUser, handleContextLogin, isAdmin, setLoggedInUser } = useContext(AuthContext);
    const decodedToken = loggedInUser ? jwtDecode(loggedInUser) : null;
    const username = decodedToken ? decodedToken.sub : null;
    const [showToast, setShowToast] = useState(false); 
    const [toastMessage, setToastMessage] = useState('');
    const [pdfFiles, setPdfFiles] = useState([]); // Define pdfFiles and setPdfFiles

    useEffect(() => {
        const fetchPdfFiles = async () => {
            try {
                const response = await api.get('/pdfs');
                setPdfFiles(response.data);
            } catch (error) {
                console.error(error);
            }
        }
        fetchPdfFiles();
    }, []);

    const downloadPdf = async (pdfFile) => {
        try {
            const response = await api.get(`/pdfs/download/${pdfFile.brnumber}/pdf_file`, {
                headers: {
                    'Authorization': `Bearer ${loggedInUser}`
                },
                responseType: 'blob' // specify that the response type should be 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${pdfFile.brnumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('There was an error downloading the PDF file:', error);
        }
    };

    const [showAll, setShowAll] = useState(pdfFiles.map(() => true));

    const toggleShowAll = index => {
        const newShowAll = [...showAll];
        newShowAll[index] = !newShowAll[index];
        setShowAll(newShowAll);
    };

    return (
        <div>
            <h1>PDF Files</h1>
            {pdfFiles.map((pdfFile, index) => (
                    <Card 
                    key={index} 
                    style={{ 
                        width: '100%', 
                        marginBottom: '10px', 
                        position: 'relative'
                    }}
                >
                    <div 
                        style={{ 
                            position: 'absolute', 
                            top: '10px', 
                            right: '10px', 
                            height: '10px', 
                            width: '10px', 
                            borderRadius: '50%', 
                            backgroundColor: pdfFile.download_status === "TRUE" ? 'lightgreen' : 'red' 
                        }}
                    />
                    <Card.Body>
                        <Card.Title>{pdfFile.brnumber} : {pdfFile.title}</Card.Title>
                        {!pdfFile.download_status && <Card.Text>{pdfFile.download_message}</Card.Text>}
                        <ul>
                            {Object.entries(pdfFile).map(([key, value], i) => (
                                showAll[index] ? <li key={i}><strong>{key}:</strong> {value}</li> : null
                            ))}
                        </ul>
                        <div style={{ display: 'flex' }}>
                            <Button variant="primary" size="sm" style={{ marginRight: '10px' }} onClick={() => toggleShowAll(index)}> {showAll[index] ? 'Hide' : 'Show'}</Button>
                            <Button variant="primary" size="sm" style={{ marginRight: '10px' }} onClick={() => downloadPdf(pdfFile)}>Download PDF</Button>
                            <Button variant="primary" size="sm" href={pdfFile.pdf_url} target="_blank">Open PDF URL</Button>
                        </div>
                    </Card.Body>
                </Card>
            ))}
        </div>
    );
};

export default PdfFiles;