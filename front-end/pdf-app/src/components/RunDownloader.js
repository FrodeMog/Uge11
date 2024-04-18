import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

const RunDownloader = () => {
    const navigate = useNavigate();
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);
    const decodedToken = userToken ? jwtDecode(userToken) : null;

    const [files, setFiles] = useState([]);
    const [formValues, setFormValues] = useState({ startRow: 0, numRows: 0, selectedFile: "" });
    const [taskId, setTaskId] = useState(null);

    useEffect(() => {
        try {
            api.get('/list_files/pdf-urls/', {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
            })
                .then(response => {
                    setFiles(response.data);
                    // Set the selectedFile to the first file in the array
                    if (response.data.length > 0) {
                        setFormValues(prevValues => ({ ...prevValues, selectedFile: response.data[0] }));
                    }
                });
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const { startRow, numRows, selectedFile } = formValues;

        try {
            const response = await api.post(`/start_download_manager/`, {}, {
                params: {
                    start_row: Number(startRow),
                    num_rows: Number(numRows),
                    filename: selectedFile,
                },
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            console.log(response.data);
            setTaskId(response.data.task_id);
        } catch (error) {
            console.error('Error starting download manager:', error);
        }
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>RunDownloader</Card.Title>
                <Card.Text>Click the button below to RunDownloader</Card.Text>
                <Form onSubmit={handleSubmit}>
                    <Form.Control
                        type="number"
                        placeholder="Start row, default: 0"
                        value={formValues.startRow === 0 ? "" : formValues.startRow}
                        onChange={e => setFormValues({ ...formValues, startRow: Number(e.target.value) })}
                    />
                    <Form.Control
                        type="number"
                        placeholder="Number of rows: 0 for all"
                        value={formValues.numRows === 0 ? "" : formValues.numRows}
                        onChange={e => setFormValues({ ...formValues, numRows: Number(e.target.value) })}
                    />
                    <Form.Control as="select" value={formValues.selectedFile} onChange={e => setFormValues({ ...formValues, selectedFile: e.target.value })}>
                        {files.map(file => (
                            <option key={file} value={file}>{file}</option>
                        ))}
                    </Form.Control>
                    <Button variant="primary" type="submit">Start Download</Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default RunDownloader;