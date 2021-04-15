const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  database: "emojidatabase",
  user: "publicadmin",
  port:"3306",
  password: "1600holloway",
  host: "54.215.121.49",

  
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

}); 

  pool.getConnection(err => {
    if (err) throw err;
    console.log("My database is connected!");
    console.log(pool.query('emojidatabase'));
    // connection.release();
  });
  
  module.exports = pool;
