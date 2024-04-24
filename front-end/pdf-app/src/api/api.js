import axios from 'axios';

const host_ip = process.env.REACT_APP_HOST_IP || 'localhost';

const api = axios.create({
  baseURL: `http://${host_ip}:8000`,
});

export default api;