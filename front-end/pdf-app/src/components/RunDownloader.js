import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col, ProgressBar } from 'react-bootstrap';

const RunDownloader = () => {
    const navigate = useNavigate();
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);
    const decodedToken = userToken ? jwtDecode(userToken) : null;

    const [files, setFiles] = useState([]);
    const [formValues, setFormValues] = useState({ startRow: 0, numRows: 0, selectedFile: "" });
    const [taskId, setTaskId] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);

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

    useEffect(() => {
        let interval = null;

        if (taskId && (!downloadProgress || downloadProgress.status !== 'finished')) {
            interval = setInterval(() => {
                api.get(`/download_results/${taskId}`, {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                    },
                })
                    .then(response => {
                        const { num_rows, processed_rows, results, status, start_time, running_time, start_row } = response.data;
                        const progress = (processed_rows / num_rows) * 100;
                        setDownloadProgress({
                            progress,
                            results,
                            status,
                            start_time,
                            running_time,
                            start_row,
                            num_rows,
                            processed_rows
                        });
                    })
                    .catch(error => {
                        console.error('Error fetching download results:', error);
                    });
            }, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [taskId, downloadProgress]);

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
            setDownloadProgress(null);  // Reset downloadProgress when a new download is started
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
                    <Button variant="secondary" onClick={refreshFiles}>Refresh Files</Button>
                </Form>
                {downloadProgress && formValues.numRows !== 0 && (
                    <>
                        <ProgressBar
                            now={downloadProgress.progress}
                            label={`${downloadProgress.progress.toFixed(2)}%`}
                            variant={downloadProgress.status === 'running' ? 'warning' : 'success'}
                        />
                        <p>Status: {downloadProgress.progress === 100 && downloadProgress.status === 'running' ? 'finalizing' : downloadProgress.status}</p>
                        <p>Successful: {downloadProgress.results.successful}</p>
                        <p>Already downloaded: {downloadProgress.results.already_downloaded}</p>
                        <p>Failed: {downloadProgress.results.failed}</p>
                        <p>Processed rows: {downloadProgress.processed_rows} out of {downloadProgress.num_rows}</p>
                    </>
                )}
            </Card.Body>
        </Card>
    );
};

export default RunDownloader;