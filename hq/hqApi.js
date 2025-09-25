
require('dotenv').config(); 

const axios = require('axios');
const token = process.env.ENCODE_TOKEN; 

const hqApi = axios.create({
    baseURL: 'https://api-asia.caagcrm.com/api-asia/',
    headers: {
        Authorization: `Basic ${token}`, 
    },
});


hqApi.interceptors.response.use(
    (response) => response, 
    (error) => {
        console.log('API Error:', error.response?.data || error.message); 
        return Promise.reject(error); 
    }
);


module.exports = hqApi;
