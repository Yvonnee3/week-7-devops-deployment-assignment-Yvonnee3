import { useQuery } from 'react-query';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { api, user } = useAuth();

  // Fetch task statistics
  const { data: stats, isLoading: statsLoading } = useQuery(
    'taskStats',
    async () => {
      const response = await api.get('/tasks/stats/overview');
      return response.data.data;
    }
  );

  // Fetch recent tasks
  const { data: recentTasks, isLoading: tasksLoading } = useQuery(
    'recentTasks',
    async () => {
      const response = await api.get('/tasks?limit=5&sortBy=createdAt:desc');
      return response.data.data;
    }
  );

  const getStatusStats = () => {
    if (!stats?.statusStats) return { pending: 0, 'in-progress': 0, completed: 0 };
    
    const statusMap = { pending: 0, 'in-progress': 0, completed: 0 };
    stats.statusStats.forEach(stat => {
      statusMap[stat._id] = stat.count;
    });
    return statusMap;
  };

  const getPriorityStats = () => {
    if (!stats?.priorityStats) return { low: 0, medium: 0, high: 0 };
    
    const priorityMap = { low: 0, medium: 0, high: 0 };
    stats.priorityStats.forEach(stat => {
      priorityMap[stat._id] = stat.count;
    });
    return priorityMap;
  };

  const statusStats = getStatusStats();
  const priorityStats = getPriorityStats();

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="card">
      <div className="card-content">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">{description}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </div>
    </div>
  );

  if (statsLoading || tasksLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your tasks and productivity.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Tasks"
          value={stats?.totalTasks || 0}
          icon={BarChart3}
          color="text-blue-600"
          description="All active tasks"
        />
        <StatCard
          title="Completed"
          value={statusStats.completed}
          icon={CheckCircle}
          color="text-green-600"
          description="Tasks finished"
        />
        <StatCard
          title="In Progress"
          value={statusStats['in-progress']}
          icon={Clock}
          color="text-yellow-600"
          description="Currently working on"
        />
        <StatCard
          title="Overdue"
          value={stats?.overdueTasks || 0}
          icon={AlertCircle}
          color="text-red-600"
          description="Past due date"
        />
      </div>

      {/* Charts and Recent Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Priority Distribution</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">High Priority</span>
                </div>
                <span className="text-sm text-gray-600">{priorityStats.high}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Medium Priority</span>
                </div>
                <span className="text-sm text-gray-600">{priorityStats.medium}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Low Priority</span>
                </div>
                <span className="text-sm text-gray-600">{priorityStats.low}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tasks</h3>
          </div>
          <div className="card-content">
            {recentTasks && recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : task.status === 'in-progress'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high'
                            ? 'bg-red-100 text-red-800'
                            : task.priority === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No tasks yet. Create your first task!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Actions</h3>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-primary btn-md">
              Create New Task
            </button>
            <button className="btn btn-secondary btn-md">
              View All Tasks
            </button>
            <button className="btn btn-secondary btn-md">
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;