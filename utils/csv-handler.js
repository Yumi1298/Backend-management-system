import fs from "fs";
import csvParser from "csv-parser";

export const parseCSV = async (filePath) => {
  const validRows = [];
  const errors = [];
  const rowErrors = [];

  const validateRow = (row, index) => {
    const {
      name,
      birthday,
      mobile,
      product_id,
      purchase_date,
      purchase_source,
    } = row;

    // 驗證
    // if (!name || name.length <= 2) rowErrors.push("姓名需超過兩個字");

    // if (!birthday || !/^\d{4}-\d{2}-\d{2}$/.test(birthday))
    //   rowErrors.push("生日格式不符 (YYYY-MM-DD)");
    // if (!mobile || !/^09\d{8}$/.test(mobile))
    //   rowErrors.push("手機需為台灣號碼格式 (09開頭)");
    // if (isNaN(Number(product_id))) rowErrors.push("產品ID格式錯誤");
    // if (!/^\d{4}-\d{2}-\d{2}$/.test(purchase_date))
    //   rowErrors.push("購買日期格式不符 (YYYY-MM-DD)");
    // if (!["網路購買", "實體店面", "其他"].includes(purchase_source)) {
    //   rowErrors.push("請填寫正確的購買來源");
    // }

    // 如果資料符合格式，加入有效資料陣列
    if (rowErrors.length > 0) {
      errors.push(`${rowErrors.join(", ")}`);
    } else {
      // 如果沒有錯誤，加入有效資料
      validRows.push({
        name,
        birthday,
        mobile,
        product_id,
        purchase_date,
        purchase_source,
      });
    }
  };

  // 讀取 CSV 檔案
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row, index) => validateRow(row, index))
      .on("end", () => resolve({ validRows, errors }))
      .on("error", reject);
  });
};
