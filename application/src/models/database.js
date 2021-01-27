const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  database: "emojidatabase",
  user: "publicadmin",
  port:"3307",
  password: "1600holloway",
  host: "127.0.0.1",

  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

}); 

  pool.getConnection(err => {
    if (err) throw err;
    console.log("My database is connected!");
    pool.query('emojidatabase');
    // connection.release();
  });
  
  module.exports = pool;
