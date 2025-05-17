// Simple script to test database connection
require('dotenv').config();
console.log('Environment variables loaded');

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env file');
  process.exit(1);
}

console.log('DATABASE_URL is set, attempting to load Prisma...');

try {
  const { PrismaClient } = require('@prisma/client');
  console.log('PrismaClient loaded successfully');

  async function testDatabaseConnection() {
    console.log('Testing database connection...');

    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    try {
      console.log('Attempting to connect to database...');

      // Try to connect and run a simple query
      console.log('Running test query...');
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Database connection successful!', result);

      // Try to count users
      console.log('Counting users...');
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
      console.log('Disconnecting from database...');
      await prisma.$disconnect();
    }
  }

  console.log('Starting database connection test...');
  testDatabaseConnection()
    .then(success => {
      console.log('Test completed:', success ? 'SUCCESS' : 'FAILED');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    });
} catch (error) {
  console.error('Failed to load PrismaClient:');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Full error:', error);
  process.exit(1);
}
