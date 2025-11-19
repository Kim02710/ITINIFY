const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, 'itinify.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

// Connect to the database
const db = new Database(dbPath);

// Read and execute the schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

db.close();

console.log('Database migrated successfully!');
