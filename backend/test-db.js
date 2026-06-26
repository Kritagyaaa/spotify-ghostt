const pool = require('./db');

async function testConnection() {
  try {
    const [rows] = await pool.query(
  'SELECT DATABASE() AS database_name'
);

    console.log('✅ Connected to MySQL');
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Connection Failed');
    console.error(error);
    process.exit(1);
  }
}

testConnection();