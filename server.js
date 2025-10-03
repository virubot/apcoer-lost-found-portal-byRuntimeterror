const express = require('express');
const multer = require('multer');
const path = require('path');
const Database = require('./database');

const app = express();
const PORT = 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use('/views', express.static('views'));
app.use('/styles.css', express.static('styles.css'));
app.use('/script.js', express.static('script.js'));

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Routes

// Home route - redirect to student view
app.get('/', (req, res) => {
  res.redirect('/student');
});

// Student view - no login required
app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'student.html'));
});

// Admin login page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// Admin dashboard
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// API Routes

// Admin login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const admin = await db.verifyAdmin(username, password);
    if (admin) {
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Change admin password
app.post('/api/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Verify current password
    const admin = await db.verifyAdmin('admin', currentPassword);
    if (!admin) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const success = await db.changeAdminPassword('admin', newPassword);
    if (success) {
      res.json({ success: true, message: 'Password changed successfully' });
    } else {
      res.status(500).json({ error: 'Failed to change password' });
    }
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add new lost item
app.post('/api/items', upload.single('image'), async (req, res) => {
  try {
    const { description, foundLocation, collectionLocation } = req.body;
    
    if (!description || !foundLocation || !collectionLocation) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const imagePath = req.file ? req.file.filename : null;
    const itemId = await db.addItem(description, foundLocation, collectionLocation, imagePath);
    
    res.json({ success: true, itemId, message: 'Item added successfully' });
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all current lost items
app.get('/api/items', async (req, res) => {
  try {
    const items = await db.getAllItems();
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get collected items (history)
app.get('/api/items/collected', async (req, res) => {
  try {
    const items = await db.getCollectedItems();
    res.json(items);
  } catch (error) {
    console.error('Get collected items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get archived items
app.get('/api/items/archived', async (req, res) => {
  try {
    const items = await db.getArchivedItems();
    res.json(items);
  } catch (error) {
    console.error('Get archived items error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get statistics
app.get('/api/statistics', async (req, res) => {
  try {
    const stats = await db.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Auto-archive items (can be called manually or by cron job)
app.post('/api/auto-archive', async (req, res) => {
  try {
    const archivedCount = await db.autoArchiveItems();
    res.json({ success: true, archivedCount, message: `Archived ${archivedCount} items` });
  } catch (error) {
    console.error('Auto-archive error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark item as collected
app.put('/api/items/:id/collect', async (req, res) => {
  try {
    const { id } = req.params;
    const { collectedBy } = req.body;
    
    if (!collectedBy || !collectedBy.trim()) {
      return res.status(400).json({ error: 'Student name is required' });
    }
    
    const success = await db.markAsCollected(id, collectedBy.trim());
    
    if (success) {
      res.json({ success: true, message: 'Item marked as collected' });
    } else {
      res.status(404).json({ error: 'Item not found' });
    }
  } catch (error) {
    console.error('Mark collected error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  res.status(500).json({ error: 'Server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Auto-archive function
async function runAutoArchive() {
  try {
    const archivedCount = await db.autoArchiveItems();
    if (archivedCount > 0) {
      console.log(`Auto-archived ${archivedCount} items`);
    }
  } catch (error) {
    console.error('Auto-archive error:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`Lost & Found Portal running on http://localhost:${PORT}`);
  console.log('Default admin credentials: username=admin, password=admin123');
  
  // Run auto-archive on startup
  await runAutoArchive();
  
  // Run auto-archive every hour
  setInterval(runAutoArchive, 60 * 60 * 1000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  db.close();
  process.exit(0);
});