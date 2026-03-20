// const sqlite3 = require("sqlite3").verbose();

// const db = new sqlite3.Database("./logs.db", (err) => {
//   if (err) {
//     console.error("Database error:", err);
//   } else {
//     console.log("Connected to SQLite database");
//   }
// });

// // Create table
// db.run(`
//   CREATE TABLE IF NOT EXISTS mail_logs (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     professor_name TEXT,
//     university TEXT,
//     email TEXT,
//     attempts INTEGER,
//     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//     ip TEXT,
//     location TEXT
//   )
// `);


// module.exports = db;


// const Database = require("better-sqlite3");

// const db = new Database("logs.db");

// // Create table
// db.prepare(`
//   CREATE TABLE IF NOT EXISTS mail_logs (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     professor_name TEXT,
//     university TEXT,
//     email TEXT,
//     attempts INTEGER,
//     timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
//     ip TEXT,
//     location TEXT
//   )
// `).run();

// module.exports = db;


const Database = require("better-sqlite3");

const db = new Database("logs.db");

// Create table
db.prepare(`
  CREATE TABLE IF NOT EXISTS mail_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    professor_name TEXT,
    university TEXT,
    email TEXT,
    attempts INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT,
    location TEXT
  )
`).run();

module.exports = db;