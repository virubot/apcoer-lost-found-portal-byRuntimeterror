const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Get new password from command line arguments
const newPassword = process.argv[2];

if (!newPassword) {
    console.log('Usage: node change-password.js <new-password>');
    console.log('Example: node change-password.js mynewpassword123');
    process.exit(1);
}

// Connect to database
const db = new sqlite3.Database('./lost_found.db');

// Hash the new password
const hashedPassword = bcrypt.hashSync(newPassword, 10);

// Update the admin password
db.run(
    'UPDATE admins SET password = ? WHERE username = ?',
    [hashedPassword, 'admin'],
    function(err) {
        if (err) {
            console.error('Error updating password:', err);
        } else {
            console.log('✅ Admin password updated successfully!');
            console.log('New credentials:');
            console.log('Username: admin');
            console.log('Password:', newPassword);
        }
        db.close();
    }
);
