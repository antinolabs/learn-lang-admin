// Simple API test script
const axios = require('axios');

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://gnh3rb7x-3001.inc1.devtunnels.ms/api';

async function testAPI() {
  console.log('Testing API connection...');
  console.log('API Base URL:', API_BASE_URL);
  
  try {
    // Test a simple endpoint (you can modify this based on your actual API)
    const response = await axios.get(`${API_BASE_URL}/courses`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Connection Successful!');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    console.log('❌ API Connection Failed!');
    console.log('Error:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    }
  }
}

testAPI();

