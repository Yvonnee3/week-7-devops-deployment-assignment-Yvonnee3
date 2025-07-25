// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.MONGODB_URI_TEST = 'mongodb://localhost:27017/mern-test';

// Increase timeout for database operations
jest.setTimeout(30000);