const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'mern-backend'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const activeConnections = new promClient.Gauge({
  name: 'active_connections',
  help: 'Number of active connections'
});

const databaseConnections = new promClient.Gauge({
  name: 'database_connections',
  help: 'Number of database connections',
  labelNames: ['state']
});

const taskMetrics = new promClient.Gauge({
  name: 'tasks_total',
  help: 'Total number of tasks',
  labelNames: ['status', 'priority']
});

const userMetrics = new promClient.Gauge({
  name: 'users_total',
  help: 'Total number of users',
  labelNames: ['role', 'active']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(databaseConnections);
register.registerMetric(taskMetrics);
register.registerMetric(userMetrics);

// Middleware to collect HTTP metrics
const collectHttpMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const status = res.statusCode;
    
    httpRequestDuration
      .labels(method, route, status)
      .observe(duration);
    
    httpRequestsTotal
      .labels(method, route, status)
      .inc();
  });
  
  next();
};

// Function to update database metrics
const updateDatabaseMetrics = (mongoose) => {
  if (mongoose.connection.readyState === 1) {
    databaseConnections.labels('connected').set(1);
    databaseConnections.labels('disconnected').set(0);
  } else {
    databaseConnections.labels('connected').set(0);
    databaseConnections.labels('disconnected').set(1);
  }
};

// Function to update application metrics
const updateApplicationMetrics = async (User, Task) => {
  try {
    // Update user metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    
    userMetrics.labels('all', 'all').set(totalUsers);
    userMetrics.labels('all', 'active').set(activeUsers);
    userMetrics.labels('admin', 'all').set(adminUsers);
    
    // Update task metrics
    const taskStats = await Task.aggregate([
      {
        $group: {
          _id: { status: '$status', priority: '$priority' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Reset task metrics
    taskMetrics.reset();
    
    // Set task metrics
    taskStats.forEach(stat => {
      taskMetrics
        .labels(stat._id.status, stat._id.priority)
        .set(stat.count);
    });
    
  } catch (error) {
    console.error('Error updating application metrics:', error);
  }
};

// Endpoint to expose metrics
const metricsEndpoint = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (error) {
    res.status(500).end(error);
  }
};

module.exports = {
  register,
  collectHttpMetrics,
  updateDatabaseMetrics,
  updateApplicationMetrics,
  metricsEndpoint,
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    activeConnections,
    databaseConnections,
    taskMetrics,
    userMetrics
  }
};