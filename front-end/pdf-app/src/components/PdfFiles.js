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

    // State variable for the selected filter key
    const [selectedFilterKey, setSelectedFilterKey] = useState(null);
    // State variable for the selected filter value
    const [selectedFilterValue, setSelectedFilterValue] = useState('');
    const [filter, setFilter] = useState({});

    useEffect(() => {
        const fetchPdfFiles = async () => {
            try {
                const filters = {
                    ...filter
                };
                let filtersToSend = {};
                if (filters) {
                    filtersToSend = Object.keys(filters).reduce((acc, key) => {
                        if (key && key !== "null" && filters[key] !== null && filters[key] !== "") {
                            acc[key] = filters[key];
                        }
                        return acc;
                    }, {});
                }
                const response = await api.get(`/pdfs/page/?page=${currentPage}&page_size=${pageSize}&filters=${JSON.stringify(filtersToSend)}&sort_by=${sortColumn}&sort_order=${sortDirection ? 'asc' : 'desc'}`);
                setPdfFiles(response.data.pdfs);
                setTotalPdfs(response.data.total_pdfs);
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
        fetchPdfFiles();
    }, [currentPage, pageSize, filter, sortColumn, sortDirection]);

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

    return (
        <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h1 style={{ textAlign: 'left' }}>Total: {totalPdfs} processed pdfs</h1>
                <div className="d-flex justify-content-between">
                    <DropdownButton id="dropdown-basic-button" title={selectedFilterKey || "Select filter"} className="mr-2">
                        {pdfFiles.length > 0 && Object.keys(pdfFiles[0])
                            .filter(key => key !== 'pdf_url' && key !== 'pdf_backup_url' && key !== 'file_name')
                            .map(key => (
                                <Dropdown.Item key={key} onClick={() => setSelectedFilterKey(key)}>
                                    {key}
                                </Dropdown.Item>
                            ))
                        }
                    </DropdownButton>
                    <div className="p-0" style={{ width: '400px' }}>
                        <form onSubmit={(e) => { e.preventDefault(); setFilter({ [selectedFilterKey]: selectedFilterValue }); }}>

                            <InputGroup className="mb-3">
                                <FormControl
                                    placeholder="Filter value"
                                    aria-label="Filter value"
                                    aria-describedby="basic-addon2"
                                    value={selectedFilterValue}
                                    onChange={e => setSelectedFilterValue(e.target.value)}
                                />
                            </InputGroup>
                        </form>
                    </div>
                    <Button onClick={() => setFilter({ [selectedFilterKey]: selectedFilterValue })} className="mr-2">Submit</Button>
                    <Button onClick={() => { setSelectedFilterKey(null); setSelectedFilterValue(''); setFilter({}); }} style={{ whiteSpace: 'nowrap' }}>Show all</Button>
                </div>
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
        </div >
    );

};

export default PdfFiles;