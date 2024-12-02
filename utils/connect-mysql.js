import mysql from "mysql2/promise";

const { MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT } =
  process.env;

const db = mysql.createPool({
  host: MYSQLHOST,
  user: MYSQLUSER,
  password: MYSQLPASSWORD,
  database: MYSQLDATABASE,
  port: MYSQLPORT, // 添加端口
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
});

// 測試資料庫連接
db.getConnection()
  .then((connection) => {
    console.log("資料庫連接成功");
    connection.release();
  })
  .catch((err) => {
    console.error("資料庫連接失敗: ", err);
  });

export default db;
