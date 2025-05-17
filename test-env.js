// Simple script to test if environment variables are loaded correctly
console.log('Starting environment variable test...');

try {
  require('dotenv').config();
  console.log('dotenv loaded successfully');
  
  console.log('Environment variables:');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
  console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
  
  if (process.env.DATABASE_URL) {
    // Only show part of the URL for security
    const url = process.env.DATABASE_URL;
    const maskedUrl = url.substring(0, 15) + '...' + url.substring(url.length - 15);
    console.log('DATABASE_URL starts with:', maskedUrl);
  }
  
  console.log('Test completed successfully');
} catch (error) {
  console.error('Error during test:');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Full error:', error);
}
