import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import Toast from 'react-bootstrap/Toast';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col, ProgressBar } from 'react-bootstrap';
import DownloadProgress from './DownloadProgress';

const RunDownloader = () => {
    const navigate = useNavigate();
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);

    const [files, setFiles] = useState([]);
    const [formValues, setFormValues] = useState({ startRow: 0, numRows: 0, selectedFile: "" });
    const [taskIds, setTaskIds] = useState(() => {
        const storedTaskIds = JSON.parse(localStorage.getItem('taskIds'));
        return storedTaskIds ? storedTaskIds : [];
    });

    // When taskIds changes, save it to local storage
    useEffect(() => {
        localStorage.setItem('taskIds', JSON.stringify(taskIds));
    }, [taskIds]);

    // When the component mounts, retrieve taskIds from local storage
    useEffect(() => {
        const storedTaskIds = JSON.parse(localStorage.getItem('taskIds'));
        if (storedTaskIds) {
            setTaskIds(storedTaskIds);
        }
    }, []);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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

    const refreshFiles = () => {
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
    };

    const clearTasks = () => {
        // Clear taskIds from state
        setTaskIds([]);

        // Clear finalElapsedTime_xxx from localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('finalElapsedTime_')) {
                localStorage.removeItem(key);
            }
        }
    };

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
            setTaskIds(prevTaskIds => [...prevTaskIds, response.data.task_id]);
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
                <Card.Title>Run the download manager</Card.Title>
                <Card.Text>Select start row, 0 for beginning, select number of rows, 0 for all, select file of those in server at /pdf-url/</Card.Text>
                <Form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <Form.Control
                            type="number"
                            placeholder="Start row, default: 0"
                            value={formValues.startRow === 0 ? "" : formValues.startRow}
                            onChange={e => setFormValues({ ...formValues, startRow: Number(e.target.value) })}
                            style={{ marginRight: '10px' }}
                        />
                        <Form.Control
                            type="number"
                            placeholder="Number of rows: 0 for all"
                            value={formValues.numRows === 0 ? "" : formValues.numRows}
                            onChange={e => setFormValues({ ...formValues, numRows: Number(e.target.value) })}
                            style={{ marginRight: '10px' }}
                        />
                        <Form.Control as="select" value={formValues.selectedFile} onChange={e => setFormValues({ ...formValues, selectedFile: e.target.value })}>
                            {files.map(file => (
                                <option key={file} value={file}>{file}</option>
                            ))}
                        </Form.Control>
                    </div>
                    <div>
                        <Button variant="primary" type="submit" style={{ marginRight: '10px' }}>Start Download</Button>
                        <Button variant="secondary" onClick={refreshFiles} style={{ marginRight: '10px' }}>Refresh Files</Button>
                        <Button variant="danger" onClick={clearTasks}>Clear Tasks</Button>
                    </div>
                    <Card style={{ marginTop: '20px' }}>
                        <Card.Body>
                            {taskIds.map(taskId => (
                                <DownloadProgress
                                    key={taskId}
                                    taskId={taskId}
                                />
                            ))}
                        </Card.Body>
                    </Card>
                </Form>
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
            </Card.Body >
        </Card >
    );
};

export default RunDownloader;