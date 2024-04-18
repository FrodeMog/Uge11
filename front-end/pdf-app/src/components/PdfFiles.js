import React, { useState, useEffect, useContext } from 'react';
import api from '../api/api.js';
import { AuthContext } from '../contexts/auth.js';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import Toast from 'react-bootstrap/Toast';
import Pagination from 'react-bootstrap/Pagination';
import { Card, Button, Form, InputGroup, FormControl, DropdownButton, Dropdown, Row, Col } from 'react-bootstrap';

const PdfFiles = () => {
    const navigate = useNavigate();
    const { userToken, handleContextLogin, isAdmin, setuserToken } = useContext(AuthContext);
    const decodedToken = userToken ? jwtDecode(userToken) : null;
    const username = decodedToken ? decodedToken.sub : null;
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [pdfFiles, setPdfFiles] = useState([]); // Define pdfFiles and setPdfFiles

    const [sortColumn, setSortColumn] = useState(null);
    const [sortDirection, setSortDirection] = useState(true); // true for ascending, false for descending

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [totalPdfs, setTotalPdfs] = useState(0);
    const totalPages = Math.ceil(totalPdfs / pageSize);
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    const [filterDownloadStatus, setFilterDownloadStatus] = useState(null);

    useEffect(() => {
        const fetchPdfFiles = async () => {
            try {
                const filters = filterDownloadStatus !== null ? { download_status: filterDownloadStatus } : {};
                const response = await api.get(`/pdfs/page/?page=${currentPage}&page_size=${pageSize}&filters=${JSON.stringify(filters)}`);
                console.log(`/pdfs/page/?page=${currentPage}&page_size=${pageSize}&filters=${JSON.stringify(filters)}`);
                setPdfFiles(response.data.pdfs);
                setTotalPdfs(response.data.total_pdfs);
            } catch (error) {
                console.error("Failed to fetch PDF files", error);
            }
        };
        fetchPdfFiles();
    }, [currentPage, pageSize, filterDownloadStatus]);

    const downloadPdf = async (pdfFile) => {
        try {
            const response = await api.get(`/pdfs/download/${pdfFile.brnumber}/pdf_file`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`
                },
                responseType: 'blob' // specify that the response type should be 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${pdfFile.brnumber}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error('Failed to fetch resource:', error);
            let errorMessage = 'Failed to fetch resource.';
            if (error.response) {
                if (error.response.status === 404) {
                    errorMessage = 'Resource not found.';
                } else if (error.response.status === 401) {
                    errorMessage = 'Unauthorized.';
                } else if (error.response.data && error.response.data.detail) {
                    errorMessage = typeof error.response.data.detail === 'object'
                        ? JSON.stringify(error.response.data.detail)
                        : error.response.data.detail;
                }
            }
            setToastMessage(errorMessage);
            setShowToast(true);
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handleSort = (column) => {
        if (sortColumn === column) {
            setSortDirection(!sortDirection);
        } else {
            setSortColumn(column);
            setSortDirection(true);
        }
    };

    const sortedpdfFiles = [...pdfFiles].sort((a, b) => {
        if (a[sortColumn] < b[sortColumn]) {
            return sortDirection ? -1 : 1;
        }
        if (a[sortColumn] > b[sortColumn]) {
            return sortDirection ? 1 : -1;
        }
        return 0;
    });

    const downloadedCount = sortedpdfFiles.filter(pdfFile => pdfFile.download_status === "TRUE").length;
    const notDownloadedCount = sortedpdfFiles.filter(pdfFile => pdfFile.download_status === "FALSE").length;


    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ textAlign: 'left' }}>PDF files</h1>
                <p>Successful downloads: {downloadedCount}</p>
                <p>Failed downloads: {notDownloadedCount}</p>
                <Button variant={filterDownloadStatus === null ? "primary" : "light"} onClick={() => setFilterDownloadStatus(null)}>
                    Show all
                </Button>
                <Button variant={filterDownloadStatus === "TRUE" ? "primary" : "light"} onClick={() => setFilterDownloadStatus("TRUE")}>
                    Show successful
                </Button>
                <Button variant={filterDownloadStatus === "FALSE" ? "primary" : "light"} onClick={() => setFilterDownloadStatus("FALSE")}>
                    Show failed
                </Button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Pagination>
                    <Pagination.First onClick={() => handlePageChange(1)} />
                    {pageNumbers
                        .slice(Math.max(0, currentPage - 5), currentPage + 5)
                        .map((number) => (
                            <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                                {number}
                            </Pagination.Item>
                        ))}
                    <Pagination.Last onClick={() => handlePageChange(pageNumbers.length)} />
                </Pagination>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <table className="table table-sm table-bordered table-striped" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th></th>
                            {pdfFiles.length > 0 && Object.keys(pdfFiles[0])
                                .filter(key => key !== 'pdf_url' && key !== 'pdf_backup_url' && key !== 'file_name')
                                .map((key) => (
                                    <th key={key}>
                                        <button
                                            style={{ width: '100%' }}
                                            className="btn btn-outline-primary text-left text-nowrap"
                                            onClick={() => handleSort(key)}
                                        >
                                            {key.charAt(0).toUpperCase() + key.slice(1)} {sortColumn === key && (sortDirection ? '↓' : '↑')}
                                        </button>
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedpdfFiles.map((pdfFile) => (
                            <tr key={pdfFile.brnumber}>
                                <td>
                                    <div
                                        style={{
                                            height: '15px',
                                            width: '15px',
                                            backgroundColor: pdfFile.download_status === "TRUE" ? '#90ee90' : '#ffcccb',
                                            borderRadius: '50%',
                                            display: 'inline-block'
                                        }}
                                    />
                                </td>
                                {Object.keys(pdfFile)
                                    .filter(key => key !== 'pdf_url' && key !== 'pdf_backup_url' && key !== 'file_name')
                                    .map((key) => (
                                        <td key={key}>{pdfFile[key]}</td>
                                    ))}
                                <td>
                                    <Button variant="primary" onClick={() => downloadPdf(pdfFile)}>Download</Button>
                                </td>
                                <td>
                                    <Button variant="secondary" onClick={() => {
                                        try {
                                            window.open(pdfFile.pdf_url, "_blank")
                                        } catch (error) {
                                            setToastMessage('Could not open file, maybe the URL is invalid');
                                            setShowToast(true);
                                        }
                                    }}>Link</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Toast
                style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                }}
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={3000}
                autohide
            >
                <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
        </div>
    );

};

export default PdfFiles;