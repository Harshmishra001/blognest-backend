// Simple script to test if the server can start
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Create a simple Express app
const app = express();
app.use(express.json());
app.use(cors());

// Add a simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running correctly' });
});

// Check environment variables
const envVars = {
  DATABASE_URL: process.env.DATABASE_URL ? 'Set (masked)' : 'Not set',
  JWT_SECRET: process.env.JWT_SECRET ? 'Set (masked)' : 'Not set',
  PORT: process.env.PORT || 3002
};

// Start the server
const PORT = process.env.PORT || 3002;
const server = app.listen(PORT, () => {
  console.log(`Test server is running on port ${PORT}`);
  console.log('Environment variables:');
  console.log(JSON.stringify(envVars, null, 2));
  
  // Automatically shut down after 10 seconds
  console.log('Server will automatically shut down in 10 seconds...');
  setTimeout(() => {
    console.log('Shutting down test server...');
    server.close(() => {
      console.log('Server successfully shut down');
      process.exit(0);
    });
  }, 10000);
});
