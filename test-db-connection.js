// Test script to check database connection
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log('Testing database connection...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set (first 20 chars): ' + process.env.DATABASE_URL.substring(0, 20) + '...' : 'Not set');
  
  try {
    // Try to connect to the database
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Database connection successful!', result);
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`Number of users in database: ${userCount}`);
    
    return true;
  } catch (error) {
    console.error('Database connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection()
  .then(success => {
    console.log('Test completed. Success:', success);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
    process.exit(1);
  });
