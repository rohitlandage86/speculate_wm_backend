const Pool = require('pg').Pool;
const pool = new Pool({
    user: "postgres",
    password: "Root@123", 
    host: "localhost",
    database: "speculate_db",
    port: 5432
});

// Check if the pool successfully connects to the database
(async () => {
    try {
      const connection = await pool.connect();
      console.log('Connected to the database');
      connection.release();
    } catch (err) {
      console.error('Error connecting to the database:', err);
    }
  })();

module.exports = pool;
  