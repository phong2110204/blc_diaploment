const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || '';
const CONTRACT_ABI = require('./abi/DiplomaManager.json');
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export { CONTRACT_ADDRESS, CONTRACT_ABI, API_BASE_URL };
