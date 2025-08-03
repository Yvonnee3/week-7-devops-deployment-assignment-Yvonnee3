# MERN Stack Deployment Guide

A simple MERN (MongoDB, Express, React, Node.js) task manager application with deployment configurations.

## 📁 Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── deployment/      # Deployment configurations
└── .github/         # CI/CD workflows
```

## 🚀 Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mern-deployment
   ```

2. **Setup Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create MongoDB Atlas Database**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free cluster
   - Get your connection string

2. **Deploy to Render**
   - Go to [Render](https://render.com)
   - Connect your GitHub repository
   - Create a new Web Service
   - Set build command: `cd server && npm install`
   - Set start command: `cd server && npm start`
   - Add environment variables:
     - `NODE_ENV`: `production`
     - `MONGODB_URI`: Your MongoDB Atlas connection string

### Frontend Deployment (Vercel)

1. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Connect your GitHub repository
   - Vercel will auto-detect the configuration
   - Add environment variable:
     - `VITE_API_URL`: Your Render backend URL

### Alternative: Frontend on Netlify

1. **Deploy to Netlify**
   - Go to [Netlify](https://netlify.com)
   - Connect your GitHub repository
   - It will use the `netlify.toml` configuration
   - Add environment variable:
     - `VITE_API_URL`: Your Render backend URL

## 🔄 CI/CD Pipeline

The project includes a GitHub Actions workflow that:
- Runs tests on both frontend and backend
- Builds the frontend
- Auto-deploys when code is pushed to main branch

## 🛠️ Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mern-tasks
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:5000
VITE_NODE_ENV=development
```

## 📋 API Endpoints

- `GET /` - API information
- `GET /api/health` - Health check
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a task
- `DELETE /api/tasks/:id` - Delete a task

## 🧪 Testing

```bash
# Test backend
cd server && npm test

# Test frontend
cd client && npm test
```

## 📦 Production URLs

After deployment, update this section with your live URLs:

- **Frontend**: https://your-app.vercel.app
- **Backend**: https://your-api.onrender.com
- **API Health**: https://your-api.onrender.com/api/health

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure your frontend URL is allowed in backend CORS configuration
   - Update `VITE_API_URL` in frontend environment variables

2. **Database Connection**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas
   - Ensure database user has proper permissions

3. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Check environment variables are set correctly

### Monitoring

- Backend health: `GET /api/health`
- Check application logs in Render/Vercel dashboards
- Monitor database connections in MongoDB Atlas

## 📝 Development Notes

This is a simplified MERN stack setup focused on:
- ✅ Easy deployment
- ✅ Basic functionality
- ✅ Simple CI/CD
- ✅ Essential monitoring

For production applications, consider adding:
- Authentication & authorization
- Input validation & sanitization
- Rate limiting & security headers
- Error tracking (Sentry)
- Performance monitoring
- Database backups
- SSL certificates 