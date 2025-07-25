const express = require('express');
const { body, validationResult } = require('express-validator');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @desc    Get all tasks for logged in user
// @route   GET /api/tasks
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = { user: req.user.id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.archived !== undefined) {
      filter.isArchived = req.query.archived === 'true';
    } else {
      filter.isArchived = false; // Default: don't show archived tasks
    }

    // Build sort object
    let sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort = { createdAt: -1 }; // Default sort by newest first
    }

    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Task.countDocuments(filter);

    res.json({
      success: true,
      count: tasks.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: tasks
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
router.post('/', [
  body('title', 'Title is required').not().isEmpty(),
  body('title', 'Title cannot be more than 100 characters').isLength({ max: 100 }),
  body('description', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 }),
  body('status', 'Invalid status').optional().isIn(['pending', 'in-progress', 'completed']),
  body('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high']),
  body('category', 'Invalid category').optional().isIn(['work', 'personal', 'shopping', 'health', 'other']),
  body('dueDate', 'Invalid due date').optional().isISO8601()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Add user to req.body
    req.body.user = req.user.id;

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', [
  body('title', 'Title cannot be more than 100 characters').optional().isLength({ max: 100 }),
  body('description', 'Description cannot be more than 500 characters').optional().isLength({ max: 500 }),
  body('status', 'Invalid status').optional().isIn(['pending', 'in-progress', 'completed']),
  body('priority', 'Invalid priority').optional().isIn(['low', 'medium', 'high']),
  body('category', 'Invalid category').optional().isIn(['work', 'personal', 'shopping', 'health', 'other']),
  body('dueDate', 'Invalid due date').optional().isISO8601()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {}
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Archive/Unarchive task
// @route   PUT /api/tasks/:id/archive
// @access  Private
router.put('/:id/archive', async (req, res, next) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      { isArchived: !task.isArchived },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: task
    });

  } catch (error) {
    next(error);
  }
});

// @desc    Get task statistics
// @route   GET /api/tasks/stats
// @access  Private
router.get('/stats/overview', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const stats = await Task.aggregate([
      { $match: { user: userId, isArchived: false } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityStats = await Task.aggregate([
      { $match: { user: userId, isArchived: false } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    const overdueTasks = await Task.countDocuments({
      user: userId,
      isArchived: false,
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    });

    const totalTasks = await Task.countDocuments({ user: userId, isArchived: false });

    res.json({
      success: true,
      data: {
        statusStats: stats,
        priorityStats,
        overdueTasks,
        totalTasks
      }
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;