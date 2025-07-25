# MERN Stack Backend API

A production-ready Node.js/Express.js backend API for a task management application with authentication, authorization, and comprehensive monitoring.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **RESTful API**: Clean, well-documented REST endpoints
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet, rate limiting, CORS, input validation
- **Monitoring**: Prometheus metrics, health checks, logging
- **Testing**: Comprehensive test suite with Jest and Supertest
- **Documentation**: OpenAPI/Swagger documentation
- **Deployment**: Docker support with multi-stage builds

## 📁 Project Structure

```
server/
├── __tests__/              # Test files
├── middleware/              # Custom middleware
│   ├── auth.js             # Authentication middleware
│   ├── errorHandler.js     # Error handling middleware
│   └── metrics.js          # Prometheus metrics middleware
├── models/                 # Mongoose models
│   ├── User.js            # User model
│   └── Task.js            # Task model
├── routes/                 # API routes
│   ├── auth.js            # Authentication routes
│   ├── tasks.js           # Task management routes
│   └── users.js           # User management routes
├── utils/                  # Utility functions
│   └── logger.js          # Winston logger configuration
├── logs/                   # Log files (created at runtime)
├── .env.example           # Environment variables template
├── Dockerfile             # Docker configuration
├── healthcheck.js         # Docker health check script
├── index.js               # Main application file
├── jest.config.js         # Jest configuration
├── jest.setup.js          # Jest setup file
└── package.json           # Dependencies and scripts
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6.0 or higher)
- npm or yarn

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0
   
   # Or use local MongoDB installation
   mongod
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/mern-deployment-app |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | 30d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |
| `LOG_LEVEL` | Logging level | info |

## 📚 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-api-domain.com/api`

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

#### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "john.updated@example.com"
}
```

### Task Management Endpoints

#### Get All Tasks
```http
GET /api/tasks?page=1&limit=10&status=pending&priority=high
Authorization: Bearer <jwt_token>
```

#### Get Single Task
```http
GET /api/tasks/:id
Authorization: Bearer <jwt_token>
```

#### Create Task
```http
POST /api/tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Complete project",
  "description": "Finish the MERN stack project",
  "priority": "high",
  "category": "work",
  "dueDate": "2024-12-31"
}
```

#### Update Task
```http
PUT /api/tasks/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated task title",
  "status": "completed"
}
```

#### Delete Task
```http
DELETE /api/tasks/:id
Authorization: Bearer <jwt_token>
```

#### Archive/Unarchive Task
```http
PUT /api/tasks/:id/archive
Authorization: Bearer <jwt_token>
```

#### Get Task Statistics
```http
GET /api/tasks/stats/overview
Authorization: Bearer <jwt_token>
```

### User Management Endpoints (Admin Only)

#### Get All Users
```http
GET /api/users
Authorization: Bearer <admin_jwt_token>
```

#### Get Single User
```http
GET /api/users/:id
Authorization: Bearer <admin_jwt_token>
```

#### Update User
```http
PUT /api/users/:id
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "role": "admin",
  "isActive": true
}
```

#### Delete User
```http
DELETE /api/users/:id
Authorization: Bearer <admin_jwt_token>
```

### Monitoring Endpoints

#### Health Check
```http
GET /api/health
```

#### Prometheus Metrics
```http
GET /api/metrics
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure
- Unit tests for models and utilities
- Integration tests for API endpoints
- Authentication and authorization tests
- Database operation tests

## 🔒 Security Features

- **Helmet**: Security headers
- **Rate Limiting**: Prevent abuse
- **CORS**: Cross-origin resource sharing
- **Input Validation**: Express-validator
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt
- **Error Handling**: Secure error responses

## 📊 Monitoring & Logging

### Logging
- **Winston**: Structured logging
- **Morgan**: HTTP request logging
- **Log Levels**: error, warn, info, debug
- **Log Files**: Rotating file appender

### Metrics
- **Prometheus**: Application metrics
- **Custom Metrics**: HTTP requests, database connections, business metrics
- **Health Checks**: Endpoint monitoring

### Available Metrics
- `http_request_duration_seconds`: HTTP request duration
- `http_requests_total`: Total HTTP requests
- `active_connections`: Active connections
- `database_connections`: Database connection status
- `tasks_total`: Task metrics by status/priority
- `users_total`: User metrics by role/status

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t mern-backend .
```

### Run Container
```bash
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/mern-deployment-app \
  -e JWT_SECRET=your_secret_key \
  mern-backend
```

### Docker Compose
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🚀 Production Deployment

### Environment Setup
1. Set up MongoDB Atlas or self-hosted MongoDB
2. Configure environment variables
3. Set up SSL certificates
4. Configure reverse proxy (Nginx)
5. Set up monitoring and logging

### Deployment Platforms

#### Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically on push

#### Railway
1. Connect GitHub repository
2. Configure environment variables
3. Deploy with automatic scaling

#### Heroku
1. Create Heroku app
2. Set config vars
3. Deploy using Git or GitHub integration

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] SSL certificates installed
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] Backup strategy implemented
- [ ] Health checks enabled
- [ ] Rate limiting configured
- [ ] Error tracking set up (Sentry)

## 🔧 Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server with nodemon |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint issues |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please create an issue in the GitHub repository or contact the development team.

## 📝 Changelog

### v1.0.0
- Initial release
- User authentication and authorization
- Task management CRUD operations
- Prometheus metrics integration
- Docker support
- Comprehensive test suite