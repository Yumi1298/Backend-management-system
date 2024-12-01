import fs from "fs";
import csvParser from "csv-parser";

export const parseCSV = async (filePath) => {
  const validRows = [];
  const errors = [];

  const validateRow = (row, index) => {
    const {
      name,
      birthday,
      mobile,
      product_id,
      purchase_date,
      purchase_source,
    } = row;

    // 驗證邏輯
    // if (!name || name.length < 2)
    //   errors.push(`第 ${index + 1} 行: 姓名需超過兩個字`);
    // if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday))
    //   errors.push(`第 ${index + 1} 行: 生日格式不符 (YYYY-MM-DD)`);
    // if (!/^09\d{8}$/.test(mobile))
    //   errors.push(`第 ${index + 1} 行: 手機需為台灣號碼格式 (09開頭)`);
    // if (!product_id) errors.push(`第 ${index + 1} 行: 產品 ID 不可為空`);
    // if (!/^\d{4}-\d{2}-\d{2}$/.test(purchase_date))
    //   errors.push(`第 ${index + 1} 行: 購買日期格式不符 (YYYY-MM-DD)`);
    // if (!["網路購買", "實體店面", "其他"].includes(purchase_source)) {
    //   errors.push(`第 ${index + 1} 行: 購買來源不在允許範圍內`);
    // }

    // 如果資料符合格式，加入有效資料陣列
    if (errors.length === 0) {
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
