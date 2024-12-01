import express from "express";
import moment from "moment-timezone";
import db from "../utils/connect-mysql.js";
import upload from "../utils/csvHandler.js";

const dateFormat = "YYYY-MM-DD";
const router = express.Router();

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
    // const sql2 = `SELECT ab.*, li.sid like_sid
    //             FROM clients c
    //             LEFT JOIN (
    //               SELECT * FROM ab_likes WHERE member_id=${member_sid}
    //             ) li ON ab.sid=li.ab_sid
    //             ${where}
    //             ORDER BY ab.sid DESC
    //             LIMIT ${(page - 1) * perPage}, ${perPage} `;
    // console.log(req.my_jwt);
    // console.log(sql2);
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
  res.locals.pageName = "ab-list";
  const result = await getListData(req);
  return res.render("user/list", result);
});

router.get("/api", async (req, res) => {
  const result = await getListData(req);
  res.json(result);
});

router.get("/add", async (req, res) => {
  res.locals.pageName = "ab-add";
  // 呈現新增資料的表單
  res.render("user/add");
});

router.post("/add", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    result: {},
  };
  // 處理表單資料

  // TODO: 欄位資料檢查

  /*
  const sql = `INSERT INTO address_book 
  ( name, email, mobile, birthday, address, created_at) VALUES (
    ?, ?, ?, ?, ?, NOW()
  )`;

  const [result] = await db.query(sql, [
    req.body.name,
    req.body.email,
    req.body.mobile,
    req.body.birthday,
    req.body.address,
  ]);
  */
  const sql2 = `INSERT INTO clients set ?`;
  // data 物件的屬性, 對應到資料表的欄位
  const data = { ...req.body };

  data.birthday = moment(data.birthday);
  if (data.birthday.isValid()) {
    // 如果是正確的格式
    data.birthday = data.birthday.format(dateFormat);
  } else {
    // 不是正確的日期格式, 就使用空值
    data.birthday = null;
  }
  data.purchase_date = moment(data.purchase_date);
  if (data.purchase_date.isValid()) {
    data.purchase_date = data.purchase_date.format(dateFormat);
  } else {
    data.purchase_date = null;
  }

  try {
    const [result] = await db.query(sql2, [data]);
    output.result = result;
    output.success = !!result.affectedRows;
  } catch (ex) {
    // sql 發生錯誤
    output.error = ex; // 開發時期除錯
  }
  res.json(output);
  /*
{
    "fieldCount": 0,
    "affectedRows": 1,
    "insertId": 1011,
    "info": "",
    "serverStatus": 2,
    "warningStatus": 0,
    "changedRows": 0
}
*/
});

// 比較符合 RESTful API 的寫法
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
  // TODO: 欄位資料檢查

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
// 處理修改資料的表單
router.put("/edit/:sid", upload.none(), async (req, res) => {
  const output = {
    success: false,
    bodyData: req.body,
    result: null,
  };

  let sid = +req.params.sid || 0;
  if (!sid) {
    return res.json({ success: false, info: "不正確的主鍵" });
  }
  const sql = "UPDATE clients SET ? WHERE sid=?";
  const [result] = await db.query(sql, [req.body, sid]);

  output.result = result;
  output.success = !!(result.affectedRows && result.changedRows);

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

export default router;