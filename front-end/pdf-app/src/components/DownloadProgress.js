import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { Card, ProgressBar } from 'react-bootstrap';


function DownloadProgress({ taskId }) {
    const navigate = useNavigate();
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);
    const [finalElapsedTime, setFinalElapsedTime] = useState(null);
    const [downloadProgress, setDownloadProgress] = useState(null);


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
                            taskId,
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


    useEffect(() => {
        if (downloadProgress && downloadProgress.status === 'finished') {
            let elapsedSeconds;
            const taskKey = `finalElapsedTime_${downloadProgress.taskId}`; // Modify this line
            const storedTime = localStorage.getItem(taskKey); // Modify this line
            if (storedTime) {
                elapsedSeconds = Number(storedTime);
            } else {
                console.log('start_time:', downloadProgress.start_time);
                const runningTime = typeof downloadProgress.running_time === 'number' ? downloadProgress.running_time : 0;
                elapsedSeconds = Math.floor((new Date() - new Date(downloadProgress.start_time)) / 1000) + runningTime;
                console.log('elapsedSeconds:', elapsedSeconds);
                localStorage.setItem(taskKey, elapsedSeconds.toString()); // Modify this line
            }
            const hours = Math.floor(elapsedSeconds / 3600);
            const minutes = Math.floor((elapsedSeconds % 3600) / 60);
            const seconds = (elapsedSeconds % 60).toFixed(2);
            setFinalElapsedTime(`${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        }
    }, [downloadProgress]);


    return (
        <>
            {downloadProgress && downloadProgress.results ? (
                Array.isArray(downloadProgress) ? downloadProgress.map((progress, index) => (
                    <Card key={index} style={{ marginTop: '20px' }}>
                        <Card.Body>
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
                            {/* Rest of your code */}
                        </Card.Body>
                    </Card>
                )) : (
                    <Card style={{ marginTop: '20px' }}>
                        <Card.Body>
                            {downloadProgress.progress && <ProgressBar
                                now={downloadProgress.progress}
                                label={`${downloadProgress.progress.toFixed(2)}%`}
                                variant={downloadProgress.status === 'running' ? 'warning' : 'success'}
                                style={{
                                    height: '30px', // Increase the thickness of the progress bar
                                    fontSize: '18px', // Increase the font size of the label
                                    fontWeight: 'bold',
                                    lineHeight: '30px', // Vertically center the label
                                }}
                            />}
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
                        </Card.Body>
                    </Card>
                )
            ) : null}
        </>
    );
}


export default DownloadProgress;