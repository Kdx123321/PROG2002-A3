// event_db.js
// Database connection module for the Charity Events website (PROG2002 A2).
// This file creates and exports a MySQL connection pool that the
// Express server (server.js) uses to run queries against the
// charityevents_db database.
//
// Before running, make sure:
//   1. MySQL is installed and running.
//   2. The charityevents_db database has been created using charityevents_db.sql.
//   3. The settings below match your local MySQL user/password.

const mysql = require('mysql2');

// Create a connection pool (a pool reuses connections, which is more
// efficient than opening a new connection for every request).
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',          // change to your MySQL username if different
    password: 'kdx200410',          // change to your MySQL password
    database: 'charityevents_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test the connection once at startup so problems are reported early.
db.getConnection((err, connection) => {
    if (err) {
        console.error('ERROR: could not connect to MySQL database.');
        console.error('Details:', err.message);
        console.error('Check that MySQL is running and charityevents_db exists (run charityevents_db.sql).');
    } else {
        console.log('Connected to MySQL database: charityevents_db');
        connection.release();
    }
});

module.exports = db;
