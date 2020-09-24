const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  database: "emoji_db",
  user: "raya1",
  port:3306,
  password: "Qwer$3976",
  // host: "52.53.161.36",
  // host: "127.0.0.1",
  
host: "13.57.196.89",
// host: "18.144.19.235",

  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

});

  pool.getConnection(err => {
    if (err) throw err;
    console.log("My database is connected!");
    pool.query('emoji_db');
    // connection.release();
  });
  
  module.exports = pool;