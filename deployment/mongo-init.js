// MongoDB initialization script
db = db.getSiblingDB('mern-deployment-app');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password'],
      properties: {
        name: {
          bsonType: 'string',
          description: 'must be a string and is required'
        },
        email: {
          bsonType: 'string',
          pattern: '^.+@.+\..+$',
          description: 'must be a valid email address and is required'
        },
        password: {
          bsonType: 'string',
          minLength: 6,
          description: 'must be a string of at least 6 characters and is required'
        },
        role: {
          bsonType: 'string',
          enum: ['user', 'admin'],
          description: 'must be either user or admin'
        },
        isActive: {
          bsonType: 'bool',
          description: 'must be a boolean'
        }
      }
    }
  }
});

db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'user'],
      properties: {
        title: {
          bsonType: 'string',
          maxLength: 100,
          description: 'must be a string of max 100 characters and is required'
        },
        description: {
          bsonType: 'string',
          maxLength: 500,
          description: 'must be a string of max 500 characters'
        },
        status: {
          bsonType: 'string',
          enum: ['pending', 'in-progress', 'completed'],
          description: 'must be one of the allowed status values'
        },
        priority: {
          bsonType: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'must be one of the allowed priority values'
        },
        category: {
          bsonType: 'string',
          enum: ['work', 'personal', 'shopping', 'health', 'other'],
          description: 'must be one of the allowed category values'
        },
        user: {
          bsonType: 'objectId',
          description: 'must be a valid ObjectId and is required'
        },
        isArchived: {
          bsonType: 'bool',
          description: 'must be a boolean'
        }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: 1 });

db.tasks.createIndex({ user: 1, status: 1 });
db.tasks.createIndex({ user: 1, dueDate: 1 });
db.tasks.createIndex({ user: 1, priority: 1 });
db.tasks.createIndex({ user: 1, category: 1 });
db.tasks.createIndex({ user: 1, isArchived: 1 });
db.tasks.createIndex({ createdAt: 1 });
db.tasks.createIndex({ updatedAt: 1 });

// Create text index for search functionality
db.tasks.createIndex({
  title: 'text',
  description: 'text'
}, {
  weights: {
    title: 10,
    description: 5
  },
  name: 'task_text_index'
});

print('Database initialization completed successfully!');
print('Collections created: users, tasks');
print('Indexes created for optimal performance');
print('Validation rules applied to collections');