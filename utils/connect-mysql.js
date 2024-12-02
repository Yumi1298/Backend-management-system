import dotenv from "dotenv";
import mysql from "mysql2/promise";

// 加載 .env 檔案
dotenv.config();

const { DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT } = process.env;
console.log({ DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT });

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
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
