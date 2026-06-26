const mysql = require("mysql2/promise");
const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const databaseDir = path.join(__dirname, '../database');
const databasePath = path.join(databaseDir, 'spotify.sqlite');
const schemaPath = path.join(databaseDir, 'schema.sql');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

let dbInstance = null;

function createDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  fs.mkdirSync(databaseDir, { recursive: true });

  const database = new DatabaseSync(databasePath);
  const schema = fs.readFileSync(schemaPath, 'utf8');

  database.exec('PRAGMA foreign_keys = ON;');
  database.exec(schema);

  dbInstance = database;
  return database;
}

pool.createDatabase = createDatabase;
pool.databasePath = databasePath;

module.exports = pool;
