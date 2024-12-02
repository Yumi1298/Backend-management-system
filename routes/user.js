import express from "express";
import moment from "moment-timezone";
import db from "../utils/connect-mysql.js";
import multer from "multer";
// import upload from "../middlewares/upload.js";
import { parseCSV } from "../utils/csv-handler.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();
const upload = multer({ dest: "uploads/" });

const getListData = async (req) => {
  let keyword = req.query.keyword || ""; // 預設值為空字串

  let birthBegin = req.query.birthBegin || ""; // 這個日期之後出生的
  let birthEnd = req.query.birthEnd || ""; // 這個日期之前出生的

  const perPage = 10; // 每頁最多有幾筆
  let page = +req.query.page || 1;
  if (page < 1) {
    return {
      success: false,
      redirect: `?page=1`, // 需要轉向
      info: "page 值太小",
    };
  }

  let where = " WHERE 1 ";
  if (keyword) {
    // where += ` AND \`name\` LIKE ${db.escape("%" + keyword + "%")} `;
    where += ` AND 
    (
      c.name LIKE ${db.escape(`%${keyword}%`)} 
      OR
      c.mobile LIKE ${db.escape(`%${keyword}%`)} 
      OR
      c.product_id LIKE ${db.escape(`%${keyword}%`)} 
      OR
      c.purchase_source LIKE ${db.escape(`%${keyword}%`)}
    )
    `;
  }

  birthBegin = moment(birthBegin);
  if (birthBegin.isValid()) {
    where += ` AND c.birthday >= '${birthBegin.format(dateFormat)}' `;
  }
  birthEnd = moment(birthEnd);
  if (birthEnd.isValid()) {
    where += ` AND c.birthday <= '${birthEnd.format(dateFormat)}' `;
  }

  const sql = `SELECT COUNT(*) totalRows FROM clients c ${where}`;
  const [[{ totalRows }]] = await db.query(sql); // 取得總筆數

  let totalPages = 0; // 總頁數, 預設值設定 0
  let rows = []; // 分頁資料
  if (totalRows > 0) {
    totalPages = Math.ceil(totalRows / perPage);
    if (page > totalPages) {
      return {
        success: false,
        redirect: `?page=${totalPages}`, // 需要轉向
        info: "page 值太大",
      };
    }

    const member_sid = req.my_jwt?.id ? req.my_jwt?.id : 0;
    const sql2 = `SELECT * FROM clients c ${where} ORDER BY sid DESC LIMIT ${
      (page - 1) * perPage
    }, ${perPage} `;

    [rows] = await db.query(sql2);

    rows.forEach((r) => {
      // "JS 的 Date 類型" 轉換為日期格式的字串
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
  const result = await getListData(req);
  return res.render("user/list", result);
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
    const sql = `DELETE FROM clients WHERE sid=${sid}`;
    const [result] = await db.query(sql);
    output.result = result;
    output.success = !!result.affectedRows;
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
    // 確認檔案是否存在
    if (!req.file) {
      return res.status(400).json({ errors: ["未找到檔案，請重新上傳"] });
    }

    // 驗證檔案格式是否為 CSV
    const fileExtension = req.file.originalname.split(".").pop().toLowerCase();
    if (fileExtension !== "csv") {
      return res
        .status(400)
        .json({ errors: ["檔案格式不支援，僅接受 CSV 檔案"] });
    }

    // 解析 CSV 檔案並驗證資料
    const filePath = req.file.path;
    const { validRows, errors } = await parseCSV(filePath);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    // 將資料寫入資料庫
    const insertQuery = `
      INSERT INTO clients (name, birthday, mobile, product_id, purchase_date, purchase_source)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    for (const row of validRows) {
      await db.execute(insertQuery, [
        row.name,
        row.birthday,
        row.mobile,
        row.product_id,
        row.purchase_date,
        row.purchase_source,
      ]);
    }

    res.status(200).json({ message: "資料上傳並儲存成功", data: validRows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ errors: ["伺服器發生錯誤，請稍後再試"] });
  }
});

export default router;
