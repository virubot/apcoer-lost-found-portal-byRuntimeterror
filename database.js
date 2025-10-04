const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

class Database {
  constructor() {
    this.db = new sqlite3.Database('./lost_found.db');
    this.init();
  }

  init() {
    // Create admins table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating admins table:', err);
        return;
      }
      // Create default admin user after table is created
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      this.db.run(`
        INSERT OR IGNORE INTO admins (username, password) 
        VALUES ('admin', ?)
      `, [hashedPassword]);
    });

    // Create items table
    this.db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        found_location TEXT NOT NULL,
        collection_location TEXT NOT NULL,
        image_path TEXT,
        is_collected BOOLEAN DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        upload_date DATETIME DEFAULT (datetime('now', 'localtime')),
        collected_date DATETIME,
        archived_date DATETIME,
        collected_by TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating items table:', err);
        return;
      }
    });

    // Add migration for collected_by column if it doesn't exist
    this.db.run(`
      ALTER TABLE items ADD COLUMN collected_by TEXT;
    `, (err) => {
      // This will error if column already exists, which is fine
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration error:', err);
      }
    });

    // Add migration for archived columns if they don't exist
    this.db.run(`
      ALTER TABLE items ADD COLUMN is_archived BOOLEAN DEFAULT 0;
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration error for is_archived:', err);
      }
    });

    this.db.run(`
      ALTER TABLE items ADD COLUMN archived_date DATETIME;
    `, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Migration error for archived_date:', err);
      }
    });

    console.log('Database initialized successfully');
  }

  // Admin methods
  async verifyAdmin(username, password) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM admins WHERE username = ?',
        [username],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          if (!row) {
            resolve(false);
            return;
          }
          const isValid = bcrypt.compareSync(password, row.password);
          resolve(isValid ? row : false);
        }
      );
    });
  }

  async changeAdminPassword(username, newPassword) {
    return new Promise((resolve, reject) => {
      const hashedPassword = bcrypt.hashSync(newPassword, 10);
      this.db.run(
        'UPDATE admins SET password = ? WHERE username = ?',
        [hashedPassword, username],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Item methods
  async addItem(description, foundLocation, collectionLocation, imagePath) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO items (description, found_location, collection_location, image_path, upload_date)
         VALUES (?, ?, ?, ?, datetime('now', 'localtime'))`,
        [description, foundLocation, collectionLocation, imagePath],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.lastID);
        }
      );
    });
  }

  async getAllItems() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM items WHERE is_collected = 0 ORDER BY upload_date DESC',
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  async getCollectedItems() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM items WHERE is_collected = 1 ORDER BY collected_date DESC',
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  async markAsCollected(itemId, collectedBy) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE items SET is_collected = 1, collected_date = datetime("now", "localtime"), collected_by = ? WHERE id = ?',
        [collectedBy, itemId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        }
      );
    });
  }

  // Auto-archive items older than 1 month
  async autoArchiveItems() {
    return new Promise((resolve, reject) => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      this.db.run(
        'UPDATE items SET is_archived = 1, archived_date = datetime("now", "localtime") WHERE is_collected = 0 AND is_archived = 0 AND datetime(upload_date) < datetime("now", "-1 month")',
        [],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes);
        }
      );
    });
  }

  // Clear collection history - reset all collected items back to active
  async clearCollectionHistory() {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE items SET is_collected = 0, collected_date = NULL, collected_by = NULL WHERE is_collected = 1',
        [],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes);
        }
      );
    });
  }

  // Clear active items - delete all current active items (keep only archived)
  async clearActiveItems() {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM items WHERE is_collected = 0 AND is_archived = 0',
        [],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes);
        }
      );
    });
  }

  // Get archived items
  async getArchivedItems() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM items WHERE is_archived = 1 ORDER BY archived_date DESC',
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows);
        }
      );
    });
  }

  // Get statistics
  async getStatistics() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT 
          (SELECT COUNT(*) FROM items WHERE is_collected = 0 AND is_archived = 0) as current_count,
          (SELECT COUNT(*) FROM items WHERE is_archived = 1) as archived_count,
          (SELECT COUNT(*) FROM items WHERE is_collected = 1) as collected_count`,
        (err, rows) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(rows[0]);
        }
      );
    });
  }

  // Delete a specific item by ID
  async deleteItem(itemId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM items WHERE id = ?',
        [itemId],
        function(err) {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.changes > 0);
        }
      );
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = Database;