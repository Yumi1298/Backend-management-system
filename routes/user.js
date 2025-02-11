import express from "express";
import moment from "moment-timezone";
import db from "../utils/connect-mysql.js";
import multer from "multer";
import xlsx from "xlsx";
import upload from "../middlewares/upload.js";
// import { parseCSV } from "../utils/csv-handler.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();
// const upload = multer({
//   dest: "uploads/",
//   limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
// });

const getListData = async (req) => {
  let keyword = req.query.keyword || "";
  let birthBegin = req.query.birthBegin || "";
  let birthEnd = req.query.birthEnd || "";

  const perPage = 10;
  let page = +req.query.page || 1;
  if (page < 1) {
    return {
      success: false,
      redirect: `?page=1`,
      info: "page 值太小",
    };
  }

  let where = " WHERE 1 ";
  if (keyword) {
    where += ` AND 
      (c.name LIKE ${db.escape(`%${keyword}%`)} 
      OR c.mobile LIKE ${db.escape(`%${keyword}%`)} 
      OR c.product_id LIKE ${db.escape(`%${keyword}%`)} 
      OR c.purchase_source LIKE ${db.escape(`%${keyword}%`)})`;
  }

  birthBegin = moment(birthBegin);
  if (birthBegin.isValid()) {
    where += ` AND c.birthday >= '${birthBegin.format(dateFormat)}' `;
  }
  birthEnd = moment(birthEnd);
  if (birthEnd.isValid()) {
    where += ` AND c.birthday <= '${birthEnd.format(dateFormat)}' `;
  }

  // 取得排序欄位和排序方向
  const sortBy = req.query.sortBy || "sid"; // 預設排序欄位為編號
  const sortOrder = req.query.sortOrder === "desc" ? "DESC" : "ASC"; // 預設排序為升序

  const sql = `SELECT COUNT(*) totalRows FROM clients c ${where}`;
  const [[{ totalRows }]] = await db.query(sql);

  let totalPages = 0;
  let rows = [];
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return {
        success: false,
        redirect: `?page=${totalPages}`,
        info: "page 值太大",
      };
    }

    const member_sid = req.my_jwt?.id ? req.my_jwt?.id : 0;
    // 根據排序欄位和排序方向構建 SQL 查詢
    const sql2 = `SELECT * FROM clients c ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ${
      (page - 1) * perPage
    }, ${perPage}`;

    [rows] = await db.query(sql2);

    rows.forEach((r) => {
      if (r.birthday) {
        r.birthday = moment(r.birthday).format(dateFormat);
      }
      if (r.purchase_date) {
        r.purchase_date = moment(r.purchase_date).format(dateFormat);
      }
    });
  }
  return {
    success: true,
    totalRows,
    totalPages,
    page,
    perPage,
    rows,
    qs: req.query,
  };
};

router.get("/", async (req, res) => {
  res.locals.pageName = "list";
  const data = await getListData(req);
  return res.render("user/list", {
    success: data.success,
    totalRows: data.totalRows,
    totalPages: data.totalPages,
    page: data.page,
    perPage: data.perPage,
    rows: data.rows,
    qs: req.query, // 確保將 req.query 傳遞給 EJS
  });
});

// 呈現新增資料的表單
router.get("/add", async (req, res) => {
  res.locals.pageName = "add";
  res.render("user/add");
});

// 新增資料
router.post("/add", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    errors: {},
    result: {},
  };

  const { name, birthday, mobile, product_id, purchase_date, purchase_source } =
    req.body;

  // 今天的日期
  const today = moment().startOf("day");

  // 欄位檢查
  if (!name || name.trim().length < 2) {
    output.errors.name = "名字需大於兩個字";
  }

  const parsedBirthday = moment(birthday, "YYYY-MM-DD", true);
  if (!birthday || !parsedBirthday.isValid()) {
    output.errors.birthday = "請填寫正確日期格式(YYYY-MM-DD)";
  } else if (parsedBirthday.isAfter(today)) {
    output.errors.birthday = "不得選取超出今日的日期";
  }

  const mobileRegex = /^09\d{8}$/;
  if (!mobile || !mobileRegex.test(mobile)) {
    output.errors.mobile = "請填寫正確手機格式";
  }

  if (product_id && isNaN(Number(product_id))) {
    output.errors.product_id = "請填寫正確的商品序號";
  }

  const parsedPurchaseDate = moment(purchase_date, "YYYY-MM-DD", true);
  if (purchase_date && !parsedPurchaseDate.isValid()) {
    output.errors.purchase_date = "請填寫正確日期格式(YYYY-MM-DD)";
  } else if (purchase_date && parsedPurchaseDate.isAfter(today)) {
    output.errors.purchase_date = "不得選取超出今日的日期";
  }

  const validPurchaseSources = ["其他", "實體店面", "網路購買"];
  if (purchase_source && !validPurchaseSources.includes(purchase_source)) {
    output.errors.purchase_source = "請填寫正確的來源";
  }

  // 如果有錯誤，直接返回錯誤訊息
  if (Object.keys(output.errors).length > 0) {
    return res.json(output);
  }

  // 處理格式正確的日期
  const data = {
    name: name.trim(),
    birthday: parsedBirthday.isValid()
      ? parsedBirthday.format("YYYY-MM-DD")
      : null,
    mobile,
    product_id: product_id || null,
    purchase_date: parsedPurchaseDate.isValid()
      ? parsedPurchaseDate.format("YYYY-MM-DD")
      : null,
    purchase_source: purchase_source || null,
  };

  const sql2 = `INSERT INTO clients SET ?`;

  try {
    const [result] = await db.query(sql2, [data]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    output.error = ex; // 除錯用
  }

  res.json(output);
});

// 刪除資料
router.delete("/:sid", async (req, res) => {
  const output = {
    success: false,
    result: {},
  };
  let sid = +req.params.sid || 0;

  if (sid) {
    try {
      // 使用參數化查詢
      const sql = `DELETE FROM clients WHERE sid = ?`;
      const [result] = await db.query(sql, [sid]);

      output.result = result;
      output.success = !!result.affectedRows;

      // 增加日誌記錄
      console.log(`成功刪除 sid=${sid} 的資料`, result);
    } catch (error) {
      // 錯誤處理
      console.error(`刪除 sid=${sid} 的資料時發生錯誤`, error);
      output.success = false;
      output.error = error.message;
    }
  } else {
    // 無效的 sid
    output.error = "無效的 ID";
  }

  res.json(output);
});

// 呈現修改資料的表單
router.get("/edit/:sid", async (req, res) => {
  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.redirect("/user");
  }
  const sql = `SELECT * FROM clients WHERE sid=${sid}`;
  const [rows] = await db.query(sql);
  if (rows.length === 0) {
    // 沒有該筆資料時, 跳回列表頁
    return res.redirect("/user");
  }

  const row = rows[0];
  if (row.birthday) {
    // 日期格式轉換
    row.birthday = moment(row.birthday).format(dateFormat);
  }
  if (row.purchase_date) {
    row.purchase_date = moment(row.purchase_date).format(dateFormat);
  }

  res.render("user/edit", row);
});

// 修改資料
router.put("/edit/:sid", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    errors: {},
    result: null,
  };

  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.json({ success: false, info: "不正確的主鍵" });
  }

  const { name, birthday, mobile, product_id, purchase_date, purchase_source } =
    req.body;

  // 今天的日期
  const today = moment().startOf("day");

  // 欄位檢查
  if (!name || name.trim().length < 2) {
    output.errors.name = "名字需大於兩個字";
  }

  const parsedBirthday = moment(birthday, "YYYY-MM-DD", true);
  if (!birthday || !parsedBirthday.isValid()) {
    output.errors.birthday = "請填寫正確日期格式(YYYY-MM-DD)";
  } else if (parsedBirthday.isAfter(today)) {
    output.errors.birthday = "不得選取超出今日的日期";
  }

  const mobileRegex = /^09\d{8}$/;
  if (!mobile || !mobileRegex.test(mobile)) {
    output.errors.mobile = "請填寫正確手機格式";
  }

  if (product_id && isNaN(Number(product_id))) {
    output.errors.product_id = "請填寫正確的商品序號";
  }

  const parsedPurchaseDate = moment(purchase_date, "YYYY-MM-DD", true);
  if (purchase_date && !parsedPurchaseDate.isValid()) {
    output.errors.purchase_date = "請填寫正確日期格式(YYYY-MM-DD)";
  } else if (purchase_date && parsedPurchaseDate.isAfter(today)) {
    output.errors.purchase_date = "不得選取超出今日的日期";
  }

  const validPurchaseSources = ["其他", "實體店面", "網路購買"];
  if (purchase_source && !validPurchaseSources.includes(purchase_source)) {
    output.errors.purchase_source = "請填寫正確的來源";
  }

  // 如果有錯誤，直接返回錯誤訊息
  if (Object.keys(output.errors).length > 0) {
    return res.json(output);
  }

  // 處理格式正確的日期
  const data = {
    name: name.trim(),
    birthday: parsedBirthday.isValid()
      ? parsedBirthday.format("YYYY-MM-DD")
      : null,
    mobile,
    product_id: product_id || null,
    purchase_date: parsedPurchaseDate.isValid()
      ? parsedPurchaseDate.format("YYYY-MM-DD")
      : null,
    purchase_source: purchase_source || null,
  };

  const sql = "UPDATE clients SET ? WHERE sid=?";
  try {
    const [result] = await db.query(sql, [data, sid]);
    output.result = result;
    output.success = !!(result.affectedRows && result.changedRows);
  } catch (ex) {
    output.error = ex; // 除錯用
  }
  res.json(output);
});

// 取得單筆資料的 api
router.get("/:sid", async (req, res) => {
  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.json({ success: false, code: 401 });
  }
  const sql = `SELECT * FROM clients WHERE sid=${sid}`;
  const [rows] = await db.query(sql);
  if (rows.length === 0) {
    // 沒有該筆資料時,
    return res.json({ success: false, code: 402 });
  }
  const row = rows[0];
  if (row.birthday) {
    // 日期格式轉換
    row.birthday = moment(row.birthday).format(dateFormat);
  }
  if (row.purchase_date) {
    row.purchase_date = moment(row.purchase_date).format(dateFormat);
  }
  res.json({ success: true, data: row });
});

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, errors: ["未上傳檔案"] });
    }

    const filePath = req.file.path;
    console.log("File uploaded at:", filePath);

    // 解析 Excel 檔案
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log("Parsed data:", data);

    // 儲存錯誤 & 有效資料
    const errors = [];
    const validData = [];
    const fileMobiles = new Set(); // 記錄 Excel 內 `mobile`

    // 查詢資料庫內已有的 `mobile`
    const [existingResults] = await db.query("SELECT mobile FROM clients");
    const existingMobiles = new Set(existingResults.map((row) => row.mobile));

    // Excel 日期轉換函數
    const excelDateToJSDate = (serial) => {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + serial * 86400000)
        .toISOString()
        .split("T")[0];
    };

    data.forEach((row, index) => {
      const {
        name,
        birthday,
        mobile,
        product_id,
        purchase_date,
        purchase_source,
      } = row;
      let formattedBirthday = birthday;
      let formattedPurchaseDate = purchase_date;

      // 轉換 Excel 數值日期格式
      if (typeof birthday === "number")
        formattedBirthday = excelDateToJSDate(birthday);
      if (typeof purchase_date === "number")
        formattedPurchaseDate = excelDateToJSDate(purchase_date);

      // 資料驗證
      if (!name || name.length < 2) {
        errors.push(`第 ${index + 2} 列: 姓名格式不正確`);
      } else if (
        !formattedBirthday ||
        !/^\d{4}-\d{2}-\d{2}$/.test(formattedBirthday)
      ) {
        errors.push(`第 ${index + 2} 列: 生日格式不正確`);
      } else if (!mobile || !/^09\d{8}$/.test(mobile)) {
        errors.push(`第 ${index + 2} 列: 手機格式不正確`);
      } else if (existingMobiles.has(mobile)) {
        errors.push(`第 ${index + 2} 列: 手機號碼 ${mobile} 已存在於資料庫`);
      } else if (fileMobiles.has(mobile)) {
        errors.push(
          `第 ${index + 2} 列: 手機號碼 ${mobile} 在 Excel 檔案內重複`
        );
      } else {
        fileMobiles.add(mobile);
        validData.push([
          name,
          formattedBirthday,
          mobile,
          product_id || null,
          formattedPurchaseDate || null,
          purchase_source || null,
        ]);
      }
    });

    if (errors.length) {
      console.log("驗證錯誤:", errors);
      return res.status(400).json({ success: false, errors });
    }

    if (validData.length === 0) {
      return res.status(400).json({
        success: false,
        errors: ["所有資料皆有錯誤，請修正後重新上傳"],
      });
    }

    // SQL 插入語法，若 `mobile` 重複則更新
    const insertQuery = `
      INSERT INTO clients (name, birthday, mobile, product_id, purchase_date, purchase_source)
      VALUES ?`;

    await db.query(insertQuery, [validData]);

    console.log("資料上傳成功");
    return res.json({ success: true, message: "資料上傳成功！" });
  } catch (err) {
    console.error("伺服器錯誤:", err);
    return res.status(500).json({
      success: false,
      message: "伺服器錯誤，請稍後再試",
      error: err.message,
    });
  }
});

router.post("/delete-users", async (req, res) => {
  const { userIds } = req.body;

  // Debug: 確認收到的 userIds
  console.log("收到的 userIds:", userIds);
  console.log("類型:", typeof userIds, "第一個元素類型:", typeof userIds?.[0]);

  if (
    !Array.isArray(userIds) ||
    userIds.length === 0 ||
    userIds.some((sid) => !Number.isInteger(sid) || sid <= 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "請提供有效的用戶 ID 列表（正整數）",
      receivedData: userIds, // 顯示錯誤的資料
    });
  }

  try {
    const query = `DELETE FROM clients WHERE sid IN (?)`;
    const [result] = await db.query(query, [userIds]);

    return res.json({
      success: true,
      message: `成功刪除 ${result.affectedRows} 位用戶`,
      totalDeleted: result.affectedRows,
    });
  } catch (error) {
    console.error("刪除用戶時發生錯誤:", error);
    return res.status(500).json({
      success: false,
      message: "伺服器錯誤，無法刪除用戶",
      error: error.message,
    });
  }
});

export default router;
