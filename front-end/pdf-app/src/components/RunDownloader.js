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
                        const { num_rows, processed_rows, results, status, start_time, running_time, start_row, running_file } = response.data;
                        const progress = (processed_rows / num_rows) * 100;
                        setDownloadProgress({
                            progress,
                            results,
                            status,
                            start_time,
                            running_time,
                            start_row,
                            num_rows,
                            processed_rows,
                            running_file
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

    const [finalElapsedTime, setFinalElapsedTime] = useState(null);

    useEffect(() => {
        if (downloadProgress && downloadProgress.status === 'finished') {
            const elapsedSeconds = Math.floor((new Date() - new Date(downloadProgress.start_time)) / 1000) + downloadProgress.running_time;
            const hours = Math.floor(elapsedSeconds / 3600);
            const minutes = Math.floor((elapsedSeconds % 3600) / 60);
            const seconds = (elapsedSeconds % 60).toFixed(2);
            setFinalElapsedTime(`${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        }
    }, [downloadProgress]);

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
                        <Button variant="secondary" onClick={refreshFiles}>Refresh Files</Button>
                    </div>
                </Form>
                <Card style={{ marginTop: '20px' }}>
                    <Card.Body>
                        {downloadProgress && formValues.numRows !== 0 && (
                            <>
                                <ProgressBar
                                    now={downloadProgress.progress}
                                    label={`${downloadProgress.progress.toFixed(2)}%`}
                                    variant={downloadProgress.status === 'running' ? 'warning' : 'success'}
                                    style={{
                                        height: '30px', // Increase the thickness of the progress bar
                                        fontSize: '18px', // Increase the font size of the label
                                        fontWeight: 'bold',
                                        lineHeight: '30px', // Vertically center the label
                                    }}
                                />
                                <table style={{ marginTop: '20px' }}>
                                    <tbody>
                                        <tr>
                                            <td>Status:</td>
                                            <td>{downloadProgress.progress === 100 && downloadProgress.status === 'running' ? 'finalizing' : downloadProgress.status}</td>
                                        </tr>
                                        <tr>
                                            <td>Running file:</td>
                                            <td>{downloadProgress.running_file}</td>
                                        </tr>
                                        <tr>
                                            <td>Successful:</td>
                                            <td>{downloadProgress.results.successful}</td>
                                        </tr>
                                        <tr>
                                            <td>Already downloaded:</td>
                                            <td>{downloadProgress.results.already_downloaded}</td>
                                        </tr>
                                        <tr>
                                            <td>Failed:</td>
                                            <td>{downloadProgress.results.failed}</td>
                                        </tr>
                                        <tr>
                                            <td>Processed rows:</td>
                                            <td>{downloadProgress.processed_rows} out of {downloadProgress.num_rows}</td>
                                        </tr>
                                        {
                                            downloadProgress.start_time && (
                                                <tr>
                                                    <td>Elapsed time:</td>
                                                    <td>
                                                        {downloadProgress.status !== 'finished' ? (
                                                            (() => {
                                                                const elapsedSeconds = Math.floor((new Date() - new Date(downloadProgress.start_time)) / 1000) + downloadProgress.running_time;
                                                                const hours = Math.floor(elapsedSeconds / 3600);
                                                                const minutes = Math.floor((elapsedSeconds % 3600) / 60);
                                                                const seconds = (elapsedSeconds % 60).toFixed(2);
                                                                return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
                                                            })()
                                                        ) : (
                                                            // Display the final elapsed time when the status is 'finished'
                                                            finalElapsedTime
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        }
                                    </tbody>
                                </table>
                            </>
                        )}

                    </Card.Body>
                </Card>
            </Card.Body>
        </Card>
    );
};

export default RunDownloader;