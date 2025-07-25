const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../index');
const User = require('../models/User');
const Task = require('../models/Task');

// Test database
const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/mern-test';

describe('MERN App Tests', () => {
  let authToken;
  let userId;
  let taskId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Clean up database before each test
    await User.deleteMany({});
    await Task.deleteMany({});
  });

  afterAll(async () => {
    // Clean up and close database connection
    await User.deleteMany({});
    await Task.deleteMany({});
    await mongoose.connection.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptime');
    });
  });

  describe('Authentication', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(userData.email);
        expect(res.body.user.name).toBe(userData.name);
        expect(res.body.user).not.toHaveProperty('password');
      });

      it('should not register user with invalid email', async () => {
        const userData = {
          name: 'Test User',
          email: 'invalid-email',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
      });

      it('should not register user with short password', async () => {
        const userData = {
          name: 'Test User',
          email: 'test@example.com',
          password: '123'
        };

        const res = await request(app)
          .post('/api/auth/register')
          .send(userData)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
      });
    });

    describe('POST /api/auth/login', () => {
      beforeEach(async () => {
        // Create a test user
        const user = new User({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
        await user.save();
        userId = user._id;
      });

      it('should login with valid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'password123'
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(loginData.email);
        
        // Store token for future tests
        authToken = res.body.token;
      });

      it('should not login with invalid credentials', async () => {
        const loginData = {
          email: 'test@example.com',
          password: 'wrongpassword'
        };

        const res = await request(app)
          .post('/api/auth/login')
          .send(loginData)
          .expect(401);

        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Invalid credentials');
      });
    });

    describe('GET /api/auth/me', () => {
      beforeEach(async () => {
        // Create and login user
        const user = new User({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123'
        });
        await user.save();
        authToken = user.getSignedJwtToken();
        userId = user._id;
      });

      it('should get current user profile', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('test@example.com');
      });

      it('should not get profile without token', async () => {
        const res = await request(app)
          .get('/api/auth/me')
          .expect(401);

        expect(res.body.success).toBe(false);
      });
    });
  });

  describe('Tasks', () => {
    beforeEach(async () => {
      // Create and login user
      const user = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      await user.save();
      authToken = user.getSignedJwtToken();
      userId = user._id;
    });

    describe('POST /api/tasks', () => {
      it('should create a new task', async () => {
        const taskData = {
          title: 'Test Task',
          description: 'Test task description',
          priority: 'high',
          category: 'work'
        };

        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(201);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(taskData.title);
        expect(res.body.data.user.toString()).toBe(userId.toString());
        
        taskId = res.body.data._id;
      });

      it('should not create task without title', async () => {
        const taskData = {
          description: 'Test task description'
        };

        const res = await request(app)
          .post('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send(taskData)
          .expect(400);

        expect(res.body.success).toBe(false);
        expect(res.body.errors).toBeDefined();
      });

      it('should not create task without authentication', async () => {
        const taskData = {
          title: 'Test Task'
        };

        const res = await request(app)
          .post('/api/tasks')
          .send(taskData)
          .expect(401);

        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /api/tasks', () => {
      beforeEach(async () => {
        // Create test tasks
        const task1 = new Task({
          title: 'Task 1',
          user: userId,
          status: 'pending'
        });
        const task2 = new Task({
          title: 'Task 2',
          user: userId,
          status: 'completed'
        });
        await task1.save();
        await task2.save();
      });

      it('should get all tasks for authenticated user', async () => {
        const res = await request(app)
          .get('/api/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.total).toBe(2);
      });

      it('should filter tasks by status', async () => {
        const res = await request(app)
          .get('/api/tasks?status=completed')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].status).toBe('completed');
      });
    });

    describe('PUT /api/tasks/:id', () => {
      beforeEach(async () => {
        const task = new Task({
          title: 'Original Task',
          user: userId
        });
        await task.save();
        taskId = task._id;
      });

      it('should update task', async () => {
        const updateData = {
          title: 'Updated Task',
          status: 'completed'
        };

        const res = await request(app)
          .put(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(res.body.success).toBe(true);
        expect(res.body.data.title).toBe(updateData.title);
        expect(res.body.data.status).toBe(updateData.status);
      });

      it('should not update non-existent task', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        
        const res = await request(app)
          .put(`/api/tasks/${fakeId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ title: 'Updated' })
          .expect(404);

        expect(res.body.success).toBe(false);
      });
    });

    describe('DELETE /api/tasks/:id', () => {
      beforeEach(async () => {
        const task = new Task({
          title: 'Task to Delete',
          user: userId
        });
        await task.save();
        taskId = task._id;
      });

      it('should delete task', async () => {
        const res = await request(app)
          .delete(`/api/tasks/${taskId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(res.body.success).toBe(true);

        // Verify task is deleted
        const deletedTask = await Task.findById(taskId);
        expect(deletedTask).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(res.body.message).toBe('Route not found');
    });
  });
});